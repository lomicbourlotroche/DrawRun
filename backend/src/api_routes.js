/**
 * DrawRun API Routes - Algorithmes scientifiques
 * =============================================
 * 
 * Endpoints pour les calculs scientifiques centralisés sur le serveur.
 * App et site web font des appels API pour obtenir les résultats.
 * 
 * Réferences scientifiques dans algorithms.js
 */

'use strict';
const { logger } = require('./logger');

const express = require('express');
const router = express.Router();
const {
    Cardiovascular,
    RunningPerformance,
    TrainingLoad,
    PMC,
    Polarization,
    HRV,
    CriticalPower,
    Overtraining,
    Taper,
    Recommendations,
    MathUtils,
    SCIENTIFIC_CONSTANTS
} = require('./algorithms');

// ============================================================================
// HELPERS
// ============================================================================

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// ============================================================================
// ZONES - Zones d'entraînement
// ============================================================================

/**
 * GET /api/algo/zones
 * Calcule les zones de FC et les allures d'entraînement
 * 
 * Query params:
 *   - age: nombre (obligatoire)
 *   - fcm: nombre (optionnel, calculé si absent)
 *   - restingHR: nombre (défaut: 60)
 *   - vma: nombre (pour zones de vitesse)
 *   - vdot: nombre (pour allures Jack Daniels)
 *   - sex: 'M' ou 'F' (défaut: M)
 */
router.get('/zones', (req, res) => {
    try {
        const { age = 30, fcm, restingHR = 60, vma, vdot, sex = 'M' } = req.query;
        
        const ageNum = parseInt(age);
        const fcmNum = fcm ? parseInt(fcm) : Cardiovascular.calculateMaxHR(ageNum);
        const vmaNum = vma ? parseFloat(vma) : null;
        const vdotNum = vdot ? parseFloat(vdot) : null;
        
        const response = {
            age: ageNum,
            fcm: fcmNum,
            restingHR: parseInt(restingHR),
            sex,
            
            // Zones Karvonen (5 zones)
            hrZones: Cardiovascular.calculateKarvonenZones(ageNum, parseInt(restingHR), sex),
            
            // Zones par %FCM (5 zones)
            hrPercentZones: Cardiovascular.calculatePercentZones(fcmNum),
        };
        
        // Zones de vitesse si VMA fourni
        if (vmaNum && vmaNum > 0) {
            response.speedZones = RunningPerformance.calculateSpeedZones(vmaNum);
        }
        
        // Allures d'entraînement si VDOT fourni
        if (vdotNum && vdotNum > 10) {
            response.trainingPaces = RunningPerformance.getTrainingPaces(vdotNum);
            response.vdot = vdotNum;
        }
        
        res.json(response);
    } catch (error) {
        logger.error('Zones error:', error);
        res.status(500).json({ error: 'Erreur calcul zones' });
    }
});

// ============================================================================
// VDOT - Calcul performance
// ============================================================================

/**
 * GET /api/algo/vdot
 * Calcule le VDOT et prédit les temps de course
 * 
 * Query params:
 *   - distance: distance en mètres (obligatoire)
 *   - time: temps en minutes (obligatoire)
 *   OU
 *   - vdot: VDOT pour prédictions
 */
router.get('/vdot', (req, res) => {
    try {
        const { distance, time, vdot } = req.query;
        
        let vdotResult = null;
        let predictions = null;
        
        // Calcul VDOT depuis performance
        if (distance && time) {
            vdotResult = RunningPerformance.calculateVDOT(parseFloat(distance), parseFloat(time));
        }
        // Ou utiliser VDOT fourni pour prédictions
        else if (vdot) {
            vdotResult = parseFloat(vdot);
        }
        
        if (!vdotResult || vdotResult < 10) {
            return res.status(400).json({ error: 'VDOT invalide' });
        }
        
        // VMA estimé
        const vma = RunningPerformance.estimateVMA(vdotResult);
        
        // Prédictions de course
        predictions = {
            marathon: RunningPerformance.predictMarathon(vdotResult),
            halfMarathon: RunningPerformance.predictHalfMarathon(vdotResult),
        };
        
        // Distance classique — use VDOT-based pace as reference
        const classicDistances = [5000, 10000, 21097, 42195];
        const referencePaceSec = RunningPerformance.getPaceSeconds(vdotResult, SCIENTIFIC_CONSTANTS.VDOT.I);
        const referenceDistance = 10000;
        const referenceTimeSec = referencePaceSec * (referenceDistance / 1000);

        predictions.classicRaces = classicDistances.map(dist => {
            const distKm = dist / 1000;
            const timeSec = RunningPerformance.predictRaceTime(referenceDistance, referenceTimeSec, dist);
            const paceSec = timeSec / dist;
            return {
                distance: distKm < 1 ? `${dist}m` : `${distKm}km`,
                time: MathUtils.formatDuration(timeSec),
                pace: MathUtils.formatPace(paceSec)
            };
        });
        
        // Niveau de performance
        const level = RunningPerformance.getPerformanceLevel('VDOT', vdotResult);
        
        res.json({
            vdot: Math.round(vdotResult * 10) / 10,
            vma: Math.round(vma * 10) / 10,
            level,
            predictions
        });
    } catch (error) {
        logger.error('VDOT error:', error);
        res.status(500).json({ error: 'Erreur calcul VDOT' });
    }
});

// ============================================================================
// PMC - Performance Management Chart
// ============================================================================

/**
 * GET /api/algo/pmc
 * Calcule PMC, CTL, ATL, TSB, ACWR
 * 
 * Query params:
 *   - activities: JSON array [{date, tss}] (obligatoire)
 *   - weeks: nombre de semaines à retourner (défaut: 12)
 */
router.get('/pmc', (req, res) => {
    try {
        const { activities, weeks = 12 } = req.query;
        
        if (!activities) {
            return res.status(400).json({ error: 'Paramètre activities requis' });
        }
        
        let activitiesList;
        try {
            activitiesList = JSON.parse(activities);
        } catch {
            return res.status(400).json({ error: 'Activities JSON invalide' });
        }
        
        if (!Array.isArray(activitiesList) || activitiesList.length === 0) {
            return res.json({
                data: [],
                summary: {
                    ctl: 0,
                    atl: 0,
                    tsb: 0,
                    acwr: 1,
                    acwrStatus: PMC.getACWRStatus(1),
                    monotony: 1,
                    strain: 0
                }
            });
        }
        
        // Calcul PMC
        const pmcData = PMC.calculate(activitiesList);
        
        // Limiter aux dernières semaines
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (parseInt(weeks) * 7));
        const filteredData = pmcData.filter(d => new Date(d.date) >= cutoffDate);
        
        // Résumé actuel
        const latest = filteredData[filteredData.length - 1] || { ctl: 0, atl: 0, tsb: 0 };
        
        // Calcul ACWR (7 derniers jours vs moyenne 28 jours)
        const last7Days = filteredData.slice(-7);
        const last28Days = filteredData.slice(-28);
        
        const weeklyLoad = last7Days.reduce((sum, d) => sum + (d.tss || 0), 0);
        const chronicLoad = last28Days.length > 0 
            ? last28Days.reduce((sum, d) => sum + (d.tss || 0), 0) / last28Days.length * 7
            : weeklyLoad;
        
        const acwr = PMC.calculateACWR(weeklyLoad, chronicLoad);
        
        // Monotonie (7 derniers jours)
        const dailyLoads = last7Days.map(d => d.tss || 0);
        const monotony = PMC.calculateMonotony(dailyLoads);
        
        // Strain
        const strain = PMC.calculateStrain(latest.ctl, monotony);
        const strainStatus = PMC.getStrainStatus(strain);
        
        res.json({
            data: filteredData,
            summary: {
                ctl: latest.ctl,
                atl: latest.atl,
                tsb: latest.tsb,
                sb: latest.sb,
                acwr: Math.round(acwr * 100) / 100,
                acwrStatus: PMC.getACWRStatus(acwr),
                monotony: Math.round(monotony * 100) / 100,
                strain: Math.round(strain),
                strainStatus,
                weeklyLoad,
                chronicLoad: Math.round(chronicLoad)
            }
        });
    } catch (error) {
        logger.error('PMC error:', error);
        res.status(500).json({ error: 'Erreur calcul PMC' });
    }
});

// ============================================================================
// RECOMMENDATIONS - Recommandations d'entraînement
// ============================================================================

/**
 * GET /api/algo/recommendations
 * Génère une recommandation d'entraînement personnalisée
 * 
 * Query params:
 *   - profile: JSON {vma, fcm, vdot, restingHR, age, sex}
 *   - history: JSON {weeklyLoad, chronicLoad, acwr, readiness, ...}
 *   - dayOfWeek: 0-6 (défaut: aujourd'hui)
 */
router.get('/recommendations', (req, res) => {
    try {
        const { profile, history, dayOfWeek } = req.query;
        
        const profileObj = profile ? JSON.parse(profile) : {};
        const historyObj = history ? JSON.parse(history) : {};
        const day = dayOfWeek !== undefined ? parseInt(dayOfWeek) : new Date().getDay();
        
        const recommendation = Recommendations.generate(profileObj, historyObj, { dayOfWeek: day });
        
        res.json(recommendation);
    } catch (error) {
        logger.error('Recommendations error:', error);
        res.status(500).json({ error: 'Erreur génération recommandation' });
    }
});

// ============================================================================
// POLARIZATION - Analyse distribution d'intensité
// ============================================================================

/**
 * GET /api/algo/polarization
 * Analyse la distribution polarisée de l'entraînement
 * 
 * Query params:
 *   - activities: JSON array [{zonePercent: {1,2,3,4,5}}]
 */
router.get('/polarization', (req, res) => {
    try {
        const { activities } = req.query;
        
        if (!activities) {
            return res.status(400).json({ error: 'Paramètre activities requis' });
        }
        
        const activitiesList = JSON.parse(activities);
        
        const index = Polarization.calculatePolarizationIndex(activitiesList);
        const recommendation = Polarization.getRecommendation(index);
        
        // Calcul des moyennes
        let totalLow = 0, totalModerate = 0, totalHigh = 0;
        let count = 0;
        
        activitiesList.forEach(act => {
            const zones = act.zonePercent || {};
            totalLow += (zones[1] || 0) + (zones[2] || 0);
            totalModerate += zones[3] || 0;
            totalHigh += (zones[4] || 0) + (zones[5] || 0);
            count++;
        });
        
        const avgLow = count > 0 ? Math.round(totalLow / count) : 0;
        const avgModerate = count > 0 ? Math.round(totalModerate / count) : 0;
        const avgHigh = count > 0 ? Math.round(totalHigh / count) : 0;
        
        const classification = Polarization.classifyDistribution(avgLow, avgModerate, avgHigh);
        
        res.json({
            index,
            distribution: { low: avgLow, moderate: avgModerate, high: avgHigh },
            classification,
            recommendation,
            target: { low: 80, moderate: 0, high: 20 }
        });
    } catch (error) {
        logger.error('Polarization error:', error);
        res.status(500).json({ error: 'Erreur analyse polarization' });
    }
});

// ============================================================================
// HRV - Analyse récupération
// ============================================================================

/**
 * GET /api/algo/hrv
 * Analyse HRV et récupération
 * 
 * Query params:
 *   - rmssd: valeur rMSSD actuelle (ms)
 *   - baseline: rMSSD de base (ms)
 *   - restingHR: FC de repos (bpm)
 */
router.get('/hrv', (req, res) => {
    try {
        const { rmssd, baseline, restingHR = 60 } = req.query;
        
        if (!rmssd) {
            return res.status(400).json({ error: 'Paramètre rmssd requis' });
        }
        
        const rmssdNum = parseFloat(rmssd);
        const baselineNum = baseline ? parseFloat(baseline) : null;
        
        const analysis = HRV.analyzeRecovery(rmssdNum, baselineNum, parseInt(restingHR));
        const stressScore = baselineNum ? HRV.calculateStressScore(rmssdNum, baselineNum) : null;
        
        res.json({
            ...analysis,
            stressScore
        });
    } catch (error) {
        logger.error('HRV error:', error);
        res.status(500).json({ error: 'Erreur analyse HRV' });
    }
});

// ============================================================================
// TAPER - Plan de tapering
// ============================================================================

/**
 * GET /api/algo/taper
 * Génère un plan de taper pour compétition
 * 
 * Query params:
 *   - currentLoad: charge hebdomadaire actuelle (CTL)
 *   - daysToCompetition: jours jusqu'à la compétition
 *   - style: 'classic' | 'linear' | 'exponential' | 'step' (défaut: classic)
 */
router.get('/taper', (req, res) => {
    try {
        const { currentLoad, daysToCompetition, style = 'classic' } = req.query;
        
        if (!currentLoad || !daysToCompetition) {
            return res.status(400).json({ error: 'Paramètres currentLoad et daysToCompetition requis' });
        }
        
        const load = parseFloat(currentLoad);
        const days = parseInt(daysToCompetition);
        
        if (days < 1 || days > 21) {
            return res.status(400).json({ error: 'daysToCompetition doit être entre 1 et 21' });
        }
        
        const plan = Taper.calculateTaperPlan(load, days, style);
        
        res.json({
            style,
            currentLoad: load,
            daysToCompetition: days,
            plan,
            summary: {
                startLoad: plan[0]?.targetLoad || load,
                competitionLoad: plan[plan.length - 1]?.targetLoad || load * 0.4,
                reduction: Math.round((1 - plan[plan.length - 1].loadPercent / 100) * 100) + '%'
            }
        });
    } catch (error) {
        logger.error('Taper error:', error);
        res.status(500).json({ error: 'Erreur génération taper' });
    }
});

// ============================================================================
// OVERTRAINING - Détection surentraînement
// ============================================================================

/**
 * GET /api/algo/overtraining
 * Détecte les signes de surentraînement
 * 
 * Query params:
 *   - indicators: JSON {performanceTrend, rpeChange, hrvRatio, sleepQuality, restingHRChange, moodScore, illnessCount}
 */
router.get('/overtraining', (req, res) => {
    try {
        const { indicators } = req.query;
        
        if (!indicators) {
            return res.status(400).json({ error: 'Paramètre indicators requis' });
        }
        
        const indicatorsObj = JSON.parse(indicators);
        const result = Overtraining.detectOTS(indicatorsObj);
        
        res.json({
            ...result,
            scientificBasis: 'Meeusen et al. (2013) OTS Consensus; Carrard et al. (2021)'
        });
    } catch (error) {
        logger.error('Overtraining error:', error);
        res.status(500).json({ error: 'Erreur détection OTS' });
    }
});

// ============================================================================
// CRITICAL POWER - Modèle CP/W'
// ============================================================================

/**
 * GET /api/algo/critical-power
 * Estime CP et W' depuis efforts courts
 * 
 * Query params:
 *   - efforts: JSON array [{duration: sec, value: watts}] (minimum 2)
 */
router.get('/critical-power', (req, res) => {
    try {
        const { efforts } = req.query;
        
        if (!efforts) {
            return res.status(400).json({ error: 'Paramètre efforts requis' });
        }
        
        const effortsList = JSON.parse(efforts);
        
        if (!Array.isArray(effortsList) || effortsList.length < 2) {
            return res.status(400).json({ error: 'Minimum 2 efforts requis' });
        }
        
        const result = CriticalPower.estimateFromEfforts(effortsList);
        
        if (!result) {
            return res.status(400).json({ error: 'Impossible de calculer CP/W\'' });
        }
        
        // Estimation FTP
        const ftp = CriticalPower.estimateFTP(result.CP);
        
        res.json({
            ...result,
            ftp
        });
    } catch (error) {
        logger.error('CriticalPower error:', error);
        res.status(500).json({ error: 'Erreur calcul CP/W\'' });
    }
});

// ============================================================================
// TSS - Calcul Training Stress Score
// ============================================================================

/**
 * GET /api/algo/tss
 * Calcule TSS et TRIMP
 * 
 * Query params:
 *   - duration: durée en secondes
 *   - intensityFactor: IF (0.5-1.5)
 *   OU
 *   - avgHR: FC moyenne
 *   - maxHR: FC max
 *   - durationMin: durée en minutes
 */
router.get('/tss', (req, res) => {
    try {
        const { duration, intensityFactor, avgHR, maxHR, durationMin, sex = 'M' } = req.query;
        
        let tss = null;
        let trimp = null;
        let method = null;
        
        // TSS depuis IF
        if (duration && intensityFactor) {
            tss = TrainingLoad.calculateTSS(parseFloat(duration), parseFloat(intensityFactor));
            method = 'TSS (Coggan)';
        }
        
        // TRIMP depuis HR
        if (avgHR && maxHR && durationMin) {
            trimp = TrainingLoad.calculateTRIMPFromAvgHR(
                parseFloat(durationMin),
                parseFloat(avgHR),
                parseFloat(maxHR),
                sex
            );
            method = trimp ? 'TRIMP (Edwards)' : null;
        }
        
        res.json({
            tss: tss ? Math.round(tss) : null,
            trimp: trimp ? Math.round(trimp) : null,
            method,
            notes: {
                tss: 'Training Stress Score = duration_hours × IF² × 100',
                trimp: 'TRIMP = duration × zone_factor × sex_factor'
            }
        });
    } catch (error) {
        logger.error('TSS error:', error);
        res.status(500).json({ error: 'Erreur calcul TSS' });
    }
});

// ============================================================================
// READINESS - Score de forme
// ============================================================================

/**
 * GET /api/algo/readiness
 * Calcule le score de forme/readiness
 * 
 * Query params:
 *   - pmc: JSON array [{tss, ctl, atl, tsb}] (derniers jours)
 *   - hrv: rMSSD actuel
 *   - sleep: heures de sommeil
 *   - restingHR: FC de repos
 */
router.get('/readiness', (req, res) => {
    try {
        const { pmc, hrv, sleep, restingHR } = req.query;
        
        // Calcul readiness depuis PMC
        let pmcData = [];
        if (pmc) {
            pmcData = JSON.parse(pmc);
        }
        
        const readiness = PMC.estimateReadiness(
            pmcData,
            hrv ? parseFloat(hrv) : 0,
            sleep ? parseFloat(sleep) : 7
        );
        
        // Statuts
        let status, color, label;
        if (readiness >= 85) {
            status = 'excellent'; color = 'green'; label = 'Excellent';
        } else if (readiness >= 70) {
            status = 'good'; color = 'blue'; label = 'Bon';
        } else if (readiness >= 50) {
            status = 'moderate'; color = 'orange'; label = 'Modéré';
        } else if (readiness >= 30) {
            status = 'low'; color = 'red'; label = 'Faible';
        } else {
            status = 'poor'; color = 'gray'; label = 'Repos recommandé';
        }
        
        // Conseils selon le status
        const advice = {
            excellent: 'Jour parfait pour une séance intense ou compétition!',
            good: 'Bonne forme. Séance de qualité recommandée.',
            moderate: 'Séance légère à modérée. Évitez les efforts max.',
            low: 'Récupération active légère ou repos.',
            poor: 'Repos complet recommandé. Fatigue importante détectée.'
        };
        
        res.json({
            readiness,
            status,
            color,
            label,
            advice: advice[status],
            factors: {
                pmc: pmcData.length > 0,
                hrv: !!hrv,
                sleep: sleep ? parseFloat(sleep) : null
            }
        });
    } catch (error) {
        logger.error('Readiness error:', error);
        res.status(500).json({ error: 'Erreur calcul readiness' });
    }
});

// ============================================================================
// HEALTH - Status global de l'athlète
// ============================================================================

/**
 * GET /api/algo/health
 * Retourne un résumé complet de la santé/forme de l'athlète
 * 
 * Query params:
 *   - profile: JSON {age, vma, fcm, restingHR, sex}
 *   - pmc: JSON array PMC data
 *   - hrv: JSON {rmssd, baseline}
 */
router.get('/health', (req, res) => {
    try {
        const { profile, pmc, hrv } = req.query;
        
        const profileObj = profile ? JSON.parse(profile) : {};
        const pmcData = pmc ? JSON.parse(pmc) : [];
        const hrvObj = hrv ? JSON.parse(hrv) : {};
        
        const latest = pmcData[pmcData.length - 1] || {};
        
        // Readiness
        const readiness = PMC.estimateReadiness(
            pmcData,
            hrvObj.rmssd || 0,
            7
        );
        
        // ACWR
        const acwr = PMC.calculateACWR(
            latest.tss || 0,
            latest.ctl || 50
        );
        
        // HRV status
        let hrvStatus = null;
        if (hrvObj.rmssd) {
            hrvStatus = HRV.analyzeRecovery(hrvObj.rmssd, hrvObj.baseline);
        }
        
        // Zones
        const fcm = profileObj.fcm || Cardiovascular.calculateMaxHR(profileObj.age || 30);
        const hrZones = Cardiovascular.calculateKarvonenZones(
            profileObj.age || 30,
            profileObj.restingHR || 60,
            profileObj.sex || 'M'
        );
        
        res.json({
            readiness,
            acwr: Math.round(acwr * 100) / 100,
            acwrStatus: PMC.getACWRStatus(acwr),
            pmc: {
                ctl: latest.ctl || 0,
                atl: latest.atl || 0,
                tsb: latest.tsb || 0
            },
            hrv: hrvStatus,
            zones: hrZones,
            profile: {
                fcm,
                vma: profileObj.vma,
                vdot: profileObj.vdot
            },
            recommendations: {
                trainingLoad: acwr > 1.3 ? 'reduce' : acwr < 0.8 ? 'increase' : 'maintain',
                intensity: readiness < 50 ? 'low' : readiness < 70 ? 'moderate' : 'high'
            }
        });
    } catch (error) {
        logger.error('Health error:', error);
        res.status(500).json({ error: 'Erreur calcul santé' });
    }
});

// ============================================================================
// CONSTANTS - Retourne les constantes scientifiques
// ============================================================================

/**
 * GET /api/algo/constants
 * Retourne les constantes scientifiques utilisées
 */
router.get('/constants', (req, res) => {
    res.json({
        pmc: {
            tauFitnessDefault: SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_DEFAULT,
            tauFatigueDefault: SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_DEFAULT,
            tauFitnessRange: [SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_MIN, SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_MAX],
            tauFatigueRange: [SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_MIN, SCIENTIFIC_CONSTANTS.PMC.TAU_FATIGUE_MAX],
        },
        acwr: {
            optimal: [SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MIN, SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MAX],
            risky: [SCIENTIFIC_CONSTANTS.ACWR.RISKY_MIN, SCIENTIFIC_CONSTANTS.ACWR.RISKY_MAX],
            danger: SCIENTIFIC_CONSTANTS.ACWR.DANGER,
            spikeDanger: SCIENTIFIC_CONSTANTS.ACWR.SPIKE_DANGER,
        },
        polarization: {
            targetLow: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_LOW,
            targetModerate: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_MODERATE,
            targetHigh: SCIENTIFIC_CONSTANTS.POLARIZATION.TARGET_HIGH,
        },
        vdot: {
            zones: {
                E: [SCIENTIFIC_CONSTANTS.VDOT.E_LOW, SCIENTIFIC_CONSTANTS.VDOT.E_HIGH],
                M: SCIENTIFIC_CONSTANTS.VDOT.M,
                T: SCIENTIFIC_CONSTANTS.VDOT.T,
                I: SCIENTIFIC_CONSTANTS.VDOT.I,
                R: SCIENTIFIC_CONSTANTS.VDOT.R,
            }
        },
        fcm: {
            formula: '208 - 0.7 × age (Tanaka et al. 2001)',
            coefficient: SCIENTIFIC_CONSTANTS.FCM.TANAKA_AGE_COEFFICIENT,
            intercept: SCIENTIFIC_CONSTANTS.FCM.TANAKA_INTERCEPT,
        }
    });
});

// ============================================================================
// SPORT ANALYSIS - Analyse d'activité par sport
// ============================================================================

/**
 * POST /api/algo/analyze
 * Analyse une activité selon son type de sport
 * 
 * Body:
 *   - activity: objet activité avec toutes les propriétés
 *   - profile: profil utilisateur (fcm, vma, ftp, etc.)
 */
router.post('/analyze', (req, res) => {
    try {
        const { activity, profile = {} } = req.body;
        
        if (!activity) {
            return res.status(400).json({ error: 'Activité requise' });
        }
        
        const analysis = SportAnalysis.analyze(activity, profile);
        
        res.json(analysis);
    } catch (error) {
        logger.error('Sport analysis error:', error);
        res.status(500).json({ error: 'Erreur analyse sport' });
    }
});

// ============================================================================
// SPORTS LIST - Liste tous les sports supportés
// ============================================================================

/**
 * GET /api/algo/sports
 * Retourne la liste des sports supportés avec leurs métriques
 */
router.get('/sports', (req, res) => {
    try {
        res.json({
            sports: Object.keys(SportAnalysis.SPORT_CONSTANTS),
            constants: {
                running: 'TSS depuis FC/VMA',
                bike: 'TSS depuis puissance/FC, VI, Normalized Power',
                swim: 'TSS depuisFC/allure, SWOLF',
                trail: 'TSS ajusté pour denivelé',
                hike: 'TSS lower intensity',
                weight_training: 'Volume etTSS bas',
                hiit: 'TSS elevated'
            }
        });
    } catch (error) {
        logger.error('Sports list error:', error);
        res.status(500).json({ error: 'Erreur liste sports' });
    }
});

module.exports = router;
