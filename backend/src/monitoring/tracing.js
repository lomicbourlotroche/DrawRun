/**
 * ============================================================
 * OPEN TELEMETRY TRACING - Monitoring Avancé
 * ============================================================
 * 
 * Configuration du tracing distribué avec OpenTelemetry
 * Support: Prometheus + Jaeger pour production
 * 
 * @module monitoring/tracing
 */

'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry-exporter-prometheus');
const { JaegerExporter } = require('@opentelemetry-exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { logger } = require('../logger');

/**
 * Initialise le monitoring OpenTelemetry
 * @param {Object} options - Options de configuration
 * @returns {Promise<NodeSDK>} Instance du SDK OpenTelemetry
 */
async function initializeTracing(options = {}) {
  const {
    serviceName = 'drawrun-backend',
    serviceVersion = '4.1.0',
    enablePrometheus = true,
    enableJaeger = process.env.NODE_ENV === 'production',
    prometheusPort = process.env.PROMETHEUS_PORT || 9464,
    jaegerEndpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  } = options;

  try {
    // Configuration des exporters
    const exporters = [];

    // Prometheus pour les métriques
    if (enablePrometheus) {
      const prometheusExporter = new PrometheusExporter({
        port: prometheusPort,
        endpoint: '/metrics',
      });
      exporters.push(prometheusExporter);
      
      logger.info(`Prometheus exporter enabled on port ${prometheusPort}`);
    }

    // Jaeger pour le tracing distribué
    if (enableJaeger) {
      const jaegerExporter = new JaegerExporter({
        endpoint: jaegerEndpoint,
      });
      exporters.push(jaegerExporter);
      
      logger.info(`Jaeger exporter enabled: ${jaegerEndpoint}`);
    }

    // Configuration du SDK OpenTelemetry
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        [SemanticResourceAttributes.HOST_NAME]: require('os').hostname(),
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Instrumentations spécifiques à exclure si nécessaire
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
      traceExporter: enableJaeger ? new JaegerExporter({
        endpoint: jaegerEndpoint,
      }) : undefined,
      metricReader: enablePrometheus ? new PrometheusExporter({
        port: prometheusPort,
        endpoint: '/metrics',
      }) : undefined,
    });

    // Démarrage du SDK
    sdk.start();

    logger.info(`OpenTelemetry initialized for ${serviceName} v${serviceVersion}`);
    
    // Gestion de l'arrêt gracieux
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => logger.info('OpenTelemetry shut down successfully'))
        .catch((error) => logger.error('Error shutting down OpenTelemetry', error))
        .finally(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      sdk.shutdown()
        .then(() => logger.info('OpenTelemetry shut down successfully'))
        .catch((error) => logger.error('Error shutting down OpenTelemetry', error))
        .finally(() => process.exit(0));
    });

    return sdk;

  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry:', error);
    throw error;
  }
}

/**
 * Créé un span personnalisé pour le tracking
 * @param {string} name - Nom du span
 * @param {Function} fn - Fonction à exécuter dans le span
 * @param {Object} attributes - Attributs du span
 * @returns {Promise<*>} Résultat de la fonction
 */
async function withTracing(name, fn, attributes = {}) {
  const { trace } = require('@opentelemetry/api');
  const tracer = trace.getTracer('drawrun-backend');
  
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: trace.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Ajoute des attributs au span courant
 * @param {Object} attributes - Attributs à ajouter
 */
function addSpanAttributes(attributes) {
  const { trace } = require('@opentelemetry/api');
  const span = trace.getActiveSpan();
  
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Ajoute un événement au span courant
 * @param {string} name - Nom de l'événement
 * @param {Object} attributes - Attributs de l'événement
 */
function addSpanEvent(name, attributes = {}) {
  const { trace } = require('@opentelemetry/api');
  const span = trace.getActiveSpan();
  
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Enregistre une erreur dans le span courant
 * @param {Error} error - Erreur à enregistrer
 */
function recordSpanError(error) {
  const { trace } = require('@opentelemetry/api');
  const span = trace.getActiveSpan();
  
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: trace.SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

module.exports = {
  initializeTracing,
  withTracing,
  addSpanAttributes,
  addSpanEvent,
  recordSpanError,
};
