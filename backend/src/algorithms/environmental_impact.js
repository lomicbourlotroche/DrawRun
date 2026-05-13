'use strict';

const SCIENTIFIC_CONSTANTS = require('./scientific_constants');
const { AltitudeTraining } = require('./altitude_training');

const EnvironmentalImpact = {
    /**
     * Calculate pace adjustment for heat and humidity
     * @param {number} tempCelsius - Air temperature
     * @param {number} humidityPct - Relative humidity (0-100)
     * @returns {number} Factor (e.g. 1.05 means 5% slower)
     */
    calculateHeatImpact: (tempCelsius, humidityPct = 50) => {
        const threshold = SCIENTIFIC_CONSTANTS.ENVIRONMENTAL.HEAT_DEGRADATION_START;
        if (tempCelsius < threshold) return 1.0;
        
        // Pace degradation: ~0.5% per degree above 20°C, adjusted by humidity
        const tempEffect = (tempCelsius - threshold) * 0.006;
        const humidityEffect = humidityPct > 60 ? (humidityPct - 60) * 0.002 : 0;
        
        const totalImpact = 1 + tempEffect + humidityEffect;
        return Math.round(totalImpact * 1000) / 1000;
    },
    
    /**
     * Get combined adjustment factor
     */
    getAdjustmentFactor: (temp, humidity, altitude) => {
        const heat = EnvironmentalImpact.calculateHeatImpact(temp, humidity);
        const alt = AltitudeTraining.calculatePerformanceEffect(altitude).paceAdjustment;
        return Math.round(heat * alt * 1000) / 1000;
    }
};

module.exports = { EnvironmentalImpact };
