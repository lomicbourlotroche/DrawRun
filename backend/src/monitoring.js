'use strict';

/* eslint-disable unused-imports/no-unused-vars */

/**
 * ============================================================
 * DRAWRUN MONITORING & METRICS
 * ============================================================
 * Uses the sql.js per-user DB API (dbGetMain, dbAllMain).
 * Mounted in index.js at /monitoring.
 */

const express = require('express');
const { dbGetMain, dbAllMain, isInitialized } = require('./database');
const { logInfo, logError } = require('./logger');

const router = express.Router();

// ============================================================================
// METRICS REGISTRY (Prometheus-compatible)
// ============================================================================

const metrics = {
    httpRequestsTotal: new Map(),
    httpRequestDuration: [],
};

// ============================================================================
// MIDDLEWARE: Track HTTP requests
// ============================================================================

const metricsMiddleware = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const key = `${req.method}:${req.path}:${res.statusCode}`;

        metrics.httpRequestsTotal.set(key, (metrics.httpRequestsTotal.get(key) || 0) + 1);

        metrics.httpRequestDuration.push({
            path: req.path,
            method: req.method,
            status: res.statusCode,
            duration: durationMs,
            timestamp: Date.now(),
        });

        // Keep only last 1000 samples
        if (metrics.httpRequestDuration.length > 1000) {
            metrics.httpRequestDuration = metrics.httpRequestDuration.slice(-500);
        }
    });

    next();
};

// ============================================================================
// GET /monitoring/metrics — Prometheus format
// ============================================================================

router.get('/metrics', async (req, res) => {
    let activeUsers = 0;
    let totalUsers = 0;

    try {
        if (isInitialized()) {
            const result = await dbGetMain('SELECT COUNT(*) as count FROM users');
            totalUsers = result?.count || 0;
        }
    } catch (e) { /* db not ready */ }

    const lines = [
        '# HELP drawrun_http_requests_total Total HTTP requests',
        '# TYPE drawrun_http_requests_total counter',
    ];

    metrics.httpRequestsTotal.forEach((count, key) => {
        const parts = key.split(':');
        const method = parts[0];
        const status = parts[parts.length - 1];
        const path = parts.slice(1, -1).join(':').replace(/\/\d+/g, '/:id');
        lines.push(`drawrun_http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    });

    // Percentiles
    const durations = metrics.httpRequestDuration
        .filter(r => r.path.startsWith('/api'))
        .map(r => r.duration)
        .sort((a, b) => a - b);

    if (durations.length > 0) {
        const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
        const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
        const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
        lines.push('', '# HELP drawrun_http_request_duration_ms HTTP request duration in ms');
        lines.push('# TYPE drawrun_http_request_duration_ms histogram');
        lines.push(`drawrun_http_request_duration_ms{quantile="0.5"} ${p50.toFixed(2)}`);
        lines.push(`drawrun_http_request_duration_ms{quantile="0.95"} ${p95.toFixed(2)}`);
        lines.push(`drawrun_http_request_duration_ms{quantile="0.99"} ${p99.toFixed(2)}`);
    }

    lines.push('', '# HELP drawrun_total_users Total registered users');
    lines.push('# TYPE drawrun_total_users gauge');
    lines.push(`drawrun_total_users ${totalUsers}`);

    lines.push('', '# HELP drawrun_uptime_seconds Process uptime');
    lines.push('# TYPE drawrun_uptime_seconds gauge');
    lines.push(`drawrun_uptime_seconds ${process.uptime().toFixed(0)}`);

    lines.push('', '# HELP drawrun_memory_rss_bytes Process RSS memory');
    lines.push('# TYPE drawrun_memory_rss_bytes gauge');
    lines.push(`drawrun_memory_rss_bytes ${process.memoryUsage().rss}`);

    lines.push('', '# HELP drawrun_memory_heap_used_bytes Process heap used');
    lines.push('# TYPE drawrun_memory_heap_used_bytes gauge');
    lines.push(`drawrun_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`);

    const cpu = process.cpuUsage();
    lines.push('', '# HELP drawrun_process_cpu_seconds_total Process CPU time');
    lines.push('# TYPE drawrun_process_cpu_seconds_total counter');
    lines.push(`drawrun_process_cpu_seconds_total{type="user"} ${cpu.user}`);
    lines.push(`drawrun_process_cpu_seconds_total{type="system"} ${cpu.system}`);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(lines.join('\n'));
});

// ============================================================================
// GET /monitoring/health/detailed — Detailed health check
// ============================================================================

router.get('/health/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        uptime: process.uptime(),
        components: {},
        metrics: {},
    };

    // Database check
    try {
        const start = Date.now();
        await dbGetMain('SELECT 1 as ok');
        health.components.database = {
            status: 'healthy',
            responseTime: Date.now() - start,
            type: 'sqlite (sql.js)',
            mode: 'per-user-db',
        };
    } catch (e) {
        health.components.database = { status: 'unhealthy', error: e.message };
        health.status = 'degraded';
    }

    // External services
    health.components.external = {
        strava: { configured: !!process.env.STRAVA_CLIENT_ID },
        garmin: { configured: !!process.env.GARMIN_USERNAME },
        smtp:   { configured: !!process.env.SMTP_HOST },
    };

    // Stats
    try {
        const users = await dbGetMain('SELECT COUNT(*) as count FROM users');
        health.metrics.users = users?.count || 0;
    } catch (e) {
        logError('Stats fetch failed', { error: e.message });
    }

    // Memory
    const mem = process.memoryUsage();
    health.memory = {
        rss:       `${(mem.rss       / 1024 / 1024).toFixed(1)} MB`,
        heapUsed:  `${(mem.heapUsed  / 1024 / 1024).toFixed(1)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    };

    if (mem.heapUsed / mem.heapTotal > 0.9) {
        health.status = 'degraded';
        health.warnings = ['Memory usage above 90%'];
    }

    res.json(health);
});

// ============================================================================
// GET /monitoring/ready — Readiness probe
// ============================================================================

router.get('/ready', async (req, res) => {
    try {
        await dbGetMain('SELECT 1 as ok');
        res.json({ ready: true });
    } catch (e) {
        res.status(503).json({ ready: false, error: 'Database not ready' });
    }
});

// ============================================================================
// GET /monitoring/live — Liveness probe
// ============================================================================

router.get('/live', (req, res) => {
    res.json({ alive: true, uptime: process.uptime() });
});

// ============================================================================
// ERROR TRACKING
// ============================================================================

const errors = [];

const trackError = (error, context = {}) => {
    errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        context,
    });
    if (errors.length > 100) errors.shift();
    logError('Tracked error', { message: error.message, context });
};

router.get('/errors', (req, res) => {
    // Simple admin guard — in production use a proper admin middleware
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@drawrun.fr';
    if (!req.user || req.user.email !== adminEmail) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    res.json({ errors: errors.slice(-50), total: errors.length });
});

module.exports = { router, metricsMiddleware, metrics, trackError };
