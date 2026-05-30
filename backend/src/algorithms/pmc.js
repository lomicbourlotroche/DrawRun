'use strict';

const { MathUtils } = require('./math_utils');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');

const PMC = {
    /**
     * Calcul PMC - Modèle Impulse Response de Banister
     * Ref: Banister, E.W. (1975). Development of a technique...
     * Ref: Hellard et al. (2006). Assessing limitations of Banister model. J Sports Sci.
     * 
     * CTL (Fitness) = exponential moving average avec τa ≈ 42 jours
     * ATL (Fatigue) = exponential moving average avec τf ≈ 7 jours
     * TSB (Forme) = CTL - ATL
     * 
     * @param {Array} activities - Array of {date, tss}
     * @param {number} tauFitness - τ fitness (default 42)
     * @param {number} tauFatigue - τ fatigue (default 7)
     * @param {object} options - {initialCTL, initialATL, hrvModulator}
     */
    calculate: (activities, tauFitness = 42, tauFatigue = 7, options = {}) => {
        if (!activities || activities.length === 0) return [];
        
        const alphaFitness = 1 - Math.exp(-1 / tauFitness);
        const alphaFatigue = 1 - Math.exp(-1 / tauFatigue);
        const alphaStability = SCIENTIFIC_CONSTANTS.PMC.ALPHA_STABILITY;
        
        const sorted = activities
            .filter(a => a.date || a.start_date_local)
            .map(a => ({
                ...a,
                date: a.date || a.start_date_local,
                tss: a.tss || a.trimp || a.load || 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sorted.length === 0) return [];
        
        let ctl = options.initialCTL || 0;
        let atl = options.initialATL || 0;
        let sb = 0;
        const data = [];
        
        sorted.forEach((act) => {
            const tss = (act.tss ?? act.trimp ?? act.load ?? 0);
            
            // HRV modulation (si disponible)
            let hrvMod = 1.0;
            if (options.hrvModulator && act.hrvRmssd) {
                const baseline = options.hrvModulator.baseline || 50;
                const ratio = act.hrvRmssd / baseline;
                hrvMod = MathUtils.clamp(0.6 + ratio * 0.4, 0.7, 1.3);
            }
            
            ctl = MathUtils.expMovingAvg(ctl, tss * hrvMod, alphaFitness);
            atl = MathUtils.expMovingAvg(atl, tss * hrvMod, alphaFatigue);
            sb = MathUtils.expMovingAvg(sb, ctl - atl, alphaStability);
            
            data.push({
                date: act.date.split('T')[0],
                tss: tss,
                ctl: Math.round(ctl),
                atl: Math.round(atl),
                tsb: Math.round(ctl - atl),
                sb: Math.round(sb),
                hrvModulator: Math.round(hrvMod * 100) / 100,
            });
        });
        
        return data;
    },
    
    /**
     * PMC 3-composantes (modèle Calvert)
     * Ref: Calvert, T.W. (1976). A systems model of training for athletic performance.
     */
    calculate3Component: (activities, tauFitness = 42, tauFatigue = 7, tauStability = 14) => {
        if (!activities || activities.length === 0) return [];
        
        const alphaFitness = 1 - Math.exp(-1 / tauFitness);
        const alphaFatigue = 1 - Math.exp(-1 / tauFatigue);
        const alphaStability = 1 - Math.exp(-1 / tauStability);
        
        const sorted = activities
            .filter(a => a.date || a.start_date_local)
            .map(a => ({ date: a.date || a.start_date_local, tss: a.tss || a.trimp || 0 }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let ctl = 0, atl = 0, stb = 0;
        const data = [];
        
        sorted.forEach((act) => {
            const tss = act.tss || 0;
            ctl = MathUtils.expMovingAvg(ctl, tss, alphaFitness);
            atl = MathUtils.expMovingAvg(atl, tss, alphaFatigue);
            stb = MathUtils.expMovingAvg(stb, tss, alphaStability);
            
            data.push({
                date: act.date.split('T')[0],
                tss,
                ctl: Math.round(ctl),
                atl: Math.round(atl),
                stb: Math.round(stb),
                tsb: Math.round(ctl - atl),
                form: Math.round((ctl + stb) / 2 - atl),
            });
        });
        
        return data;
    },
    
    /**
     * Tau personnalisés selon le profil de l'athlète
     * Ref: Busso et al. (1997). Individualized tau based on training status.
     */
    getPersonalizedTau: (profile) => {
        const { level = 'intermediate', age = 30, trainingYears = 3 } = profile || {};
        
         const tauMap = {
             beginner: { fitness: 35, fatigue: 5 },
             intermediate: { fitness: 42, fatigue: 7 },
             advanced: { fitness: 48, fatigue: 8 },
             elite: { fitness: 55, fatigue: 10 },
         };

         // eslint-disable-next-line security/detect-object-injection
         const base = tauMap[level] || tauMap.intermediate;
        const ageFactor = age > 40 ? 1 + (age - 40) * 0.02 : 1;
        const experienceFactor = 1 + Math.min(trainingYears * 0.01, 0.15);
        
        return {
            fitness: Math.round(base.fitness * ageFactor * experienceFactor),
            fatigue: Math.round(base.fatigue * ageFactor),
        };
    },
    
    /**
     * Calcul ACWR - Acute:Chronic Workload Ratio
     * Ref: Gabbett, T.J. (2016). The training-injury prevention paradox.
     * 
     * ACWR optimal: 0.8 - 1.3
     */
    calculateACWR: (weeklyLoad, chronicLoad) => {
        if (!chronicLoad || chronicLoad === 0) return 1;
        return weeklyLoad / chronicLoad;
    },
    
    /**
     * ACWR exponentially weighted (plus précis que rolling)
     * Ref: Williams et al. (2017). EWMA ACWR.
     */
    calculateACWR_EWMA: (dailyLoads, tauAcute = 7, tauChronic = 28) => {
        if (!dailyLoads || dailyLoads.length < tauChronic) return null;
        
        const alphaAcute = 1 - Math.exp(-1 / tauAcute);
        const alphaChronic = 1 - Math.exp(-1 / tauChronic);
        
        let acute = 0, chronic = 0;
        dailyLoads.forEach(load => {
            acute = MathUtils.expMovingAvg(acute, load, alphaAcute);
            chronic = MathUtils.expMovingAvg(chronic, load, alphaChronic);
        });
        
        return chronic > 0 ? acute / chronic : 1;
    },
    
    /**
     * Statut ACWR avec interprétation scientifique
     */
    getACWRStatus: (acwr) => {
        const c = SCIENTIFIC_CONSTANTS.ACWR;
        
        if (acwr < c.UNDER_REACHING) {
            return { 
                status: 'underreaching', 
                color: 'blue', 
                label: 'Sous-entrainement',
                message: 'Augmentez progressivement la charge',
                risk: 'low'
            };
        }
        if (acwr <= c.OPTIMAL_MAX) {
            return { 
                status: 'optimal', 
                color: 'green', 
                label: 'Optimal',
                message: 'Zone ideale pour progression',
                risk: 'optimal'
            };
        }
        if (acwr <= c.RISKY_MAX) {
            return { 
                status: 'risky', 
                color: 'orange', 
                label: 'Surveillance',
                message: 'Surveillez les signes de fatigue',
                risk: 'elevated'
            };
        }
        if (acwr <= c.DANGER) {
            return { 
                status: 'overreaching', 
                color: 'red', 
                label: 'Overreaching',
                message: 'Risque eleve - reduisez la charge',
                risk: 'high'
            };
        }
        return { 
            status: 'danger', 
            color: 'red', 
            label: 'DANGER',
            message: 'ACWR > 1.5 = risque blessure 3-4x. REDUISEZ IMMEDIATEMENT.',
            risk: 'critical'
        };
    },
    
    /**
     * Calcul Monotonie
     * Ref: Foster (1998)
     */
    calculateMonotony: (dailyLoads) => {
        if (dailyLoads.length < 2) return 1;
        const mean = MathUtils.mean(dailyLoads);
        if (mean === 0) return 0;
        return mean / MathUtils.stdDev(dailyLoads);
    },
    
    /**
     * Calcul Strain
     */
    calculateStrain: (ctl, monotony) => ctl * monotony,
    
    /**
     * Get Strain status
     */
    getStrainStatus: (strain) => {
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.LOW) {
            return { status: 'low', color: 'blue', label: 'Faible' };
        }
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.MODERATE) {
            return { status: 'moderate', color: 'green', label: 'Modéré' };
        }
        if (strain < SCIENTIFIC_CONSTANTS.STRAIN.HIGH) {
            return { status: 'high', color: 'orange', label: 'Élevé' };
        }
        return { status: 'danger', color: 'red', label: 'Critique' };
    },
    
    /**
     * Prédiction de performance depuis CTL/TSB (modèle Busso)
     * Ref: Busso, T. (2003). Variable dose-response relationship...
     */
    predictPerformance: (ctl, atl, baselinePerformance) => {
        if (!ctl || !atl) return baselinePerformance;
        
        const tsb = ctl - atl;
        const optimalTSB = 15;
        const tsbFactor = 1 - Math.abs(tsb - optimalTSB) / 100;
        
        return Math.round(baselinePerformance * MathUtils.clamp(tsbFactor, 0.85, 1.10));
    },
    
    /**
     * Estimation readiness depuis PMC
     */
    estimateReadiness: (pmcData, hrvRmssd, sleepHours) => {
        if (!pmcData || pmcData.length === 0) {
            return {
                readiness: 70,
                factors: { hrv: 70, sleep: 70, tsb: 70 }
            };
        }
        
        const latest = pmcData[pmcData.length - 1];
        const tsb = latest.tsb || 0;
        const atl = latest.atl || 0;
        
        const tsbScore = MathUtils.clamp(50 + tsb * 2, 0, 100);
        
        let hrvScore = 70;
        if (hrvRmssd > 0) {
            hrvScore = MathUtils.clamp(hrvRmssd * 1.2, 20, 100);
        }
        
        let sleepScore = 70;
        if (sleepHours > 0) {
            if (sleepHours >= 8) sleepScore = 95;
            else if (sleepHours >= 7) sleepScore = 80;
            else if (sleepHours >= 6) sleepScore = 60;
            else sleepScore = 40;
        }
        
        const atlFactor = atl > 0 ? Math.max(0.4, 1 - atl / 150) : 1;
        
        const readiness = (tsbScore * 0.4 + hrvScore * 0.3 + sleepScore * 0.3) * atlFactor;
        
        return {
            readiness: Math.round(MathUtils.clamp(readiness, 10, 100)),
            factors: {
                hrv: Math.round(hrvScore),
                sleep: Math.round(sleepScore),
                tsb: Math.round(tsbScore),
                atlFactor: Math.round(atlFactor * 100) / 100
            }
        };
    },
};

module.exports = { PMC };
