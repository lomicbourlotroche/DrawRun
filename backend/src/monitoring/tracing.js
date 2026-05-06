'use strict';

/**
 * Tracing stub — OpenTelemetry désactivé en production simple.
 * Remplacer par la vraie implémentation si Jaeger/Prometheus sont disponibles.
 */

const { logger } = require('../logger');

async function initializeTracing(options = {}) {
    logger.info('Tracing disabled (stub mode)');
}

async function withTracing(name, fn) {
    return fn();
}

function addSpanAttributes() {}
function addSpanEvent() {}
function recordSpanError() {}

module.exports = { initializeTracing, withTracing, addSpanAttributes, addSpanEvent, recordSpanError };
