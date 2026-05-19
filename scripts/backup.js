/**
 * ============================================================
 * BACKUP SCRIPT
 * ============================================================
 * Automated backup script for DrawRun-Data directory.
 * 
 * Usage:
 *   node scripts/backup.js                    # Backup to local directory
 *   node scripts/backup.js --s3               # Backup to S3
 *   node scripts/backup.js --cleanup 7        # Cleanup backups older than 7 days
 *   node scripts/backup.js --dry-run         # Test without actually backing up
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logger } = require('./src/utils/logger');

// Configuration
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../DrawRun-Data');
const BACKUP_DIR = path.join(__dirname, '../backups');
const DEFAULT_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    s3: args.includes('--s3'),
    cleanup: args.includes('--cleanup'),
    dryRun: args.includes('--dry-run'),
    retentionDays: parseInt(args.find(a => a.match(/^\d+$/))) || DEFAULT_RETENTION_DAYS
};

// Ensure directories exist
function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
}

// Get timestamp for backup naming
function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

// Create tar.gz archive
function createArchive(sourceDir, targetPath) {
    logger.info(`Creating archive: ${targetPath}`);
    if (options.dryRun) {
        logger.info('[DRY RUN] Would create archive');
        return true;
    }
    
    try {
        const tarCommand = `tar czf "${targetPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
        execSync(tarCommand);
        logger.info(`Archive created: ${targetPath}`);
        return true;
    } catch (err) {
        logger.error(`Failed to create archive: ${err.message}`);
        return false;
    }
}

// Upload to S3
async function uploadToS3(filePath, bucket, key) {
    if (options.dryRun) {
        logger.info('[DRY RUN] Would upload to S3: s3://${bucket}/${key}');
        return true;
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        logger.error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
        return false;
    }
    
    try {
        const awsCommand = `aws s3 cp "${filePath}" s3://${bucket}/${key}`;
        execSync(awsCommand);
        logger.info(`Uploaded to S3: s3://${bucket}/${key}`);
        return true;
    } catch (err) {
        logger.error(`Failed to upload to S3: ${err.message}`);
        return false;
    }
}

// Cleanup old backups
function cleanupOldBackups(dir, retentionDays) {
    logger.info(`Cleaning up backups older than ${retentionDays} days...`);
    
    if (options.dryRun) {
        logger.info('[DRY RUN] Would cleanup old backups');
        return;
    }
    
    try {
        const now = Date.now();
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.startsWith('DrawRun-Data-') && file.endsWith('.tar.gz')) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (now - stat.mtimeMs > retentionMs) {
                    fs.unlinkSync(filePath);
                    logger.info(`Deleted old backup: ${file}`);
                }
            }
        }
    } catch (err) {
        logger.error(`Failed to cleanup old backups: ${err.message}`);
    }
}

// Main backup function
async function backup() {
    logger.info('Starting backup...');
    
    // Ensure directories exist
    ensureDirectory(BACKUP_DIR);
    
    if (!fs.existsSync(DATA_DIR)) {
        logger.error(`Data directory not found: ${DATA_DIR}`);
        process.exit(1);
    }
    
    // Create backup archive name
    const timestamp = getTimestamp();
    const archiveName = `DrawRun-Data-${timestamp}.tar.gz`;
    const archivePath = path.join(BACKUP_DIR, archiveName);
    
    // Create archive
    const archiveCreated = createArchive(DATA_DIR, archivePath);
    if (!archiveCreated) {
        logger.error('Backup failed');
        process.exit(1);
    }
    
    // Upload to S3 if requested
    if (options.s3) {
        const bucket = process.env.BACKUP_S3_BUCKET || 'drawrun-backups';
        const key = `DrawRun-Data/${archiveName}`;
        const uploaded = await uploadToS3(archivePath, bucket, key);
        
        if (!uploaded) {
            logger.error('S3 upload failed');
            // Don't fail the backup if S3 upload fails
        }
    }
    
    // Cleanup old backups if requested
    if (options.cleanup) {
        cleanupOldBackups(BACKUP_DIR, options.retentionDays);
    }
    
    logger.info('Backup completed successfully');
    logger.info(`Backup location: ${archivePath}`);
    
    return { success: true, path: archivePath };
}

// Run backup
backup().then(() => {
    logger.info('Backup script finished');
    process.exit(0);
}).catch(err => {
    logger.error(`Backup script error: ${err.message}`);
    process.exit(1);
});
