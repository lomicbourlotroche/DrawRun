'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logger } = require('./src/utils/logger');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../DrawRun-Data');
const BACKUP_DIR = path.join(__dirname, '../backups');

function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        logger.error(`Backup directory not found: ${BACKUP_DIR}`);
        return [];
    }
    return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('DrawRun-Data-') && f.endsWith('.tar.gz'))
        .sort()
        .reverse();
}

function findBackup(filename) {
    if (filename) {
        const p = path.join(BACKUP_DIR, filename);
        if (fs.existsSync(p)) return p;
        logger.error(`Backup not found: ${filename}`);
        return null;
    }
    const backups = listBackups();
    if (backups.length === 0) {
        logger.error('No backups found');
        return null;
    }
    const latest = path.join(BACKUP_DIR, backups[0]);
    logger.info(`Latest backup: ${backups[0]}`);
    return latest;
}

async function restore(filename) {
    const backupPath = findBackup(filename);
    if (!backupPath) {
        process.exit(1);
    }

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    logger.info(`Restoring from: ${backupPath}`);
    logger.info(`Restoring to: ${DATA_DIR}`);

    try {
        execSync(`tar xzf "${backupPath}" -C "${path.dirname(DATA_DIR)}"`, { stdio: 'inherit' });
        logger.info('Restore completed successfully');
    } catch (err) {
        logger.error(`Restore failed: ${err.message}`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
const options = {
    list: args.includes('--list') || args.includes('-l'),
    filename: args.find(a => !a.startsWith('-')),
};

if (options.list) {
    const backups = listBackups();
    if (backups.length === 0) {
        logger.info('No backups found');
    } else {
        logger.info('Available backups:');
        backups.forEach((b, i) => logger.info(`  ${i + 1}. ${b}`));
    }
    process.exit(0);
}

restore(options.filename).then(() => {
    logger.info('Restore script finished');
    process.exit(0);
}).catch(err => {
    logger.error(`Restore script error: ${err.message}`);
    process.exit(1);
});
