'use strict';

const { PMC: _PMC } = require('./pmc');

const Overtraining = {
    /**
     * Détection syndrome de surentraînement — modèle multi-facteur
     * Ref: Meeusen et al. (2013). Prevention, diagnosis, treatment OTS.
     * Ref: Kellmann et al. (2018). Recovery-Performance Questionnaire (RESTQ-Sport).
     * 
     * 5 niveaux: optimal → acceptable → fonctionnel → non-fonctionnel → OTS
     */
    detectOTS: (indicators) => {
        const {
            performanceTrend = 0,
            hrvRatio = 1,
            sleepQuality = 70,
            restingHRChange = 0,
            moodScore = 70,
            illnessCount = 0,
            acwr = 1,
            tsb = 0,
            consecutiveHardDays = 0,
        } = indicators;
        
        let riskScore = 0;
        const factors = [];
        const recommendations = [];
        
        // Performance decline (poids: 30)
        if (performanceTrend < -15) {
            riskScore += 30;
            factors.push({ factor: 'Performance decline sévère', impact: 30, severity: 'critical' });
            recommendations.push('Arrêt complet 3-5 jours');
        } else if (performanceTrend < -8) {
            riskScore += 20;
            factors.push({ factor: 'Performance decline modérée', impact: 20, severity: 'high' });
            recommendations.push('Semaine de récupération');
        } else if (performanceTrend < -3) {
            riskScore += 10;
            factors.push({ factor: 'Performance decline légère', impact: 10, severity: 'moderate' });
        }
        
        // HRV suppression (poids: 25)
        if (hrvRatio < 0.65) {
            riskScore += 25;
            factors.push({ factor: 'HRV suppression sévère', impact: 25, severity: 'critical' });
            recommendations.push('Repos complet + suivi médical si persiste');
        } else if (hrvRatio < 0.80) {
            riskScore += 15;
            factors.push({ factor: 'HRV suppression modérée', impact: 15, severity: 'high' });
        } else if (hrvRatio < 0.90) {
            riskScore += 5;
            factors.push({ factor: 'HRV légèrement basse', impact: 5, severity: 'low' });
        }
        
        // Sleep quality (poids: 20)
        if (sleepQuality < 40) {
            riskScore += 20;
            factors.push({ factor: 'Sommeil très perturbé', impact: 20, severity: 'critical' });
            recommendations.push('Priorité sommeil + hygiène de sommeil');
        } else if (sleepQuality < 60) {
            riskScore += 12;
            factors.push({ factor: 'Sommeil perturbé', impact: 12, severity: 'high' });
        } else if (sleepQuality < 75) {
            riskScore += 5;
            factors.push({ factor: 'Sommeil sous-optimal', impact: 5, severity: 'low' });
        }
        
        // Resting HR (poids: 15)
        if (restingHRChange > 12) {
            riskScore += 15;
            factors.push({ factor: 'FC repos élevée (+12+ bpm)', impact: 15, severity: 'critical' });
        } else if (restingHRChange > 7) {
            riskScore += 10;
            factors.push({ factor: 'FC repos élevée (+7 bpm)', impact: 10, severity: 'high' });
        } else if (restingHRChange > 4) {
            riskScore += 5;
            factors.push({ factor: 'FC repos légèrement élevée', impact: 5, severity: 'moderate' });
        }
        
        // ACWR (poids: 15)
        if (acwr > 1.8) {
            riskScore += 15;
            factors.push({ factor: 'ACWR critique (>1.8)', impact: 15, severity: 'critical' });
            recommendations.push('Réduction immédiate de 50% du volume');
        } else if (acwr > 1.5) {
            riskScore += 10;
            factors.push({ factor: 'ACWR élevé (>1.5)', impact: 10, severity: 'high' });
        } else if (acwr > 1.3) {
            riskScore += 5;
            factors.push({ factor: 'ACWR modéré (>1.3)', impact: 5, severity: 'moderate' });
        }
        
        // TSB (poids: 10)
        if (tsb < -35) {
            riskScore += 10;
            factors.push({ factor: 'TSB très négatif (fatigue accumulée)', impact: 10, severity: 'critical' });
            recommendations.push('Deload immédiat');
        } else if (tsb < -25) {
            riskScore += 5;
            factors.push({ factor: 'TSB négatif', impact: 5, severity: 'high' });
        }
        
        // Jours consécutifs difficiles
        if (consecutiveHardDays >= 5) {
            riskScore += 10;
            factors.push({ factor: `${consecutiveHardDays} jours difficiles consécutifs`, impact: 10, severity: 'high' });
            recommendations.push('Jour de repos obligatoire');
        } else if (consecutiveHardDays >= 3) {
            riskScore += 5;
            factors.push({ factor: `${consecutiveHardDays} jours difficiles consécutifs`, impact: 5, severity: 'moderate' });
        }
        
        // Mood (poids: 10)
        if (moodScore < 40) {
            riskScore += 10;
            factors.push({ factor: 'Humeur très basse', impact: 10, severity: 'high' });
        } else if (moodScore < 60) {
            riskScore += 5;
            factors.push({ factor: 'Humeur basse', impact: 5, severity: 'moderate' });
        }
        
        // Maladies récentes
        if (illnessCount >= 3) {
            riskScore += 15;
            factors.push({ factor: 'Maladies récurrentes', impact: 15, severity: 'critical' });
            recommendations.push('Consultation médicale recommandée');
        } else if (illnessCount >= 1) {
            riskScore += 5;
            factors.push({ factor: 'Maladie récente', impact: 5, severity: 'moderate' });
        }
        
        // Classification 5 niveaux
        let status, level, color;
        if (riskScore >= 70) {
            status = 'OTS_PROBABLE';
            level = 5;
            color = 'darkred';
        } else if (riskScore >= 50) {
            status = 'NON_FUNCTIONAL_OVERREACHING';
            level = 4;
            color = 'red';
        } else if (riskScore >= 35) {
            status = 'FUNCTIONAL_OVERREACHING';
            level = 3;
            color = 'orange';
        } else if (riskScore >= 20) {
            status = 'ACCEPTABLE';
            level = 2;
            color = 'yellow';
        } else {
            status = 'OPTIMAL';
            level = 1;
            color = 'green';
        }
        
        // Recommandation par défaut si aucune spécifique
        if (recommendations.length === 0) {
            if (level <= 2) recommendations.push('Continuez votre programme actuel');
            else recommendations.push('Réduisez la charge et surveillez les symptômes');
        }
        
        return {
            status,
            level,
            color,
            riskScore: Math.min(100, riskScore),
            maxScore: 100,
            factors,
            recommendations,
            recommendation: recommendations.join('. '),
            monitoring: {
                checkHRV: level >= 3,
                checkRestingHR: level >= 3,
                reduceLoad: level >= 3,
                restDays: level >= 4 ? 5 : level >= 3 ? 2 : 0,
                medicalConsult: level >= 5,
            }
        };
    },
    
    /**
     * Score de risque de blessure
     * Ref: Gabbett (2016). Training-injury prevention paradox.
     */
    calculateInjuryRisk: (acwr, chronicLoad, monotony, strain, hrvRatio, consecutiveDays) => {
        let risk = 0;
        
        // ACWR spike
        if (acwr > 2.0) risk += 40;
        else if (acwr > 1.5) risk += 25;
        else if (acwr > 1.3) risk += 10;
        
        // Charge chronique faible (athlète non préparé)
        if (chronicLoad < 500) risk += 15;
        else if (chronicLoad < 1000) risk += 5;
        
        // Monotonie
        if (monotony > 2.5) risk += 20;
        else if (monotony > 2.0) risk += 10;
        
        // Strain
        if (strain > 800) risk += 15;
        else if (strain > 500) risk += 5;
        
        // HRV
        if (hrvRatio < 0.7) risk += 10;
        
        // Jours consécutifs
        if (consecutiveDays > 7) risk += 10;
        else if (consecutiveDays > 5) risk += 5;
        
        risk = Math.min(100, risk);
        
        let level, color, message;
        if (risk >= 70) { level = 'critical'; color = 'darkred'; message = 'Risque de blessure très élevé'; }
        else if (risk >= 50) { level = 'high'; color = 'red'; message = 'Risque de blessure élevé'; }
        else if (risk >= 30) { level = 'moderate'; color = 'orange'; message = 'Risque modéré'; }
        else if (risk >= 15) { level = 'low'; color = 'yellow'; message = 'Risque faible'; }
        else { level = 'minimal'; color = 'green'; message = 'Risque minimal'; }
        
        return { risk, level, color, message };
    },
};

module.exports = { Overtraining };
