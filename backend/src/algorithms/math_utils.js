'use strict';

const MathUtils = {
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    
    mean: (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    
    stdDev: (arr) => {
        if (arr.length < 2) return 0;
        const avg = MathUtils.mean(arr);
        const sqDiffs = arr.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1));
    },
    
    expMovingAvg: (current, newVal, alpha) => 
        current + (newVal - current) * alpha,
    
    parseDuration: (duration) => {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;
        const parts = String(duration).split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parseFloat(duration) || 0;
    },
    
    formatDuration: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.round(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    formatPace: (secondsPerKm) => {
        if (!secondsPerKm || secondsPerKm <= 0 || secondsPerKm > 3600) return '--:--';
        const m = Math.floor(secondsPerKm / 60);
        const s = Math.round(secondsPerKm % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    parsePace: (paceStr) => {
        if (!paceStr) return 0;
        const parts = String(paceStr).split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return parseFloat(paceStr) * 60;
    },
    
    percentChange: (oldVal, newVal) => {
        if (oldVal === 0) return newVal > 0 ? 100 : 0;
        return ((newVal - oldVal) / oldVal) * 100;
    },
    
    movingAverage: (arr, window) => {
        if (arr.length < window) return [];
        const result = [];
        for (let i = window - 1; i < arr.length; i++) {
            const slice = arr.slice(i - window + 1, i + 1);
            result.push(MathUtils.mean(slice));
        }
        return result;
    },
    
    percentile: (arr, p) => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
         const index = (p / 100) * (sorted.length - 1);
         const lower = Math.floor(index);
         const upper = Math.ceil(index);
         // eslint-disable-next-line security/detect-object-injection
         if (lower === upper) return sorted[lower];
         // eslint-disable-next-line security/detect-object-injection
         return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
    },
};

module.exports = { MathUtils };
