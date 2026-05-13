'use strict';

const { MathUtils } = require('./math_utils');
const { PMC } = require('./pmc');
const { Polarization } = require('./polarization');
const { Taper } = require('./taper');
const SCIENTIFIC_CONSTANTS = require('./scientific_constants');
const { RunningPerformance } = require('./running_performance');

const Recommendations = {
    /**
     * Génération de recommandation d'entraînement
     * Intègre tous les modèles scientifiques: PMC, HRV, ACWR, Polarization, TSB
     */
    generate: (profile, historyCtx, dateContext) => {
        const {
            vdot = 30,
            level = 'intermediate',
        } = profile || {};
        
        const {
            weeklyLoad = 0,
            acwr = 1,
            readiness = 70,
            polarizationIndex = 50,
            monotony = 1.5,
            daysSinceLongRun = 999,
            daysSinceInterval = 999,
            daysSinceThreshold = 999,
            currentStreak = 0,
            avgRecentIF = 0.7,
            consecutiveHardDays = 0,
        } = historyCtx || {};
        
        const { dayOfWeek = new Date().getDay(), daysToCompetition = 999 } = dateContext || {};
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const _acwrStatus = PMC.getACWRStatus(acwr);
        const _polarRec = Polarization.getRecommendation(polarizationIndex);
        
        // ===== RÈGLES DE DÉCISION SCIENTIFIQUES (priorité décroissante) =====
        
        // 0. Competition proche — taper
        if (daysToCompetition <= 21 && daysToCompetition > 0) {
            const taper = Taper.calculateOptimalTaper(weeklyLoad, daysToCompetition, '10k', level);
            const todayPlan = taper.plan.find(p => p.daysOut === daysToCompetition);
            return {
                type: 'TAPER',
                intensity: todayPlan?.sessionType === 'competition' ? 'competition' : 'low',
                intensityColor: daysToCompetition <= 3 ? 'gold' : 'blue',
                title: daysToCompetition <= 3 ? 'Pré-course' : 'Taper',
                subtitle: `J-${daysToCompetition} — ${todayPlan?.sessionDescription || 'Réduction progressive'}`,
                description: `Phase d'affûtage. Volume réduit à ${todayPlan?.volumePercent || 60}%.`,
                advice: daysToCompetition <= 3 ? 'Repos et hydratation. Visualisation mentale.' : 'Suivez le plan de taper.',
                structure: [todayPlan?.sessionDescription || '30min endurance légère'],
                physiologicalGain: 'Supercompensation, récupération',
                taper: taper,
                metrics: { readiness, acwr, daysToCompetition },
                scientificBasis: 'Mujika & Padilla (2003)',
            };
        }
        
        // 1. Overtraining / ACWR critique
        if (acwr > 1.5) {
            return {
                type: 'RECOVERY',
                intensity: 'low',
                intensityColor: 'blue',
                title: 'Récupération Active',
                subtitle: `Charge excessive (ACWR: ${acwr.toFixed(2)})`,
                description: 'Votre charge dépasse les seuils de sécurité. Priorité récupération.',
                advice: 'Footing très léger (< 30min zone 1) ou repos complet. Hydratation et sommeil optimaux.',
                structure: ['Repos ou footing < 30min zone 1 (< 60% FCM)'],
                physiologicalGain: 'Récupération, réparation musculaire',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'danger', message: `ACWR ${acwr.toFixed(2)} > 1.5 — Risque blessure élevé` }],
                scientificBasis: 'Gabbett 2016; Maupin 2020',
            };
        }
        
        // 2. Fatigue CNS (streak + readiness basse)
        if (currentStreak > 4 && readiness < 40) {
            return {
                type: 'REST',
                intensity: 'rest',
                intensityColor: 'gray',
                title: 'Repos Biologique',
                subtitle: `Fatigue CNS — Readiness: ${readiness}%`,
                description: 'Fatigue du système nerveux central détectée.',
                advice: 'Repos complet. Stretching, foam roller, hydratation.',
                structure: ['Jour de repos total'],
                physiologicalGain: 'Récupération CNS, restauration glycogène',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'warning', message: `CNS fatigue — Streak ${currentStreak} jours` }],
                scientificBasis: 'Meeusen 2013 OTS consensus',
            };
        }
        
        // 3. Jours consécutifs difficiles
        if (consecutiveHardDays >= 4) {
            return {
                type: 'RECOVERY',
                intensity: 'low',
                intensityColor: 'blue',
                title: 'Récupération',
                subtitle: `${consecutiveHardDays} jours difficiles consécutifs`,
                description: 'Besoin de récupération après une série intense.',
                advice: 'Endurance fondamentale très légère ou repos actif.',
                structure: ['30-45min endurance zone 1-2'],
                physiologicalGain: 'Récupération, adaptation',
                metrics: { readiness, acwr, consecutiveHardDays },
                warnings: [{ type: 'warning', message: `${consecutiveHardDays} jours consécutifs — récupération nécessaire` }],
                scientificBasis: 'Foster 1998',
            };
        }
        
        // 4. Monotonie excessive
        if (monotony > SCIENTIFIC_CONSTANTS.MONOTONY.WARNING) {
            return {
                type: 'VARIED',
                intensity: 'varied',
                intensityColor: 'purple',
                title: 'Séance Variée',
                subtitle: `Monotonie: ${monotony.toFixed(2)}`,
                description: 'Votre entraînement manque de variété.',
                advice: 'Fartlek ou séance avec changements d\'allure.',
                structure: [
                    '15 min échauffement',
                    '30-40 min fartlek (accélérations naturelles)',
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Variabilité neuromusculaire',
                metrics: { readiness, acwr, polarizationIndex, monotony },
                warnings: [{ type: 'warning', message: `Monotonie élevée: ${monotony.toFixed(2)}` }],
                scientificBasis: 'Foster 1998; Halson 2014',
            };
        }
        
        // 5. Sortie longue (weekend + besoin)
        if (daysSinceLongRun > 9 && isWeekend && readiness > 50) {
            const longDist = Math.min(32, Math.max(15, weeklyLoad / 10));
            const pace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.E_LOW);
            
            return {
                type: 'LONG_RUN',
                intensity: 'moderate',
                intensityColor: 'green',
                title: 'Sortie Longue',
                subtitle: `${Math.round(longDist)}km — ${MathUtils.formatPace(pace)}/km`,
                description: 'Pilier de la construction aérobie. Développer mitochondries et capillaires.',
                advice: 'Commencez doucement. Hydratation et nutrition si > 90min.',
                structure: [
                    '15 min échauffement progressif',
                    `${Math.round(longDist - 5)}km à ${MathUtils.formatPace(pace)}/km`,
                    'Retour au calme 5-10min'
                ],
                physiologicalGain: 'Biogenèse mitochondriale, capillarisation',
                targetDistance: longDist * 1000,
                targetPace: MathUtils.formatPace(pace),
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2019; Joyner & Coyle 1993',
            };
        }
        
        // 6. Séance VMA/Intervalle (conditions optimales)
        if (readiness > 65 && daysSinceInterval > 5 && polarizationIndex < 80 && !isWeekend && acwr <= 1.3) {
            const reps = avgRecentIF > 0.85 ? 4 : 6;
            const vmaPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.I);
            
            return {
                type: 'INTERVAL',
                intensity: 'high',
                intensityColor: 'red',
                title: 'VMA — Puissance Aérobie',
                subtitle: `${reps} x 1000m à ${MathUtils.formatPace(vmaPace)}/km`,
                description: 'Développer le VO2max. Conditions optimales selon readiness et polarization.',
                advice: 'Régularité indispensable. Récupération 3min entre répétitions.',
                structure: [
                    '20 min échauffement progressif',
                    `${reps} x 1000m à ${MathUtils.formatPace(vmaPace)} (récup 3min)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'VO2max, puissance aérobie',
                targetPace: MathUtils.formatPace(vmaPace),
                targetReps: reps,
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2006; Daniels 2021',
            };
        }
        
        // 7. Séance Seuil
        if (readiness > 55 && daysSinceThreshold > 4 && !isWeekend) {
            const thresholdPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.T);
            const blockDuration = Math.max(5, Math.min(15, Math.round(weeklyLoad / 30)));
            
            return {
                type: 'THRESHOLD',
                intensity: 'threshold',
                intensityColor: 'orange',
                title: 'T — Seuil Anaérobie',
                subtitle: `3 x ${blockDuration}min à ${MathUtils.formatPace(thresholdPace)}`,
                description: 'Améliorer la capacité à soutenir haute intensité.',
                advice: 'Effort "confortablement difficile". Respiration contrôlée.',
                structure: [
                    '15 min échauffement',
                    `3 x ${blockDuration}min à ${MathUtils.formatPace(thresholdPace)} (récup 1min)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Seuil lactique, efficacité aérobie',
                targetPace: MathUtils.formatPace(thresholdPace),
                metrics: { readiness, acwr, polarizationIndex, monotony },
                scientificBasis: 'Seiler 2011; Gaesser & Poole 1986',
            };
        }
        
        // 8. Polarisation — besoin de haute intensité
        if (polarizationIndex < 60 && readiness > 60 && daysSinceInterval > 3) {
            const shortReps = 8;
            const shortPace = RunningPerformance.getPaceSeconds(vdot, SCIENTIFIC_CONSTANTS.VDOT.R);
            
            return {
                type: 'SPEED',
                intensity: 'high',
                intensityColor: 'red',
                title: 'Vitesse — Répétitions courtes',
                subtitle: `${shortReps} x 200m à ${MathUtils.formatPace(shortPace)}`,
                description: 'Améliorer la polarisation. Séance courte et intense.',
                advice: 'Récupération complète entre répétitions.',
                structure: [
                    '20 min échauffement',
                    `${shortReps} x 200m à ${MathUtils.formatPace(shortPace)} (récup 90s)`,
                    '10 min retour au calme'
                ],
                physiologicalGain: 'Puissance neuromusculaire, économie de course',
                targetPace: MathUtils.formatPace(shortPace),
                metrics: { readiness, acwr, polarizationIndex },
                scientificBasis: 'Seiler 2006 (80/20)',
            };
        }
        
        // 9. Endurance fondamentale (défaut)
        const enduranceDuration = weeklyLoad > 200 ? 60 : 45;
        const easyPace = RunningPerformance.getPaceSeconds(vdot, 0.68);
        
        return {
            type: 'EASY',
            intensity: 'moderate',
            intensityColor: 'green',
            title: 'Endurance Fondamentale',
            subtitle: `${enduranceDuration}min à ${MathUtils.formatPace(easyPace)}`,
            description: 'Base du volume d\'entraînement. Développement aérobie basse intensité.',
            advice: 'Allure conversable. Respiration nasale si possible.',
            structure: [
                `${enduranceDuration} min endurance à ${MathUtils.formatPace(easyPace)}/km`,
                '+ 6 lignes droites si VMA à travailler'
            ],
            physiologicalGain: 'Capillarisation, économie de course, densité mitochondriale',
            targetPace: MathUtils.formatPace(easyPace),
            targetDuration: enduranceDuration,
            metrics: { readiness, acwr, polarizationIndex, monotony },
            scientificBasis: 'Seiler 2006 (80/20); Bassett & Howley 2000',
        };
    },
    
    /**
     * Alias pour compatibilité
     */
    getRecommendation: (profile, historyCtx, dateContext) =>
        Recommendations.generate(profile, historyCtx, dateContext),
    
    /**
     * Analyse complète de l'historique d'entraînement
     */
    analyzeTrainingHistory: (activities, options = {}) => {
        if (!activities || activities.length === 0) {
            return {
                weeklyLoad: 0, chronicLoad: 0, acwr: 1,
                readiness: 70, polarizationIndex: 0, monotony: 1,
                daysSinceLongRun: 999, daysSinceInterval: 999, daysSinceThreshold: 999,
                currentStreak: 0, avgRecentIF: 0.7, daysActive: 0,
                recentActivities: 0, trainingFrequency: 0, consecutiveHardDays: 0,
            };
        }
        
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
        
        const weekActs = activities.filter(a => new Date(a.date) >= weekAgo);
        const monthActs = activities.filter(a => new Date(a.date) >= monthAgo);
        
        const weeklyLoad = weekActs.reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
        const monthlyLoad = monthActs.reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
        const chronicLoad = monthlyLoad / 4;
        const acwr = PMC.calculateACWR(weeklyLoad, chronicLoad);
        
        // Monotonie
        const dailyLoads = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStr = d.toISOString().split('T')[0];
            const dayLoad = activities.filter(a => a.date?.startsWith(dayStr))
                .reduce((s, a) => s + (a.tss || a.trimp || a.load || 50), 0);
            dailyLoads.push(dayLoad);
        }
        const monotony = PMC.calculateMonotony(dailyLoads);
        
        // Jours depuis dernière longue
        const longRuns = activities.filter(a => (a.distance || 0) > 10000);
        const daysSinceLongRun = longRuns.length > 0
            ? Math.floor((today - new Date(longRuns[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Jours depuis dernier intervalle
        const intervals = activities.filter(a => (a.tss || a.trimp || 0) > 80);
        const daysSinceInterval = intervals.length > 0
            ? Math.floor((today - new Date(intervals[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Jours depuis dernier seuil
        const thresholds = activities.filter(a => {
            const if_ = a.intensityFactor || a.if_factor || 0;
            return if_ >= 0.85 && if_ < 0.95;
        });
        const daysSinceThreshold = thresholds.length > 0
            ? Math.floor((today - new Date(thresholds[0].date)) / (24 * 60 * 60 * 1000))
            : 999;
        
        // Streak
        let streak = 0;
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        while (activities.some(a => a.date?.startsWith(checkDate.toISOString().split('T')[0]))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Jours consécutifs difficiles
        let consecutiveHard = 0;
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        const minCheckDate = new Date(today);
        minCheckDate.setDate(minCheckDate.getDate() - 90);
        while (checkDate >= minCheckDate) {
            const dayStr = checkDate.toISOString().split('T')[0];
            const dayActs = activities.filter(a => a.date?.startsWith(dayStr));
            const dayLoad = dayActs.reduce((s, a) => s + (a.tss || a.trimp || 0), 0);
            if (dayLoad > 80) {
                consecutiveHard++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
        
        // IF moyen récent
        const recentIFs = weekActs.map(a => a.intensityFactor || a.if_factor || 0.7);
        const avgRecentIF = recentIFs.length > 0 ? recentIFs.reduce((a, b) => a + b, 0) / recentIFs.length : 0.7;
        
        // Readiness
        const readiness = PMC.estimateReadiness(
            PMC.calculate(activities),
            options.hrvRmssd || 0,
            options.sleepHours || 7
        );
        
        // Polarisation
        const polarizationIndex = Polarization.calculatePolarizationIndex(
            weekActs.map(a => a.zoneDistribution || {})
        );
        
        // TSB
        const pmcData = PMC.calculate(activities);
        const latestPMC = pmcData.length > 0 ? pmcData[pmcData.length - 1] : null;
        const tsb = latestPMC?.tsb || 0;
        
        return {
            weeklyLoad: Math.round(weeklyLoad),
            chronicLoad: Math.round(chronicLoad),
            acwr: Math.round(acwr * 100) / 100,
            readiness,
            polarizationIndex,
            monotony: Math.round(monotony * 100) / 100,
            daysSinceLongRun,
            daysSinceInterval,
            daysSinceThreshold,
            currentStreak: streak,
            avgRecentIF: Math.round(avgRecentIF * 100) / 100,
            daysActive: activities.length,
            recentActivities: weekActs.length,
            trainingFrequency: weekActs.length > 0 ? Math.round(weekActs.length * 100 / 7) : 0,
            consecutiveHardDays: consecutiveHard,
            tsb,
        };
    },
};

module.exports = { Recommendations };
