'use strict';

/**
 * Metrics service stub — prom-client désactivé en production simple.
 */

class MetricsService {
    middleware() {
        return (req, res, next) => next();
    }

    getContentType() {
        return 'text/plain';
    }

    async getMetrics() {
        return '# Metrics disabled\n';
    }

    increment() {}
    observe() {}
    set() {}
}

module.exports = new MetricsService();
