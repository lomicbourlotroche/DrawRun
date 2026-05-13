'use strict';

const { MathUtils } = require('./math_utils');

const HRV = {
    /**
     * Analyse de récupération HRV avancée
     * Ref: Esco & Flatt (2014). Ultra-short-term HRV.
     * Ref: Buchheit (2014). Monitoring training status with HRV.
     * 
     * Utilise rMSSD (gold standard parasympathique) + CV (coefficient de variation)
     */
    analyzeRecovery: (rmssd, baselineRmssd, _restingHR) => {
        if (!rmssd || rmssd <= 0) {
            return { 
                status: 'unknown', 
                score: 0, 
                message: 'Données HRV insuffisantes',
                readiness: 50
            };
        }
        
        const baselineRatio = baselineRmssd > 0 ? rmssd / baselineRmssd : 1;
        
        // Score 0-100 basé sur ratio avec courbe sigmoïde
        let score;
        if (baselineRatio >= 1.1) score = 95 + Math.min(5, (baselineRatio - 1.1) * 50);
        else if (baselineRatio >= 1.0) score = 90 + (baselineRatio - 1.0) * 50;
        else if (baselineRatio >= 0.9) score = 75 + (baselineRatio - 0.9) * 150;
        else if (baselineRatio >= 0.8) score = 50 + (baselineRatio - 0.8) * 250;
        else if (baselineRatio >= 0.7) score = 30 + (baselineRatio - 0.7) * 200;
        else score = Math.max(5, 30 * baselineRatio);
        
        // Interprétation
        let status, message, recommendation;
        if (score >= 90) {
            status = 'supercompensation';
            message = 'Supercompensation détectée — prêt pour séance intense';
            recommendation = 'Séance VMA ou seuil recommandée';
        } else if (score >= 75) {
            status = 'excellent';
            message = 'Récupération excellente';
            recommendation = 'Entraînement normal';
        } else if (score >= 60) {
            status = 'good';
            message = 'Bonne récupération';
            recommendation = 'Entraînement modéré';
        } else if (score >= 45) {
            status = 'moderate';
            message = 'Récupération modérée — fatigue légère';
            recommendation = 'Réduisez l\'intensité aujourd\'hui';
        } else if (score >= 30) {
            status = 'low';
            message = 'Fatigue détectée';
            recommendation = 'Endurance fondamentale ou repos actif';
        } else {
            status = 'poor';
            message = 'Fatigue importante — risque de surentraînement';
            recommendation = 'Repos complet recommandé';
        }
        
        return {
            status,
            score: Math.round(score),
            message,
            recommendation,
            rmssd,
            baselineRmssd,
            ratio: Math.round(baselineRatio * 100) / 100,
            readiness: Math.round(score),
        };
    },
    
    /**
     * Baseline HRV dynamique — rolling 28 jours avec détection de tendance
     * Ref: Plews et al. (2013). HRV in elite athletes.
     */
    calculateDynamicBaseline: (hrvHistory, days = 28) => {
        if (!hrvHistory || hrvHistory.length < 7) return null;
        
        const recent = hrvHistory.slice(-days);
        const values = recent.map(h => h.rmssd).filter(v => v > 0);
        
        if (values.length < 5) return null;
        
        const mean = MathUtils.mean(values);
        const stdDev = MathUtils.stdDev(values);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
        
        // Détection de tendance (régression linéaire simple)
        let trend = 0;
        if (values.length >= 7) {
            const n = values.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            values.forEach((v, i) => {
                sumX += i; sumY += v; sumXY += i * v; sumX2 += i * i;
            });
            trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        }
        
        return {
            baseline: Math.round(mean * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            cv: Math.round(cv * 10) / 10,
            trend: Math.round(trend * 100) / 100,
            trendDirection: trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable',
            samples: values.length,
            // Zones d'interprétation
            zones: {
                excellent: mean + stdDev,
                normal: mean,
                low: mean - stdDev,
                alarm: mean - 2 * stdDev,
            }
        };
    },
    
    /**
     * Coefficient de Variation du HRV — indicateur de stress/fatigue
     * CV élevé = stress, CV faible = bonne adaptation
     * Ref: Plews et al. (2013)
     */
    calculateCV: (hrvHistory, window = 7) => {
        if (!hrvHistory || hrvHistory.length < window) return null;
        
        const recent = hrvHistory.slice(-window).map(h => h.rmssd).filter(v => v > 0);
        if (recent.length < 3) return null;
        
        const mean = MathUtils.mean(recent);
        const stdDev = MathUtils.stdDev(recent);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
        
        let interpretation;
        if (cv < 3) interpretation = 'Très stable — excellente adaptation';
        else if (cv < 6) interpretation = 'Stable — bonne adaptation';
        else if (cv < 10) interpretation = 'Modéré — surveillez';
        else interpretation = 'Instable — fatigue ou stress détecté';
        
        return { cv: Math.round(cv * 10) / 10, mean: Math.round(mean * 10) / 10, interpretation };
    },
    
    /**
     * Calcul du Stress Score
     * Ref: Heart Rate Variability — Alt training
     */
    calculateStressScore: (currentRmssd, optimalRmssd) => {
        if (!currentRmssd || !optimalRmssd) return 50;
        
        const ratio = optimalRmssd / currentRmssd;
        
        if (ratio <= 1) return MathUtils.clamp(50 - (1 - ratio) * 50, 0, 100);
        return MathUtils.clamp(50 + (ratio - 1) * 50, 0, 100);
    },
};

module.exports = { HRV };
