/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * ============================================================
 * PROFILE ROUTES
 * ============================================================
 * Gestion du profil utilisateur
 * 
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

'use strict';
const { logger } = require('../logger');

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { verifyToken } = require('../auth');
const { dbGetMain, dbRunMain } = require('../database');
const { validateBody, validateProfileBody } = require('../validators');
const { updateUserProfileFromMain } = require('../services/userConstants.service');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

async function ensureUploadDir() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
        logger.error('Failed to create upload directory:', err);
    }
}
ensureUploadDir();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               fcm:
 *                 type: number
 *                 description: Max heart rate
 *               vma:
 *                 type: number
 *                 description: VO2Max velocity
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await dbGetMain(
            `SELECT id, email, name, profile_data, created_at, updated_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        let profileData = {};
        try {
            profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
        } catch {
            profileData = {};
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            ...profileData,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

router.put('/', verifyToken, validateBody(validateProfileBody), async (req, res) => {
    try {
        const { name, fcm, vma, weight, height, restingHR, sex, age, fav_sports, weeklyKm, vdot, goal } = req.body;
        
        // Get current profile_data
        const currentUser = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
        let profileData = {};
        try {
            profileData = currentUser?.profile_data ? JSON.parse(currentUser.profile_data) : {};
        } catch {
            profileData = {};
        }

        // Update profile_data with new values
        if (fcm !== undefined) profileData.fcm = fcm;
        if (vma !== undefined) profileData.vma = vma;
        if (weight !== undefined) profileData.weight = weight;
        if (height !== undefined) profileData.height = height;
        if (restingHR !== undefined) profileData.restingHR = restingHR;
        if (sex !== undefined) profileData.sex = sex;
        if (age !== undefined) profileData.age = age;
        if (fav_sports !== undefined) profileData.fav_sports = fav_sports;
        if (weeklyKm !== undefined) profileData.weeklyKm = weeklyKm;
        if (vdot !== undefined) profileData.vdot = vdot;
        if (goal !== undefined) profileData.goal = goal;

        const effectiveName = name !== undefined && name !== '' ? name : undefined;
        if (effectiveName) {
            await dbRunMain(`
                UPDATE users SET name = ?, profile_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [name, JSON.stringify(profileData), req.user.id]);
        } else {
            await dbRunMain(`
                UPDATE users SET profile_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(profileData), req.user.id]);
        }

        await updateUserProfileFromMain(req.user.id, profileData);
        
        res.json({ success: true });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.post('/avatar', verifyToken, async (req, res) => {
    try {
        const { avatar } = req.body;
        if (!avatar || !avatar.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Invalid image data' });
        }

        const matches = avatar.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches || matches.length < 3) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
            return res.status(400).json({ error: 'Unsupported image format' });
        }

        const buffer = Buffer.from(matches[2], 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image too large (max 5MB)' });
        }

        const filename = `avatar_${req.user.id}_${Date.now()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(filepath, buffer);

        const avatarUrl = `/uploads/avatars/${filename}`;

        const currentUser = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
        let profileData = {};
        try {
            profileData = currentUser?.profile_data ? JSON.parse(currentUser.profile_data) : {};
        } catch {
            profileData = {};
        }

        if (profileData.avatar_url) {
            // Validate path to prevent traversal
            const avatarRelPath = profileData.avatar_url;
            if (avatarRelPath && !avatarRelPath.includes('..') && avatarRelPath.startsWith('/uploads/avatars/')) {
                const oldPath = path.join(__dirname, '..', '..', avatarRelPath);
                try {
                    await fs.unlink(oldPath);
                } catch {
                    /* ignore */
                }
            }
        }

        profileData.avatar_url = avatarUrl;
        await dbRunMain(
            'UPDATE users SET profile_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(profileData), req.user.id]
        );

        logger.info(`Avatar uploaded for user ${req.user.id}`);
        res.json({ success: true, avatar_url: avatarUrl });
    } catch (error) {
        logger.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

module.exports = router;
