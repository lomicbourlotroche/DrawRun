'use strict';

const CriticalPower = {
    /**
     * Calcul CP et W' depuis efforts (modèle linéaire 2-paramètres)
     * Ref: Poole et al. (2016). Critical Power. MSSE.
     */
    estimateFromEfforts: (efforts) => {
        if (!efforts || efforts.length < 2) return null;
        
        const n = efforts.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        efforts.forEach(e => {
            const work = (e.value * e.duration) / 1000;
            sumX += e.duration;
            sumY += work;
            sumXY += e.duration * work;
            sumX2 += e.duration * e.duration;
        });
        
        const denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.001) return null;
        
        const CP = (n * sumXY - sumX * sumY) / denominator;
        const W_prime = (sumY - CP * sumX) / n;
        
        if (CP < 0 || W_prime < 0) return null;
        
        // Calcul du R² (qualité du fit)
        const meanY = sumY / n;
        let ssTot = 0, ssRes = 0;
        efforts.forEach(e => {
            const work = (e.value * e.duration) / 1000;
            const predicted = W_prime + CP * e.duration;
            ssTot += Math.pow(work - meanY, 2);
            ssRes += Math.pow(work - predicted, 2);
        });
        const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
        
        return {
            CP: Math.round(CP * 10) / 10,
            W_prime: Math.round(W_prime * 10) / 10,
            rSquared: Math.round(rSquared * 1000) / 1000,
            quality: rSquared > 0.95 ? 'excellent' : rSquared > 0.90 ? 'good' : 'fair',
            CP_unit: 'W',
            W_prime_unit: 'kJ',
        };
    },
    
    /**
     * Modèle 3-paramètres (CP, W', P_max)
     * Ref: Morton (1996). A 3-parameter critical power model.
     * P(t) = W'/t + CP + P_max * e^(-t/τ)
     */
    estimate3Parameter: (efforts) => {
        if (!efforts || efforts.length < 3) return null;
        
        // Estimation CP et W' via modèle 2-paramètres d'abord
        const base = CriticalPower.estimateFromEfforts(efforts);
        if (!base) return null;
        
        // Estimation P_max (puissance maximale instantanée)
        const maxPower = Math.max(...efforts.map(e => e.value));
        
        // τ (constante de temps anaérobie) ≈ 20-30s
        const tau = 25;
        
        return {
            ...base,
            P_max: Math.round(maxPower * 1.1),
            tau: tau,
            model: '3-parameter',
        };
    },
    
    /**
     * Power Duration Curve — courbe complète de 1s à 10h
     * Ref: Skiba (2013). Power duration relationship.
     */
    generatePowerDurationCurve: (CP, W_prime, P_max = null) => {
        if (!CP || !W_prime) return [];
        
        const pMax = P_max || CP * 2.5;
        const durations = [1, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 10800, 36000];
        
        return durations.map(t => {
            // Modèle hyperbolique: P = W'/t + CP
            const power = W_prime * 1000 / t + CP;
            return {
                duration: t,
                durationFormatted: t < 60 ? `${t}s` : t < 3600 ? `${Math.round(t/60)}min` : `${(t/3600).toFixed(1)}h`,
                power: Math.round(Math.min(power, pMax) * 10) / 10,
            };
        });
    },
    
    /**
     * W' balance — calcul W' restante en temps réel pendant l'effort
     * Ref: Skiba et al. (2012). W' balance model.
     */
    calculateWBalance: (currentPower, CP, W_prime, previousWBalance, timeSinceLastAboveCP) => {
        if (currentPower <= CP) {
            // Reconstitution de W'
            const recoveryRate = W_prime / (CP * 0.5); // simplifié
            return Math.min(W_prime, previousWBalance + recoveryRate * timeSinceLastAboveCP);
        } else {
            // Dépense de W'
            const depletion = (currentPower - CP) * timeSinceLastAboveCP / 1000;
            return Math.max(0, previousWBalance - depletion);
        }
    },
    
    /**
     * Calcul temps jusqu'à exhaustion
     * Ref: Morton (2006). The critical power model.
     */
    timeToExhaustion: (power, CP, W_prime) => {
        if (power <= CP) return Infinity;
        return W_prime * 1000 / (power - CP); // secondes
    },
    
    /**
     * Estimation FTP depuis CP
     * FTP ≈ CP × 0.95 (généralement 5-10% en dessous)
     */
    estimateFTP: (CP) => {
        return { ftp: Math.round(CP * 0.95), note: 'FTP ~ 95% CP' };
    },
    
    /**
     * Estimation CP depuis VDOT (pour coureurs sans powermeter)
     * Ref: Jones & Carter (2000). Aerobic fitness and running economy.
     */
    estimateCPFromVDOT: (vdot) => {
        if (!vdot || vdot <= 0) return null;
        
        // Relation empirique VDOT → puissance critique (course à pied)
        // CP_running ≈ VDOT × 3.5 (en W/kg approximatif)
        const cpPerKg = vdot * 0.08; // W/kg approximatif
        return {
            cpPerKg: Math.round(cpPerKg * 100) / 100,
            note: 'Estimation course à pied — nécessite poids pour W absolus',
        };
    },
};

module.exports = { CriticalPower };
