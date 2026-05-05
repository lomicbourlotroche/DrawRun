/**
 * ============================================================
 * PROMETHEUS METRICS SERVICE
 * ============================================================
 * Métriques pour monitoring avec Prometheus/Grafana
 */

'use strict';

const client = require('prom-client');

class MetricsService {
    constructor() {
        this.register = new client.Registry();
        
        // Add default metrics (CPU, memory, event loop, etc.)
        client.collectDefaultMetrics({ 
            register: this.register,
            prefix: 'drawrun_'
        });
        
        this.setupCustomMetrics();
    }

    setupCustomMetrics() {
        // HTTP request duration
        this.httpRequestDuration = new client.Histogram({
            name: 'drawrun_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register]
        });

        // HTTP request count
        this.httpRequestTotal = new client.Counter({
            name: 'drawrun_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register]
        });

        // Active connections
        this.activeConnections = new client.Gauge({
            name: 'drawrun_active_connections',
            help: 'Number of active connections',
            registers: [this.register]
        });

        // Database operations
        this.dbOperations = new client.Counter({
            name: 'drawrun_db_operations_total',
            help: 'Total database operations',
            labelNames: ['operation', 'table'],
            registers: [this.register]
        });

        // Cache operations
        this.cacheOperations = new client.Counter({
            name: 'drawrun_cache_operations_total',
            help: 'Total cache operations',
            labelNames: ['operation', 'result'],
            registers: [this.register]
        });

        // Sync operations
        this.syncOperations = new client.Counter({
            name: 'drawrun_sync_operations_total',
            help: 'Total sync operations',
            labelNames: ['platform', 'status'],
            registers: [this.register]
        });

        // User activity
        this.userActivity = new client.Counter({
            name: 'drawrun_user_activity_total',
            help: 'Total user activities created',
            labelNames: ['type'],
            registers: [this.register]
        });

        // Algorithm calculations
        this.algorithmCalculations = new client.Counter({
            name: 'drawrun_algorithm_calculations_total',
            help: 'Total algorithm calculations',
            labelNames: ['algorithm'],
            registers: [this.register]
        });
    }

    /**
     * Express middleware to collect HTTP metrics
     */
    middleware() {
        return (req, res, next) => {
            const start = Date.now();
            
            // Capture response finish
            res.on('finish', () => {
                const duration = (Date.now() - start) / 1000;
                const route = req.route ? req.route.path : req.path;
                const method = req.method;
                const statusCode = res.statusCode;
                
                this.httpRequestDuration
                    .labels(method, route, statusCode)
                    .observe(duration);
                
                this.httpRequestTotal
                    .labels(method, route, statusCode)
                    .inc();
            });
            
            next();
        };
    }

    /**
     * Record database operation
     */
    recordDbOperation(operation, table) {
        this.dbOperations.labels(operation, table).inc();
    }

    /**
     * Record cache operation
     */
    recordCacheOperation(operation, result) {
        this.cacheOperations.labels(operation, result).inc();
    }

    /**
     * Record sync operation
     */
    recordSyncOperation(platform, status) {
        this.syncOperations.labels(platform, status).inc();
    }

    /**
     * Record user activity
     */
    recordUserActivity(type) {
        this.userActivity.labels(type).inc();
    }

    /**
     * Record algorithm calculation
     */
    recordAlgorithmCalculation(algorithm) {
        this.algorithmCalculations.labels(algorithm).inc();
    }

    /**
     * Update active connections
     */
    setActiveConnections(count) {
        this.activeConnections.set(count);
    }

    /**
     * Get metrics in Prometheus format
     */
    async getMetrics() {
        return this.register.metrics();
    }

    /**
     * Get content type for metrics endpoint
     */
    getContentType() {
        return this.register.contentType;
    }
}

module.exports = new MetricsService();
