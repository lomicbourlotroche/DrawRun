/**
 * ============================================================
 * REDIS CONFIGURATION
 * ============================================================
 * Configuration et connexion Redis pour cache distribué
 */

'use strict';
const { logger } = require('../utils/logger');

const Redis = require('ioredis');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.client) return this.client;

        const redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            logger.info('ℹ️  REDIS_URL not configured, using in-memory cache fallback');
            return null;
        }

        try {
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    if (times > 10) return null; // Stop retrying after 10 attempts
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: false,
                reconnectOnError: (err) => {
                    const targetErrors = ['READONLY', 'ECONNRESET'];
                    return targetErrors.some(msg => err.message.includes(msg));
                }
            });

            this.client.on('connect', () => {
                logger.info('🔌 Redis connected');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                logger.info('✅ Redis ready');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                logger.error('❌ Redis error:', err.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                logger.info('🔌 Redis connection closed');
                this.isConnected = false;
            });

            // Test connection
            await this.client.ping();
            this.isConnected = true;
            logger.info('✅ Redis connection verified');
            return this.client;
        } catch (err) {
            logger.error('❌ Failed to connect to Redis:', err.message);
            this.client = null;
            this.isConnected = false;
            return null;
        }
    }

    getClient() {
        return this.client;
    }

    async healthCheck() {
        if (!this.client || !this.isConnected) {
            return { status: 'disconnected', connected: false };
        }

        try {
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;
            
            return { 
                status: 'connected', 
                connected: true, 
                latency: `${latency}ms` 
            };
        } catch (err) {
            return { 
                status: 'error', 
                connected: false, 
                error: err.message 
            };
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
}

module.exports = new RedisClient();
