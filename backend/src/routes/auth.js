/* eslint-disable unused-imports/no-unused-vars, no-process-exit, no-empty, security/detect-non-literal-fs-filename, no-undef */
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { dbGetMain, dbRunMain, dbAllMain, getUserDb, getUserDbByEmail, sanitizeEmail } = require('../database');
const { encrypt, decrypt } = require('../utils/crypto');
const { auditLog, securityLog, logger } = require('../utils/logger');
const { has2FAEnabled, has2FAPending, verify2FAToken, generate2FASecret, enable2FA, disable2FA } = require('../services/auth/2fa.service');
const { isValidEmail, isStrongPassword } = require('../utils/validators');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt');
const { otpLimiter } = require('../middleware/security');
const { verifyToken } = require('../middleware/auth');
const { isOtpLocked, incrementOtpAttempts, clearOtpAttempts } = require('../services/auth/otp.service');
const { triggerBackgroundSync } = require('../services/auth/sync.service');

const dbGet = (query, params = []) => dbGetMain(query, params);
const dbRun = (query, params = []) => dbRunMain(query, params);
const dbAll = (query, params = []) => dbAllMain(query, params);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    logger.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}

if (!process.env.CREDENTIALS_SECRET) {
    logger.error('FATAL: CREDENTIALS_SECRET environment variable is required');
    process.exit(1);
}

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    } : undefined,
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password, totpCode } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await dbGet('SELECT id, email, password_hash, profile_data, created_at, last_login, garmin_username, twofa_enabled, totp_secret FROM users WHERE email = ?', [normalizedEmail]);
        
        logger.info(`Login attempt for ${normalizedEmail}, user found: ${!!user}`);
        
        if (!user) {
            securityLog('LOGIN_FAILED', 'MEDIUM', { email, reason: 'User not found', ip: req.ip });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            securityLog('LOGIN_FAILED', 'MEDIUM', { userId: user.id, reason: 'Invalid password', ip: req.ip });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if 2FA is enabled
        if (user.twofa_enabled === 1) {
            if (!totpCode) {
                return res.status(200).json({ 
                    requires2FA: true, 
                    message: 'Please provide your 2FA code' 
                });
            }
            
            const totpResult = await verify2FAToken(user.id, totpCode);
            if (!totpResult.valid) {
                securityLog('LOGIN_2FA_FAILED', 'MEDIUM', { userId: user.id, reason: 'Invalid 2FA code', ip: req.ip });
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }
        
        // Update last login
        await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        const token = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = await generateRefreshToken({ id: user.id, email: user.email });
        
        // Parse profile_data for name
        let profileName = null;
        if (user.profile_data) {
            try {
                const profile = JSON.parse(user.profile_data);
                profileName = profile.name || null;
            } catch (e) {}
        }
        
        // Audit log successful login
        auditLog('LOGIN', user.id, { method: 'password', ip: req.ip }, req);
        
        // Parse profile_data for additional fields
        let profileData = {};
        try {
            profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
        } catch {
            profileData = {};
        }
        
        // Trigger background sync if user has Garmin configured
        const hasGarmin = !!user.garmin_username;
        if (hasGarmin) {
            triggerBackgroundSync(user.id, hasGarmin);
        }
        
        // Check if user has Decathlon credentials
        const decAuthCred = await dbGet(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [user.id, 'decathlon_login']
        );
        const hasDecathlon = !!decAuthCred;
        
        res.json({
            token,
            refreshToken,
            expiresIn: 900,
            userId: user.id,
            has_garmin: hasGarmin,
            has_decathlon: hasDecathlon,
            twofa_enabled: user.twofa_enabled === 1,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: profileName || user.email.split('@')[0],
                fcm: profileData.fcm || null,
                vma: profileData.vma || null,
                weight: profileData.weight || null,
                restingHR: profileData.restingHR || null,
                sex: profileData.sex || null,
                age: profileData.age || null,
                garmin_enabled: hasGarmin,
                has_garmin: hasGarmin,
                has_decathlon: hasDecathlon,
                created_at: user.created_at,
                last_login: user.last_login
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }
    
    try {
        const verification = await verifyRefreshToken(refreshToken);
        if (!verification.valid) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
        
        const result = await rotateRefreshToken(refreshToken, {
            id: verification.user.id,
            email: verification.user.email
        });
        
        if (!result.success) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
        
        res.json({
            token: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: 900
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }
        auditLog('LOGOUT', req.user.id, { ip: req.ip }, req);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    try {
        logger.info(`[Register] Step 1: Checking existing user for ${normalizedEmail}`);
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        
        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        logger.info(`[Register] Step 2: Hashing password`);
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        
        logger.info(`[Register] Step 3: Inserting user`);
        const result = await dbRun('INSERT INTO users (email, password_hash, profile_data) VALUES (?, ?, ?)', [normalizedEmail, passwordHash, JSON.stringify({ name })]);
        logger.info(`[Register] Step 3 done: lastID=${result.lastID}`);
        
        logger.info(`[Register] Step 4: Generating access token`);
        const token = generateAccessToken({ id: result.lastID, email: normalizedEmail });
        
        logger.info(`[Register] Step 5: Generating refresh token`);
        const refreshToken = await generateRefreshToken({ id: result.lastID, email: normalizedEmail });
        logger.info(`[Register] Step 5 done`);
        
        // Send welcome email
        if (process.env.SMTP_HOST) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || 'noreply@draw-server.fr',
                    to: email,
                    subject: 'Welcome to DrawRun!',
                    html: `<h1>Welcome to DrawRun!</h1><p>Hi ${name || 'there'},</p><p>Thank you for joining DrawRun. Your account has been successfully created.</p><p>You can now start tracking your activities and connecting your Strava/Garmin accounts.</p><p>Best regards,<br/>The DrawRun Team</p>`
                });
                logger.info(`Welcome email sent to: ${email}`);
            } catch (emailError) {
                logger.error('Failed to send welcome email:', emailError);
            }
        }
        
        logger.info(`[Register] Step 6: Sending response`);
        res.status(201).json({
            token,
            refreshToken,
            expiresIn: 900,
            userId: result.lastID,
            message: 'User registered successfully',
            user: {
                id: result.lastID,
                email,
                name,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Registration error:', { message: error?.message, code: error?.code });
        const isProd = process.env.NODE_ENV === 'production';
        res.status(500).json({ error: isProd ? 'Registration failed' : (error?.message || 'Unknown error') });
    }
});

// Delete account
router.post('/delete_account', verifyToken, async (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    try {
        const user = await dbGet('SELECT id, email, password_hash FROM users WHERE id = ?', [req.user.id]);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Delete user data
        const userId = req.user.id;
        await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        
        // Revoke all refresh tokens on account deletion
        await revokeAllUserTokens(userId);
        
        // Delete personal database file
        try {
            const fs = require('fs');
            const path = require('path');
            const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../DrawRun-Data');
            const userDbPath = path.join(dataDir, `user_${sanitizeEmail(user.email)}.db`);
            if (fs.existsSync(userDbPath)) {
                fs.unlinkSync(userDbPath);
            }
            // Delete garmin tokens
            const garminTokensDir = path.join(dataDir, 'garmin_tokens', String(userId));
            if (fs.existsSync(garminTokensDir)) {
                fs.rmSync(garminTokensDir, { recursive: true, force: true });
            }
            // Delete strava tokens
            const stravaTokensDir = path.join(dataDir, 'strava_tokens', String(userId));
            if (fs.existsSync(stravaTokensDir)) {
                fs.rmSync(stravaTokensDir, { recursive: true, force: true });
            }
        } catch (fileErr) {
            logger.error('Error deleting user files:', fileErr.message);
        }
        
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        logger.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Forgot password request (OTP)
router.post('/forgot-password/request', otpLimiter, async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }
    
    // SECURITY: Check OTP lockout (DB-persisted)
    const lockCheck = await isOtpLocked(email.toLowerCase().trim());
    if (lockCheck.locked) {
        return res.status(429).json({ 
            error: `Too many attempts, please retry in ${lockCheck.remainingMinutes} minutes` 
        });
    }
    
    try {
        const user = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        
        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: 'If email exists, OTP will be sent' });
        }
        
        // Generate OTP using cryptographically secure random
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        await dbRun(
            'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
            [otp, otpExpiry.toISOString(), user.id]
        );
        
        // Send OTP via email
        if (process.env.SMTP_HOST) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || 'noreply@draw-server.fr',
                    to: email,
                    subject: 'DrawRun - Password Reset OTP',
                    html: `<h1>Password Reset OTP</h1><p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p><p>If you didn't request this, please ignore this email.</p>`
                });
                logger.info(`OTP email sent to: ${email}`);
                res.json({ message: 'OTP sent to your email' });
            } catch (emailError) {
                logger.error('Failed to send OTP email:', emailError);
                res.status(500).json({ error: 'Failed to send OTP email' });
            }
        } else {
            // SMTP not configured — reject the request
            res.status(503).json({ error: 'Email service not configured. Contact support.' });
        }
    } catch (error) {
        logger.error('Forgot password request error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Forgot password confirm (OTP)
router.post('/forgot-password/confirm', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // SECURITY: Check OTP lockout (DB-persisted)
    const lockCheck = await isOtpLocked(normalizedEmail);
    if (lockCheck.locked) {
        return res.status(429).json({ 
            error: `Too many invalid attempts, please retry in ${lockCheck.remainingMinutes} minutes` 
        });
    }
    
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    }
    
    try {
        const user = await dbGet(
            'SELECT id, email FROM users WHERE email = ? AND otp = ? AND otp_expiry > ?',
            [normalizedEmail, otp, new Date().toISOString()]
        );
        
        if (!user) {
            // SECURITY: Track failed OTP attempts (DB-persisted)
            const attempts = await incrementOtpAttempts(normalizedEmail);
            if (attempts.lockedUntil) {
                return res.status(429).json({ 
                    error: 'Too many invalid attempts, please request a new OTP in 30 minutes' 
                });
            }
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        // Clear OTP attempts on successful verification
        await clearOtpAttempts(normalizedEmail);
        
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        
        await dbRun(
            'UPDATE users SET password_hash = ?, otp = NULL, otp_expiry = NULL WHERE id = ?',
            [passwordHash, user.id]
        );
        
        // Send confirmation email
        if (process.env.SMTP_HOST) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || 'noreply@draw-server.fr',
                    to: email,
                    subject: 'DrawRun - Password Changed Successfully',
                    html: `<h1>Password Changed</h1><p>Your DrawRun password has been successfully changed.</p><p>If you didn't make this change, please contact support immediately.</p>`
                });
                logger.info(`Password change confirmation sent to: ${email}`);
            } catch (emailError) {
                logger.error('Failed to send confirmation email:', emailError);
            }
        }
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        logger.error('Forgot password confirm error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Save profile
router.post('/profile', verifyToken, async (req, res) => {
    const { name, preferences, weight, height, max_heart_rate, resting_heart_rate } = req.body;
    
    try {
        const profileData = { name, preferences, weight, height, max_heart_rate, resting_heart_rate };
        await dbRun(
            'UPDATE users SET profile_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(profileData), req.user.id]
        );
        
        res.json({ message: 'Profile saved successfully', profile: profileData });
    } catch (error) {
        logger.error('Save profile error:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Save Garmin credentials
router.post('/credentials/garmin', verifyToken, async (req, res) => {
    const { username, email, password } = req.body;
    const resolvedUsername = username || email;
    
    if (!resolvedUsername || !password) {
        return res.status(400).json({ error: 'Username (or email) and password required' });
    }
    
    try {
        await dbRun(
            `INSERT OR REPLACE INTO user_credentials 
             (user_id, provider, username, password, enabled, updated_at) 
             VALUES (?, 'garmin', ?, ?, 1, CURRENT_TIMESTAMP)`,
            [req.user.id, resolvedUsername, encrypt(password)]
        );
        
        res.json({ message: 'Garmin credentials saved successfully' });
    } catch (error) {
        logger.error('Save Garmin credentials error:', error);
        res.status(500).json({ error: 'Failed to save Garmin credentials' });
    }
});

// Disconnect Garmin
router.post('/disconnect/garmin', verifyToken, async (req, res) => {
    try {
        await dbRun(
            'UPDATE user_credentials SET enabled = 0, username = NULL, password = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?',
            [req.user.id, 'garmin']
        );
        
        try {
            const { clearGarminTokens } = require('../services/sync/garmin');
            await clearGarminTokens(req.user.id);
        } catch (e) {
            logger.warn('Token clear warning:', e.message);
        }
        
        res.json({ success: true, message: 'Garmin disconnected' });
    } catch (error) {
        logger.error('Disconnect Garmin error:', error);
        res.status(500).json({ error: 'Failed to disconnect Garmin' });
    }
});

// Save Strava credentials
router.post('/credentials/strava', verifyToken, async (req, res) => {
    const { accessToken, refreshToken, expiresAt, athleteId } = req.body;
    
    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }
    
    try {
        await dbRun(
            `INSERT OR REPLACE INTO user_credentials 
             (user_id, provider, access_token, refresh_token, expires_at, athlete_id, enabled, updated_at) 
             VALUES (?, 'strava', ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [req.user.id, encrypt(accessToken), refreshToken ? encrypt(refreshToken) : null, expiresAt, athleteId]
        );
        
        res.json({ message: 'Strava credentials saved successfully' });
    } catch (error) {
        logger.error('Save Strava credentials error:', error);
        res.status(500).json({ error: 'Failed to save Strava credentials' });
    }
});

// Disconnect Strava
router.post('/disconnect/strava', verifyToken, async (req, res) => {
    try {
        await dbRun(
            'UPDATE user_credentials SET enabled = 0, access_token = NULL, refresh_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?',
            [req.user.id, 'strava']
        );
        
        res.json({ success: true, message: 'Strava disconnected' });
    } catch (error) {
        logger.error('Disconnect Strava error:', error);
        res.status(500).json({ error: 'Failed to disconnect Strava' });
    }
});

// Save Suunto credentials
router.post('/credentials/suunto', verifyToken, async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        await dbRun(
            `INSERT OR REPLACE INTO user_credentials 
             (user_id, provider, username, password, enabled, updated_at) 
             VALUES (?, 'suunto', ?, ?, 1, CURRENT_TIMESTAMP)`,
            [req.user.id, username, encrypt(password)]
        );
        
        res.json({ message: 'Suunto credentials saved successfully' });
    } catch (error) {
        logger.error('Save Suunto credentials error:', error);
        res.status(500).json({ error: 'Failed to save Suunto credentials' });
    }
});

// Disconnect Suunto
router.post('/disconnect/suunto', verifyToken, async (req, res) => {
    try {
        await dbRun(
            'UPDATE user_credentials SET enabled = 0, username = NULL, password = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?',
            [req.user.id, 'suunto']
        );
        
        res.json({ success: true, message: 'Suunto disconnected' });
    } catch (error) {
        logger.error('Disconnect Suunto error:', error);
        res.status(500).json({ error: 'Failed to disconnect Suunto' });
    }
});

// Save Decathlon credentials (login credentials for Playwright-based sync)
router.post('/credentials/decathlon', verifyToken, async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        await dbRun(
            `INSERT OR REPLACE INTO user_credentials 
             (user_id, provider, username, password, enabled, updated_at) 
             VALUES (?, 'decathlon_login', ?, ?, 1, CURRENT_TIMESTAMP)`,
            [req.user.id, email, encrypt(password)]
        );
        
        res.json({ message: 'Decathlon credentials saved successfully' });
    } catch (error) {
        logger.error('Save Decathlon credentials error:', error);
        res.status(500).json({ error: 'Failed to save Decathlon credentials' });
    }
});

// Disconnect Decathlon
router.post('/disconnect/decathlon', verifyToken, async (req, res) => {
    try {
        const { disconnectDecathlon } = require('../services/sync/decathlon');
        await disconnectDecathlon(req.user.id);
        
        res.json({ success: true, message: 'Decathlon disconnected' });
    } catch (error) {
        logger.error('Disconnect Decathlon error:', error);
        res.status(500).json({ error: 'Failed to disconnect Decathlon' });
    }
});



// Get profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await dbGet(
            'SELECT id, email, profile_data, created_at, last_login FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
        
        // Check if user has Garmin credentials
        const garminCreds = await dbGet(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [req.user.id, 'garmin']
        );
        const hasGarmin = !!garminCreds;
        
        // Check if user has Decathlon credentials
        const decathlonCreds = await dbGet(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [req.user.id, 'decathlon_login']
        );
        const hasDecathlon = !!decathlonCreds;
        
        res.json({
            id: user.id,
            email: user.email,
            ...profileData,
            garmin_enabled: hasGarmin,
            decathlon_enabled: hasDecathlon,
            has_garmin: hasGarmin,
            has_decathlon: hasDecathlon,
            created_at: user.created_at,
            last_login: user.last_login
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password required' });
    }
    
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    }
    
    try {
        const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        
        await dbRun(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, req.user.id]
        );
        
        res.json({ message: 'Password changed successfully' });
        auditLog('PASSWORD_CHANGE', req.user.id, { ip: req.ip }, req);
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ============================================================================
// 2FA Routes
// ============================================================================

// Generate 2FA secret (setup)
router.post('/2fa/setup', verifyToken, async (req, res) => {
    try {
        const user = await dbGet('SELECT email FROM users WHERE id = ?', [req.user.id]);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.twofa_enabled === 1) {
            return res.status(400).json({ error: '2FA is already enabled' });
        }
        
        const result = await generate2FASecret(req.user.id, user.email);
        
        auditLog('2FA_SETUP_INITIATED', req.user.id, { ip: req.ip }, req);
        
        res.json({
            success: true,
            secret: result.secret,
            uri: result.uri,
            message: 'Scan this QR code with your authenticator app, then verify with /api/auth/2fa/enable'
        });
    } catch (error) {
        logger.error('2FA setup error:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});

// Enable 2FA (verify and activate)
router.post('/2fa/enable', verifyToken, async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'OTP token required' });
    }
    
    try {
        const result = await enable2FA(req.user.id, token);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        auditLog('2FA_ENABLE', req.user.id, { ip: req.ip }, req);
        
        res.json({
            success: true,
            message: '2FA has been enabled successfully'
        });
    } catch (error) {
        logger.error('2FA enable error:', error);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
});

// Disable 2FA
router.post('/2fa/disable', verifyToken, async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'OTP token required' });
    }
    
    try {
        const result = await disable2FA(req.user.id, token);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        auditLog('2FA_DISABLE', req.user.id, { ip: req.ip }, req);
        
        res.json({
            success: true,
            message: '2FA has been disabled'
        });
    } catch (error) {
        logger.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

// Get 2FA status
router.get('/2fa/status', verifyToken, async (req, res) => {
    try {
        const enabled = await has2FAEnabled(req.user.id);
        const pending = await has2FAPending(req.user.id);
        
        res.json({
            enabled: enabled,
            pending: pending
        });
    } catch (error) {
        logger.error('2FA status error:', error);
        res.status(500).json({ error: 'Failed to get 2FA status' });
    }
});

// ============================================================================
// GDPR Export Routes
// ============================================================================

// Export all user data (GDPR compliance)
router.get('/export', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_login: user.last_login,
                profile_data: user.profile_data ? JSON.parse(user.profile_data) : null
            },
            activities: [],
            training_plans: [],
            performance_metrics: [],
            social: {
                friends: [],
                groups: [],
                challenges: []
            }
        };
        
        // Export activities with pagination
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const offset = parseInt(req.query.offset) || 0;
        const activities = await dbAll(userDb, 'SELECT * FROM activities ORDER BY start_date DESC LIMIT ? OFFSET ?', [limit, offset]);
        exportData.activities = activities;
        
        // Export training plans (limit to last 100)
        const plans = await dbAll(userDb, 'SELECT * FROM training_plans LIMIT 100', []);
        exportData.training_plans = plans;
        
        // Export performance metrics (limit to last 365 days)
        const metrics = await dbAll(userDb, 'SELECT * FROM performance_metrics ORDER BY metric_date DESC LIMIT 365', []);
        exportData.performance_metrics = metrics;
        
        auditLog('DATA_EXPORT', req.user.id, { ip: req.ip }, req);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="drawrun-export-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        logger.error('Data export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

module.exports = { router, verifyToken };
