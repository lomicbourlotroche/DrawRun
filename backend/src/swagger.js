/**
 * ============================================================
 * SWAGGER / OPENAPI DOCUMENTATION
 * ============================================================
 * Documentation interactive de l'API DrawRun
 * 
 * Accessible via: http://localhost:3000/api-docs
 */

'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { logger } = require('./logger');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DrawRun API',
            version: '4.1.0',
            description: `API de suivi et analyse de performances sportives.
            
**Fonctionnalités principales:**
- Authentification JWT avec 2FA optionnel
- Synchronisation multi-plateformes (Strava, Garmin, Suunto)
- Algorithmes scientifiques (PMC, VDOT, ACWR)
- Coaching adaptatif personnalisé
- Fonctionnalités sociales

**Architecture:** Per-User Database avec SQLite`,
            contact: {
                name: 'DrawRun Team',
                email: 'support@drawrun.fr'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Development server'
            },
            {
                url: 'https://api.drawrun.fr/api',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from /auth/login'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', example: 'user@example.com' },
                        name: { type: 'string', example: 'John Doe' },
                        fcm: { type: 'number', example: 180, description: 'Fréquence cardiaque maximale' },
                        vma: { type: 'number', example: 15.5, description: 'Vitesse maximale aérobie' },
                        weight: { type: 'number', example: 70 },
                        height: { type: 'number', example: 175 },
                        resting_hr: { type: 'number', example: 55 },
                        sex: { type: 'string', enum: ['M', 'F'] },
                        age: { type: 'integer', example: 30 },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Activity: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string', example: 'Morning Run' },
                        type: { type: 'string', example: 'Run' },
                        start_date: { type: 'string', format: 'date-time' },
                        distance: { type: 'number', example: 10000, description: 'Distance in meters' },
                        moving_time: { type: 'integer', example: 3600, description: 'Time in seconds' },
                        average_speed: { type: 'number', example: 2.78, description: 'm/s' },
                        average_heartrate: { type: 'number', example: 150 },
                        calories: { type: 'integer', example: 500 },
                        total_elevation_gain: { type: 'number', example: 150 }
                    }
                },
                PMCData: {
                    type: 'object',
                    properties: {
                        date: { type: 'string', format: 'date' },
                        ctl: { type: 'number', description: 'Chronic Training Load' },
                        atl: { type: 'number', description: 'Acute Training Load' },
                        tsb: { type: 'number', description: 'Training Stress Balance (CTL - ATL)' }
                    }
                },
                TrainingPlan: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        type: { type: 'string', enum: ['endurance', 'speed', 'marathon', 'custom'] },
                        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                        weeks: { type: 'integer', example: 12 },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication & 2FA' },
            { name: 'Profile', description: 'User profile management' },
            { name: 'Activities', description: 'Activity tracking & management' },
            { name: 'PMC', description: 'Performance Management Chart' },
            { name: 'Sync', description: 'Multi-platform synchronization' },
            { name: 'Coach', description: 'Adaptive coaching & training plans' },
            { name: 'Social', description: 'Friends, groups & leaderboards' },
            { name: 'Metrics', description: 'Performance metrics & calculations' }
        ]
    },
    apis: [
        './index.js',
        './src/routes/*.js',
        './src/auth.js'
    ]
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'DrawRun API Documentation'
    }));
    
    // Raw JSON spec
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
    
    logger.info('📚 Swagger documentation available at /api-docs');
}

module.exports = { setupSwagger, specs };
