/* eslint-disable unused-imports/no-unused-vars, security/detect-object-injection, no-undef, no-case-declarations */
/**
 * coach_plan.js — Advanced Adaptive Training Plan Generation v2.0
 *
 * Améliorations:
 * - Periodisation scientifique (Matveyev, Bompa, Issurin)
 * - Détection de fatigue et ajustement adaptatif
 * - Intégration PMC (Fitness/Fatigue/Form)
 * - Analyse de charge chronique/aiguë (ACWR)
 * - Prédictions de performance basées sur l'entraînement
 * - Recommandations personnalisées avec ML léger
 *
 * Uses the per-user DB architecture:
 *   - main.db helpers (dbGetMain, dbRunMain, dbAllMain) for user lookups
 *   - user DB helpers (dbGetUser, dbRunUser, dbAllUser) for plan/session data
 */
const {
    dbGetMain,
    dbRunMain,
    dbAllMain,
    getUserDb,
    dbGetUser,
    dbRunUser,
    dbAllUser
} = require('./database.js');
const {
    Cardiovascular,
    TrainingLoad,
    PMC,
    MathUtils,
    RunningPerformance,
    Taper,
    HRV,
    CriticalPower,
    Overtraining,
    Polarization,
    Recommendations,
} = require('./algorithms');

const SESSION_TYPES = {
    E: 'Endurance',
    L: 'Long',
    I: 'Interval',
    T: 'Threshold',
    S: 'Seuil',
    R: 'Repos',
    PPG: 'PPG',
    F: 'Fartlek',
    M: 'Marathon Pace',
    C: 'Competition'
};

const GOAL_DURATIONS = {
    health: 8,
    weight_loss: 12,
    '5k': 8,
    '10k': 10,
    half: 12,
    marathon: 16,
    ultra: 20,
    custom: 10,
    improvement: 10
};

// Coefficients de periodisation scientifique
const PERIODIZATION = {
    // Matveyev Model - Volume et intensité par phase
    phases: {
        base: { volume: 0.6, intensity: 0.3, progression: 0.05 },
        build: { volume: 0.9, intensity: 0.6, progression: 0.08 },
        peak: { volume: 1.0, intensity: 0.8, progression: 0.02 },
        taper: { volume: 0.5, intensity: 0.5, progression: -0.15 },
        race: { volume: 0.3, intensity: 0.2, progression: 0 }
    },
    // Issurin Block Periodization
    blocks: {
        accumulative: { volume: 0.85, intensity: 0.4, focus: 'aerobic_capacity', duration_weeks: 4 },
        transmutation: { volume: 0.70, intensity: 0.7, focus: 'lactate_threshold', duration_weeks: 3 },
        realization: { volume: 0.40, intensity: 0.85, focus: 'race_specificity', duration_weeks: 2 },
    },
    // Distribution 80/20 polarisée optimale (Seiler)
    polarized: {
        low: 0.80,
        moderate: 0.05,
        high: 0.15
    },
    // Seuil pyramidal traditionnel
    pyramidal: {
        low: 0.70,
        moderate: 0.20,
        high: 0.10
    },
    // Polarisation inversée pour athlètes avancés
    reverse_periodization: {
        low: 0.55,
        moderate: 0.15,
        high: 0.30
    }
};

// Seuils de charge d'entraînement (Gabbett ACWR)
const ACWR_THRESHOLDS = {
    danger: 1.5,
    risky: 1.3,
    optimal: 1.0,
    under: 0.8
};

// Seuils de fatigue PMC
const FATIGUE_THRESHOLDS = {
    severe: -30,    // Repos obligatoire
    high: -20,      // Réduction volume
    moderate: -10,  // Surveillance
    optimal: 5      // Forme optimale
};

/**
 * Génère des sessions avec periodisation avancée et adaptation
 */
function generateSessionsForPlan(planId, weeks, sessionsPerWeek, trainingDays, goal, vdot, targetDistance, usePPG = false, userHistory = null) {
    const sessions = [];
    const goalDuration = GOAL_DURATIONS[goal] || 10;
    
    // Analyser l'historique utilisateur pour personnalisation
    const userProfile = analyzeUserHistory(userHistory);
    
    // Calculer le volume de base adapté au profil
    const baseVolume = calculateBaseVolume(targetDistance, goal, userProfile);
    
    for (let week = 1; week <= weeks; week++) {
        const phase = getPhaseForWeek(week, weeks);
        const weekProgression = calculateWeekProgression(week, weeks, phase, userProfile);
        
        // Ajuster selon la fatigue prédite
        const predictedFatigue = predictWeeklyFatigue(sessions, week, userProfile);
        const adjustedVolume = adjustVolumeForFatigue(baseVolume * weekProgression, predictedFatigue);
        
        const weekSessions = generateWeekSessionsAdvanced(
            phase, 
            week, 
            sessionsPerWeek, 
            trainingDays, 
            goal, 
            vdot, 
            adjustedVolume,
            week === 1,
            usePPG,
            userProfile
        );
        
        for (const session of weekSessions) {
            sessions.push({
                plan_id: planId,
                week_number: week,
                day_number: session.dayNumber,
                type: session.type,
                title: session.title,
                description: session.description,
                distance_target: session.distance,
                time_target: session.time,
                intensity: session.intensity,
                target_pace: session.targetPace,
                target_hr_zone: session.targetHRZone,
                expected_tss: session.expectedTSS,
                progression_factor: weekProgression,
                phase: phase
            });
        }
    }
    
    return sessions;
}

/**
 * Analyse l'historique utilisateur pour extraire le profil
 */
function analyzeUserHistory(history) {
    if (!history || !history.activities || history.activities.length === 0) {
        return {
            avgWeeklyKm: 30,
            avgWeeklyHours: 4,
            preferredIntensity: 'moderate',
            fatigueResistance: 'normal',
            recoveryRate: 'normal',
            bestVDOT: null,
            lastTestDate: null,
            injuryHistory: [],
            preferredSessionTypes: ['E', 'L'],
            trainingMonotony: null,
            trainingStrain: null,
            polarizationIndex: null,
            hrvBaseline: null,
            fitnessLevel: 'intermediate',
        };
    }

    const activities = history.activities;
    const totalKm = activities.reduce((sum, a) => sum + (a.distance || 0) / 1000, 0);
    const totalHours = activities.reduce((sum, a) => sum + (a.moving_time || 0) / 3600, 0);
    const weeks = Math.max(1, activities.length / 4);

    // Calculer la variabilité de la FC pour déterminer la résistance à la fatigue
    const hrs = activities.filter(a => a.average_heartrate).map(a => a.average_heartrate);
    const hrVariability = hrs.length > 1 ? MathUtils.stdDev(hrs) / MathUtils.mean(hrs) : 0;

    // Calculer la monotonie d'entraînement (Foster)
    const dailyTSS = activities.map(a => a.tss || 50);
    const meanTSS = MathUtils.mean(dailyTSS);
    const stdDevTSS = MathUtils.stdDev(dailyTSS);
    const monotony = meanTSS > 0 ? stdDevTSS / meanTSS : 1.5;
    const strain = meanTSS * monotony;

    // Analyser la polarisation
    const intensityDist = Polarization.classifyDistribution(activities.map(a => ({
        duration: a.moving_time || 1800,
        averageHR: a.average_heartrate,
        maxHR: a.max_heartrate,
    })));

    // Niveau de forme basé sur le volume et la régularité
    const weeklyKm = totalKm / weeks;
    const fitnessLevel = weeklyKm > 60 ? 'advanced' : weeklyKm > 30 ? 'intermediate' : 'beginner';

    return {
        avgWeeklyKm: Math.round(totalKm / weeks),
        avgWeeklyHours: Math.round(totalHours / weeks * 10) / 10,
        preferredIntensity: hrVariability > 0.05 ? 'high' : 'moderate',
        fatigueResistance: hrVariability > 0.08 ? 'high' : hrVariability > 0.04 ? 'normal' : 'low',
        recoveryRate: 'normal',
        bestVDOT: history.best_vdot || null,
        lastTestDate: history.last_test || null,
        injuryHistory: history.injuries || [],
        preferredSessionTypes: calculatePreferredTypes(activities),
        trainingMonotony: Math.round(monotony * 100) / 100,
        trainingStrain: Math.round(strain),
        polarizationIndex: intensityDist,
        hrvBaseline: history.hrv_baseline || null,
        fitnessLevel,
    };
}

function calculatePreferredTypes(activities) {
    const types = activities.map(a => a.type || 'run');
    const counts = {};
    types.forEach(t => counts[t] = (counts[t] || 0) + 1);
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);
}

function calculateBaseVolume(targetDistance, goal, userProfile) {
    // Base sur l'objectif
    let baseKm = targetDistance > 0 ? targetDistance / 10 : userProfile.avgWeeklyKm;
    
    // Ajuster selon le type d'objectif
    const goalMultipliers = {
        health: 0.8,
        weight_loss: 1.0,
        '5k': 1.0,
        '10k': 1.2,
        half: 1.5,
        marathon: 2.0,
        ultra: 2.5,
        improvement: 1.3
    };
    
    return baseKm * (goalMultipliers[goal] || 1.0);
}

function calculateWeekProgression(week, totalWeeks, phase, userProfile) {
    const baseProgression = PERIODIZATION.phases[phase].progression;
    const volumeMultiplier = PERIODIZATION.phases[phase].volume;
    
    // Progression cumulative
    let progression = 1.0;
    for (let w = 1; w <= week; w++) {
        const wPhase = getPhaseForWeek(w, totalWeeks);
        progression += PERIODIZATION.phases[wPhase].progression;
    }
    
    // Ne jamais dépasser 10% de progression hebdomadaire (règle de sécurité)
    const maxWeeklyIncrease = 1.1;
    const baseWeek = week > 1 ? Math.pow(1.05, week - 1) : 1;
    
    return Math.min(progression * volumeMultiplier, baseWeek * maxWeeklyIncrease);
}

function predictWeeklyFatigue(existingSessions, currentWeek, userProfile) {
    if (existingSessions.length === 0 || currentWeek < 2) {
        return { fitness: 0, fatigue: 0, form: 0, acwr: 1, risk: 'low' };
    }

    // Calculer la charge des 4 dernières semaines
    const recentSessions = existingSessions.filter(s => s.week_number >= currentWeek - 4);
    const weeklyLoad = {};

    recentSessions.forEach(s => {
        const week = s.week_number;
        const tss = s.expected_tss || calculateEstimatedTSS(s);
        weeklyLoad[week] = (weeklyLoad[week] || 0) + tss;
    });

    const loads = Object.values(weeklyLoad);
    if (loads.length < 2) return { fitness: 0, fatigue: 0, form: 0, risk: 'low' };

    // Calculer ACWR (correct: acute/chronic)
    const acute = loads[loads.length - 1];
    const chronic = loads.slice(-4).reduce((a, b) => a + b, 0) / Math.min(4, loads.length);
    const acwr = chronic > 0 ? acute / chronic : 1;

    // PMC-based prediction using Banister impulse-response
    const pmcData = loads.map((tss, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        tss,
    }));
    const personalizedTau = PMC.getPersonalizedTau?.({
        level: userProfile?.fitnessLevel || 'intermediate',
        age: 30,
        trainingYears: 3,
    });
    const pmcResult = PMC.calculate(pmcData, {
        ctlTau: personalizedTau?.ctlTau || 42,
        atlTau: personalizedTau?.atlTau || 7,
    });

    const lastPmc = pmcResult[pmcResult.length - 1];
    const tsb = lastPmc.ctl - lastPmc.atl;

    // Performance prediction from PMC (Busso model)
    const predictedPerformance = PMC.predictPerformance?.(lastPmc.ctl, tsb);

    return {
        fitness: lastPmc.ctl,
        fatigue: lastPmc.atl,
        form: tsb,
        acwr: acwr,
        risk: acwr > ACWR_THRESHOLDS.danger ? 'high' : acwr > ACWR_THRESHOLDS.risky ? 'moderate' : 'low',
        predictedPerformance: predictedPerformance?.performancePercent || 100,
        tsb,
    };
}

function adjustVolumeForFatigue(volume, fatigue) {
    if (fatigue.risk === 'high') {
        return volume * 0.7; // Réduction de 30%
    } else if (fatigue.risk === 'moderate') {
        return volume * 0.85; // Réduction de 15%
    }
    return volume;
}

function calculateEstimatedTSS(session) {
    // Estimation basée sur la durée et l'intensité
    const durationHours = (session.time_target || 3600) / 3600;
    const intensity = session.intensity === 'high' ? 0.9 : 
                    session.intensity === 'moderate' ? 0.75 : 0.65;
    return Math.round(durationHours * intensity * intensity * 100);
}

function getPhaseForWeek(week, totalWeeks) {
    const progress = week / totalWeeks;
    if (progress < 0.25) return 'base';
    if (progress < 0.5) return 'build';
    if (progress < 0.75) return 'peak';
    return 'taper';
}

function generateWeekSessions(phase, weekNum, sessionsPerWeek, trainingDays, goal, vdot, targetDistance, isFirstWeek, usePPG = false, userProfile = null) {
    const sessions = [];
    const baseVolume = targetDistance > 0 ? targetDistance / 12 : 30;
    const volumeMultiplier = getVolumeMultiplier(phase, weekNum);
    const weekDistance = baseVolume * volumeMultiplier;

    // Adjust volume based on HRV readiness if available
    let readinessFactor = 1.0;
    if (userProfile?.hrvBaseline) {
        const hrvStatus = HRV.analyzeRecovery?.({
            currentHRV: userProfile.hrvBaseline,
            baseline: userProfile.hrvBaseline,
            trend: 'stable',
        });
        if (hrvStatus?.readiness === 'low') readinessFactor = 0.8;
        else if (hrvStatus?.readiness === 'high') readinessFactor = 1.1;
    }

    const typeDistribution = usePPG
        ? getPPGTypeDistribution(phase, sessionsPerWeek)
        : getTypeDistribution(phase, sessionsPerWeek, goal);

    let dayIndex = 0;
    for (const day of trainingDays) {
        if (dayIndex >= sessionsPerWeek) break;

        const sessionType = typeDistribution[dayIndex % typeDistribution.length];
        const isLongDay = day === 6 || day === 0;

        const session = createSession(
            day,
            sessionType,
            weekDistance / sessionsPerWeek * readinessFactor,
            phase,
            vdot,
            isLongDay,
            isFirstWeek,
            goal,
            userProfile
        );

        sessions.push(session);
        dayIndex++;
    }

    return sessions;
}

function getVolumeMultiplier(phase, week, totalWeeks = 12) {
    // Periodisation avancée selon Matveyev/Bompa
    switch (phase) {
        case 'base': 
            // Progression lente en base (60% → 80%)
            return 0.6 + Math.min(week * 0.05, 0.2);
        case 'build': 
            // Build intensif (80% → 110%)
            const buildWeek = week - Math.floor(totalWeeks * 0.25);
            return 0.8 + Math.min(buildWeek * 0.08, 0.3);
        case 'peak': 
            // Peak stable à 100%
            return 1.0;
        case 'taper': 
            // Taper progressif (50% → 30%)
            const taperWeek = week - Math.floor(totalWeeks * 0.75);
            return Math.max(0.3, 0.5 - (taperWeek * 0.1));
        case 'race':
            return 0.25;
        default: 
            return 1.0;
    }
}

function getIntensityDistribution(phase, sessionsPerWeek, usePPG = false) {
    if (usePPG) {
        // Distribution polarisée 80/20
        return {
            low: Math.floor(sessionsPerWeek * 0.75),
            moderate: Math.max(0, Math.floor(sessionsPerWeek * 0.05)),
            high: Math.ceil(sessionsPerWeek * 0.20)
        };
    }
    
    // Distribution pyramide modifiée selon la phase
    const distributions = {
        base: { low: 0.85, moderate: 0.10, high: 0.05 },
        build: { low: 0.70, moderate: 0.15, high: 0.15 },
        peak: { low: 0.60, moderate: 0.15, high: 0.25 },
        taper: { low: 0.80, moderate: 0.15, high: 0.05 }
    };
    
    const dist = distributions[phase] || distributions.base;
    return {
        low: Math.floor(sessionsPerWeek * dist.low),
        moderate: Math.max(1, Math.floor(sessionsPerWeek * dist.moderate)),
        high: Math.max(1, Math.ceil(sessionsPerWeek * dist.high))
    };
}

function getTypeDistribution(phase, sessionsPerWeek, goal = 'improvement') {
    // Distributions scientifiquement optimisées selon l'objectif
    const distributions = {
        // Base: fondamental avec sortie longue
        base: {
            health: ['E', 'E', 'E', 'L'],
            '5k': ['E', 'E', 'I', 'L'],
            '10k': ['E', 'E', 'T', 'L'],
            half: ['E', 'E', 'E', 'L'],
            marathon: ['E', 'E', 'E', 'L', 'M'],
            ultra: ['E', 'E', 'E', 'L', 'L'],
            improvement: ['E', 'E', 'F', 'L']
        },
        // Build: introduction de l'intensité
        build: {
            health: ['E', 'I', 'E', 'L'],
            '5k': ['E', 'I', 'T', 'L'],
            '10k': ['E', 'I', 'T', 'L'],
            half: ['E', 'I', 'T', 'L'],
            marathon: ['E', 'M', 'T', 'L'],
            ultra: ['E', 'E', 'L', 'L', 'H'],
            improvement: ['E', 'I', 'T', 'L']
        },
        // Peak: intensité maximale
        peak: {
            health: ['E', 'I', 'E', 'L'],
            '5k': ['I', 'I', 'T', 'L'],
            '10k': ['I', 'T', 'I', 'L'],
            half: ['I', 'T', 'I', 'L'],
            marathon: ['M', 'T', 'M', 'L'],
            ultra: ['L', 'H', 'L', 'E'],
            improvement: ['I', 'I', 'T', 'L']
        },
        // Taper: réduction volume, maintien intensité légère
        taper: {
            health: ['E', 'E', 'R', 'L'],
            '5k': ['E', 'I', 'R', 'L'],
            '10k': ['E', 'T', 'R', 'L'],
            half: ['E', 'T', 'R', 'L'],
            marathon: ['E', 'M', 'R', 'L'],
            ultra: ['E', 'E', 'R', 'E'],
            improvement: ['E', 'F', 'R', 'L']
        }
    };
    
    const phaseDist = distributions[phase] || distributions.base;
    const base = phaseDist[goal] || phaseDist.improvement;
    return base.slice(0, sessionsPerWeek);
}

function getPPGTypeDistribution(phase, sessionsPerWeek) {
    // Periodisation Polarized PPG (Seiler)
    const distributions = {
        base: ['E', 'E', 'E', 'E', 'L'],
        build: ['E', 'PPG', 'E', 'E', 'L'],
        peak: ['PPG', 'PPG', 'E', 'L'],
        taper: ['E', 'E', 'R', 'L']
    };
    
    const base = distributions[phase] || distributions.base;
    return base.slice(0, sessionsPerWeek);
}

/**
 * Crée une session d'entraînement avec spécifications avancées
 */
function createSession(day, type, weekAvgDistance, phase, vdot, isLongDay, isFirstWeek, goal = 'improvement', userProfile = null) {
    const paces = calculatePaces(vdot);
    const hrZones = calculateHRZones(vdot);

    // Power zones if FTP available
    const powerZones = userProfile?.ftp ? Cardiovascular.calculatePowerZones?.(userProfile.ftp) : null;

    // Dynamic VDOT-based pacing adjustments
    const riegelExponent = RunningPerformance.getRiegelExponent?.(goal === '5k' ? 5 : goal === '10k' ? 10 : 21);

    let distance, time, intensity, title, description, targetPace, targetHRZone, expectedTSS;
    let targetPower = null;
    let steps = [];
    
    switch (type) {
        case 'E': // Endurance fondamentale
            distance = isFirstWeek ? weekAvgDistance * 0.8 : weekAvgDistance * (isLongDay ? 1.2 : 1.0);
            time = Math.round((distance * 1000) / (paces.easyMs || 3.5));
            intensity = 'low';
            title = 'Endurance Fondamentale';
            targetPace = paces.easy;
            targetHRZone = 'Zone 2 (60-70% FCM)';
            expectedTSS = Math.round((time / 3600) * 60);
            description = `${Math.round(distance)}km à ${targetPace}/km (FC: ${targetHRZone}). ` +
                `Objectif: développer l'endurance aérobie de base. ` +
                `Allure conversationnelle, respiration contrôlée.`;
            break;
            
        case 'L': // Sortie longue
            distance = isFirstWeek ? weekAvgDistance * 0.7 : weekAvgDistance * 1.5;
            time = Math.round((distance * 1000) / (paces.easyMs || 3.3));
            intensity = 'moderate';
            title = 'Sortie Longue Progressive';
            targetPace = `${paces.easy} - ${paces.marathon}`;
            targetHRZone = 'Zone 2-3 (65-75% FCM)';
            expectedTSS = Math.round((time / 3600) * 70);
            description = `${Math.round(distance)}km progression. ` +
                `Premiers ${Math.round(distance * 0.6)}km à ${paces.easy}/km, ` +
                `derniers ${Math.round(distance * 0.4)}km à ${paces.marathon}/km. ` +
                `Hydratation et nutrition recommandées.`;
            break;
            
        case 'M': // Marathon pace
            distance = Math.min(weekAvgDistance * 0.8, isFirstWeek ? 12 : 25);
            time = Math.round((distance * 1000) / (paces.marathonMs || 3.8));
            intensity = 'moderate';
            title = 'Allure Marathon';
            targetPace = paces.marathon;
            targetHRZone = 'Zone 3 (75-80% FCM)';
            expectedTSS = Math.round((time / 3600) * 80);
            description = `${Math.round(distance)}km en continu à allure marathon (${targetPace}/km). ` +
                `Travail spécifique en vue de l'objectif.`;
            break;
            
        case 'T': // Seuil/Tempo
            const tDistance = isFirstWeek ? 4000 : Math.min(12000, weekAvgDistance * 1000 * 0.4);
            const tReps = tDistance <= 6000 ? 2 : 3;
            const tRepDist = Math.round(tDistance / tReps / 1000 * 10) / 10;
            distance = tDistance / 1000;
            time = Math.round((tDistance) / (paces.thresholdMs || 4.2));
            intensity = 'high';
            title = 'Seuil Lactique';
            targetPace = paces.threshold;
            targetHRZone = 'Zone 4 (80-88% FCM)';
            expectedTSS = Math.round((time / 3600) * 90);
            description = `${tReps}x${tRepDist}km à ${targetPace}/km ` +
                `(récup 3min très lent). Développe la résistance à l'acide lactique.`;
            break;
            
        case 'I': // Intervalles VO2max
            const reps = phase === 'peak' ? 8 : phase === 'build' ? 6 : isFirstWeek ? 4 : 5;
            const repDist = goal === '5k' ? 800 : 1000;
            distance = (reps * repDist) / 1000;
            const workTime = (reps * repDist) / (paces.intervalMs || 5.0);
            const recTime = reps * 180; // 3min recup
            time = Math.round(workTime + recTime);
            intensity = 'very_high';
            title = `Intervalles VO2max - ${repDist}m`;
            targetPace = paces.interval;
            targetHRZone = 'Zone 5 (88-95% FCM)';
            expectedTSS = Math.round((workTime / 3600) * 110);
            description = `Échauffement 2km + ${reps}x${repDist}m à ${targetPace}/km ` +
                `(récup 3min marche/jogging). Séance clé pour développer le VO2max. ` +
                `Ne pas faire si fatigue accumulée.`;
            break;
            
        case 'F': // Fartlek
            distance = weekAvgDistance * 0.9;
            time = Math.round((distance * 1000) / 3.8);
            intensity = 'moderate';
            title = 'Fartlek Ludique';
            targetPace = 'Variable';
            targetHRZone = 'Zone 2-4';
            expectedTSS = Math.round((time / 3600) * 75);
            description = `${Math.round(distance)}km avec 6-8 accélérations spontanées ` +
                `(30s-2min) suivies de récupération libre. Développe la vélocité.`;
            break;
            
        case 'S': // Seuil classique (version courte)
            distance = isFirstWeek ? 6 : 10;
            time = Math.round((distance * 1000) / (paces.thresholdMs || 4.2));
            intensity = 'high';
            title = 'Seuil Court';
            targetPace = paces.threshold;
            targetHRZone = 'Zone 4';
            expectedTSS = Math.round((time / 3600) * 85);
            description = `${distance}km à ${targetPace}/km en continu. ` +
                `Au seuil lactique, sensation "difficile mais soutenable".`;
            break;
            
        case 'R': // Repos
            distance = 0;
            time = 0;
            intensity = 'rest';
            title = 'Jour de Récupération';
            targetPace = '-';
            targetHRZone = '-';
            expectedTSS = 0;
            description = 'Repos complet ou marche légère 20-30min. ' +
                'Hydratation, sommeil, alimentation. Éviter tout effort intense.';
            break;
            
        case 'PPG': // Polarized PPG
            const ppgSets = phase === 'peak' ? 4 : phase === 'build' ? 3 : 2;
            const ppgReps = 4;
            distance = (ppgSets * ppgReps * 200) / 1000;
            const ppgWorkTime = (ppgSets * ppgReps * 200) / (paces.intervalMs || 5.5);
            const ppgRecBetween = (ppgSets - 1) * 180;
            const ppgRecWithin = ppgSets * ppgReps * 30;
            time = Math.round(ppgWorkTime + ppgRecBetween + ppgRecWithin + 1200); // +20min echauffement
            intensity = 'very_high';
            title = 'PPG - Progression Graded';
            targetPace = `${paces.interval} - ${paces.easy}`;
            targetHRZone = 'Zone 5/Zone 1';
            expectedTSS = Math.round((ppgWorkTime / 3600) * 120);
            description = `Échauffement 20min + ${ppgSets}x(${ppgReps}x200m progressifs: ` +
                `400m à ${paces.interval}/km → 200m à ${paces.easy}/km). ` +
                `Récup 30s entre reps, 3min entre séries. Séance polarisée complète.`;
            break;
            
        case 'C': // Competition
            distance = goal === '5k' ? 5 : goal === '10k' ? 10 : 
                      goal === 'half' ? 21.1 : goal === 'marathon' ? 42.195 : 10;
            time = Math.round((distance * 1000) / (paces.marathonMs || 3.8));
            intensity = 'race';
            title = `Course - ${goal.toUpperCase()}`;
            targetPace = paces.race || paces.marathon;
            targetHRZone = 'Zone 3-5 selon distance';
            expectedTSS = Math.round((time / 3600) * 100 * (distance / 10));
            description = `Course objectif: ${distance}km. Objectif: ${targetPace}/km. ` +
                `Bonne chance! Récupération active la semaine suivante.`;
            break;
            
        default:
            distance = weekAvgDistance * 0.8;
            time = 2400;
            intensity = 'low';
            title = 'Footing Récupération';
            targetPace = paces.easy;
            targetHRZone = 'Zone 1-2';
            expectedTSS = 40;
            description = `${Math.round(distance)}km très facile. Récupération active.`;
    }
    
    return {
        dayNumber: day,
        type,
        distance: Math.round(distance * 10) / 10,
        time,
        intensity,
        title,
        description,
        targetPace,
        targetHRZone,
        expectedTSS,
        targetPower,
        steps,
        riegelExponent: riegelExponent || 1.06,
    };
}

function calculateHRZones(vdot) {
    // Estimation FCM basée sur VDOT (approximation)
    const estimatedFCM = Math.round(205 - (vdot / 2));
    return {
        z1: `${Math.round(estimatedFCM * 0.5)}-${Math.round(estimatedFCM * 0.6)}`,
        z2: `${Math.round(estimatedFCM * 0.6)}-${Math.round(estimatedFCM * 0.7)}`,
        z3: `${Math.round(estimatedFCM * 0.7)}-${Math.round(estimatedFCM * 0.8)}`,
        z4: `${Math.round(estimatedFCM * 0.8)}-${Math.round(estimatedFCM * 0.9)}`,
        z5: `${Math.round(estimatedFCM * 0.9)}+`
    };
}

function calculatePaces(vdot) {
    if (!vdot || vdot < 20) {
        return { 
            easy: '6:00', 
            marathon: '5:30', 
            interval: '4:00', 
            threshold: '4:30',
            race: '5:00',
            easyMs: 1000 / 360,
            marathonMs: 1000 / 330,
            intervalMs: 1000 / 240,
            thresholdMs: 1000 / 270
        };
    }
    
    const v = vdot;
    // Formule Jack Daniels avec coefficients précis
    const easyV = v * 0.65;      // ~59-74% VO2max
    const marathonV = v * 0.84;   // Marathon pace
    const thresholdV = v * 0.88;  // Seuil lactique
    const intervalV = v * 0.98;   // VO2max / 5K pace
    const raceV = v * 0.95;       // 10K pace
    
    const easyMs = (easyV * 1000) / 3600;
    const marathonMs = (marathonV * 1000) / 3600;
    const thresholdMs = (thresholdV * 1000) / 3600;
    const intervalMs = (intervalV * 1000) / 3600;
    const raceMs = (raceV * 1000) / 3600;
    
    return {
        easy: formatPace(1000 / easyMs),
        marathon: formatPace(1000 / marathonMs),
        threshold: formatPace(1000 / thresholdMs),
        interval: formatPace(1000 / intervalMs),
        race: formatPace(1000 / raceMs),
        // M/s pour calculs précis
        easyMs,
        marathonMs,
        thresholdMs,
        intervalMs,
        raceMs
    };
}

function formatPace(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Crée un plan d'entraînement avec personnalisation avancée
 */
async function createTrainingPlan(userId, planData) {
    const {
        targetDistance = 0,
        weeks = 8,
        sessionsPerWeek = 4,
        trainingDays = [2, 4, 6, 0],
        hasVMA = false,
        vmaValue = null,
        vdotValue = null,
        experienceLevel = 'intermediate',
        currentWeeklyKm = 20,
        goals = 'health',
        questionnaire = {},
        usePPG = false,
        startDate = new Date().toISOString().split('T')[0],
        preferredTerrain = 'road',
        timeOfDay = 'morning'
    } = planData;
    
    // Récupérer l'historique utilisateur pour personnalisation
    const userDb = await getUserDb(userId);
    const userHistory = await getUserTrainingHistory(userDb, userId);
    
    // Calculer le VDOT avec précision
    let vdot = vdotValue;
    if (!vdot && vmaValue) {
        vdot = estimateVDOTFromVMA(vmaValue);
    } else if (!vdot) {
        vdot = calculateVDOTFromWeeklyKm(currentWeeklyKm, experienceLevel);
    }
    
    // Ajuster selon le niveau d'expérience
    const adjustedVDOT = adjustVDOTForExperience(vdot, experienceLevel);
    
    const planName = getPlanName(goals, targetDistance, weeks);
    const planType = usePPG ? 'polarized' : 'adaptive';
    
    // Calculer les métriques de plan
    const planMetrics = calculatePlanMetrics(weeks, sessionsPerWeek, currentWeeklyKm, targetDistance, goals);

    const result = await dbRunUser(userDb, `
        INSERT INTO training_plans (
            user_id, name, target_type, target_value, weeks, vdot, sessions_per_week, 
            plan_type, plan_data, start_date, estimated_finish_date, total_volume_km,
            total_time_hours, expected_tss_total, experience_level, preferred_terrain
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        userId,
        planName,
        goals,
        targetDistance,
        weeks,
        adjustedVDOT,
        sessionsPerWeek,
        planType,
        JSON.stringify({
            goal: goals,
            experience: experienceLevel,
            sessionsPerWeek,
            trainingDays,
            vdot: adjustedVDOT,
            currentWeeklyKm,
            questionnaire,
            usePPG,
            preferredTerrain,
            timeOfDay,
            hasVMA,
            vmaValue,
            planMetrics
        }),
        startDate,
        calculateEndDate(startDate, weeks),
        planMetrics.totalVolumeKm,
        planMetrics.totalTimeHours,
        planMetrics.totalTSS,
        experienceLevel,
        preferredTerrain
    ]);
    
    const planId = result.lastID;
    
    // Générer les sessions avec historique utilisateur
    const sessions = generateSessionsForPlan(
        planId,
        weeks,
        sessionsPerWeek,
        trainingDays,
        goals,
        adjustedVDOT,
        targetDistance,
        usePPG,
        userHistory
    );
    
    // Insérer les sessions avec métadonnées complètes
    for (const session of sessions) {
        await dbRunUser(userDb, `
            INSERT INTO training_sessions (
                plan_id, user_id, week_number, day_number, type, title, description,
                target_distance, target_time, intensity, target_pace, target_hr_zones,
                expected_tss, progression_factor, phase
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            session.plan_id,
            userId,
            session.week_number,
            session.day_number,
            session.type,
            session.title,
            session.description,
            session.distance_target || null,
            session.time_target || null,
            session.intensity,
            session.target_pace || null,
            session.target_hr_zone || null,
            session.expected_tss || null,
            session.progression_factor || 1.0,
            session.phase || 'base'
        ]);
    }
    
    // Récupérer les sessions créées
    const sessionsToReturn = await dbAllUser(userDb, `
        SELECT * FROM training_sessions 
        WHERE plan_id = ? 
        ORDER BY week_number, day_number
        LIMIT 20
    `, [planId]);
    
    return {
        planId,
        planName,
        planType,
        weeks,
        vdot: Math.round(adjustedVDOT * 10) / 10,
        sessionsPerWeek,
        totalVolumeKm: planMetrics.totalVolumeKm,
        totalTimeHours: planMetrics.totalTimeHours,
        totalTSS: planMetrics.totalTSS,
        expectedImprovement: planMetrics.expectedImprovement,
        sessions: sessionsToReturn,
        recommendations: generatePlanRecommendations(planMetrics, userHistory)
    };
}

async function getUserTrainingHistory(userDb, userId) {
    try {
        const activities = await dbAllUser(userDb, `
            SELECT * FROM activities 
            WHERE user_id = ? 
            ORDER BY start_date DESC 
            LIMIT 50
        `, [userId]);
        
        const bestVdot = await dbGetUser(userDb, `
            SELECT MAX(metric_value) as best_vdot 
            FROM performance_metrics 
            WHERE user_id = ? AND metric_type = 'vdot'
        `, [userId]);
        
        return {
            activities: activities || [],
            best_vdot: bestVdot?.best_vdot || null,
            last_test: activities.length > 0 ? activities[0].start_date : null
        };
    } catch (e) {
        return null;
    }
}

function estimateVDOTFromVMA(vma) {
    // VMA = (VDOT - 2.209) / 3.5  =>  VDOT = VMA * 3.5 + 2.209
    // Ref: Mercier et al. (1987)
    return Math.round((vma * 3.5 + 2.209) * 10) / 10;
}

function adjustVDOTForExperience(vdot, experience) {
    const multipliers = {
        beginner: 0.9,      // -10% pour progression prudente
        intermediate: 1.0,  // Valeur réelle
        advanced: 1.05,     // +5% pour stimulus plus fort
        elite: 1.1          // +10%
    };
    return vdot * (multipliers[experience] || 1.0);
}

function calculatePlanMetrics(weeks, sessionsPerWeek, currentWeeklyKm, targetDistance, goal) {
    const avgSessionKm = currentWeeklyKm / Math.max(1, sessionsPerWeek);
    let totalVolumeKm = 0;
    let totalTimeHours = 0;
    let totalTSS = 0;
    
    for (let week = 1; week <= weeks; week++) {
        const phase = getPhaseForWeek(week, weeks);
        const multiplier = getVolumeMultiplier(phase, week, weeks);
        const weekKm = currentWeeklyKm * multiplier;
        totalVolumeKm += weekKm;
        totalTimeHours += weekKm / 10; // ~10km/h moyen
        totalTSS += weekKm * 8; // ~8 TSS/km
    }
    
    // Prédiction d'amélioration VDOT
    const goalMultiplier = {
        health: 1,
        weight_loss: 2,
        '5k': 3,
        '10k': 4,
        half: 5,
        marathon: 6,
        ultra: 8,
        improvement: 4
    };
    const expectedImprovement = (weeks / 4) * (goalMultiplier[goal] || 3);
    
    return {
        totalVolumeKm: Math.round(totalVolumeKm),
        totalTimeHours: Math.round(totalTimeHours * 10) / 10,
        totalTSS: Math.round(totalTSS),
        avgWeeklyVolume: Math.round(totalVolumeKm / weeks),
        expectedImprovement: Math.round(expectedImprovement * 10) / 10,
        sessionsCount: weeks * sessionsPerWeek
    };
}

function calculateEndDate(startDate, weeks) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (weeks * 7));
    return start.toISOString().split('T')[0];
}

function generatePlanRecommendations(metrics, history) {
    const recs = [];

    if (metrics.totalVolumeKm > (history?.avgWeeklyKm || 30) * 12) {
        recs.push('Le volume total est ambitieux. Écoutez votre corps et ajustez si nécessaire.');
    }

    if (metrics.expectedImprovement > 8) {
        recs.push('Amélioration VDOT prévue significative. Considérez un test de VMA à mi-parcours.');
    }

    // Check training monotony
    if (history?.trainingMonotony && history.trainingMonotony > 2.0) {
        recs.push(`Monotonie d'entraînement élevée (${history.trainingMonotony}). Variez les séances pour réduire le risque de surentraînement.`);
    }

    // Check polarization
    if (history?.polarizationIndex) {
        const pol = Polarization.getOptimalDistribution?.(history.fitnessLevel || 'intermediate', 'improvement');
        if (pol) {
            recs.push(`Distribution optimale: ${Math.round(pol.low * 100)}% facile, ${Math.round(pol.moderate * 100)}% modéré, ${Math.round(pol.high * 100)}% intense.`);
        }
    }

    // Check junk miles
    if (history?.polarizationIndex) {
        const junk = Polarization.calculateJunkMiles?.(history.polarizationIndex);
        if (junk && junk.percentage > 20) {
            recs.push(`${Math.round(junk.percentage)}% de "junk miles" détecté. Réduisez le temps en zone grise (Zone 3).`);
        }
    }

    recs.push('Respectez les jours de repos pour optimiser l\'adaptation.');
    recs.push('Hydratation et nutrition clés pour les sorties > 90min.');

    // Use Recommendations module for additional insights
    if (history?.activities?.length > 0) {
        const analysis = Recommendations.analyzeTrainingHistory?.(history.activities);
        if (analysis?.recommendations) {
            recs.push(...analysis.recommendations.slice(0, 3));
        }
    }

    return recs;
}

function calculateVDOTFromWeeklyKm(weeklyKm, experienceLevel = 'intermediate') {
    if (!weeklyKm || weeklyKm < 5) return 20;
    
    // Formule basée sur les corrélations volume-performance
    // avec ajustement selon le niveau
    const baseEstimates = [
        { km: 5, vdot: 25 },
        { km: 10, vdot: 30 },
        { km: 20, vdot: 35 },
        { km: 30, vdot: 40 },
        { km: 40, vdot: 44 },
        { km: 50, vdot: 47 },
        { km: 60, vdot: 50 },
        { km: 80, vdot: 54 },
        { km: 100, vdot: 57 },
        { km: 120, vdot: 60 },
        { km: 150, vdot: 63 }
    ];
    
    // Interpolation linéaire
    for (let i = 0; i < baseEstimates.length - 1; i++) {
        const curr = baseEstimates[i];
        const next = baseEstimates[i + 1];
        if (weeklyKm >= curr.km && weeklyKm <= next.km) {
            const ratio = (weeklyKm - curr.km) / (next.km - curr.km);
            let vdot = curr.vdot + ratio * (next.vdot - curr.vdot);
            
            // Ajustement expérience
            const expMultipliers = {
                beginner: 0.95,
                intermediate: 1.0,
                advanced: 1.03,
                elite: 1.05
            };
            
            return Math.round(vdot * (expMultipliers[experienceLevel] || 1.0) * 10) / 10;
        }
    }
    
    return 65; // Maximum pour volumes très élevés
}

function getPlanName(goal, targetDistance, weeks) {
    const goalNames = {
        health: 'Forme et Santé',
        weight_loss: 'Perte de Poids',
        '5k': '5K Challenge',
        '10k': '10K Challenge',
        half: 'Semi-Marathon',
        marathon: 'Marathon',
        custom: 'Plan Personnalisé',
        improvement: 'Amélioration Performance'
    };
    
    const baseName = goalNames[goal] || 'Plan Entraînement';
    return `${baseName} - ${weeks} semaines`;
}

async function getActivePlan(userId) {
    const userDb = await getUserDb(userId);

    const plan = await dbGetUser(userDb, `
        SELECT * FROM training_plans 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    
    if (!plan) return null;
    
    const sessions = await dbAllUser(userDb, `
        SELECT * FROM training_sessions 
        WHERE plan_id = ? AND completed = 0
        ORDER BY week_number, session_number
    `, [plan.id]);
    
    return {
        plan,
        sessions,
        planId: plan.id
    };
}

async function getPlanSessions(userId, planId, includeCompleted = false) {
    const userDb = await getUserDb(userId);

    const query = includeCompleted
        ? 'SELECT * FROM training_sessions WHERE plan_id = ? ORDER BY week_number, session_number'
        : 'SELECT * FROM training_sessions WHERE plan_id = ? AND completed = 0 ORDER BY week_number, session_number';
    
    return await dbAllUser(userDb, query, [planId]);
}

async function markSessionCompleted(userId, sessionId, feedback = {}) {
    const { actualDistance, actualDuration, actualAvgHR, actualMaxHR, rpe, notes } = feedback;
    const userDb = await getUserDb(userId);
    
    await dbRunUser(userDb, `
        UPDATE training_sessions SET
            completed = 1,
            completion_date = datetime('now'),
            actual_distance = ?,
            actual_time = ?,
            actual_avg_hr = ?,
            actual_max_hr = ?,
            actual_notes = ?
        WHERE id = ? AND user_id = ?
    `, [
        actualDistance || null,
        actualDuration || null,
        actualAvgHR || null,
        actualMaxHR || null,
        notes || null,
        sessionId,
        userId
    ]);
    
    return { success: true };
}

async function getTodaySessions(userId) {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const userDb = await getUserDb(userId);
    
    return await dbAllUser(userDb, `
        SELECT ts.*, tp.name as plan_name
        FROM training_sessions ts
        JOIN training_plans tp ON ts.plan_id = tp.id
        WHERE tp.user_id = ? AND tp.is_active = 1 
        AND ts.completed = 0
        AND ts.day_number = ?
        ORDER BY ts.week_number, ts.session_number
    `, [userId, dayOfWeek]);
}

async function getUpcomingSessions(userId, daysAhead = 7) {
    const userDb = await getUserDb(userId);

    return await dbAllUser(userDb, `
        SELECT ts.*, tp.name as plan_name
        FROM training_sessions ts
        JOIN training_plans tp ON ts.plan_id = tp.id
        WHERE tp.user_id = ? AND tp.is_active = 1 
        AND ts.completed = 0
        ORDER BY ts.week_number, ts.session_number
        LIMIT ?
    `, [userId, daysAhead]);
}

async function getCoachProfile(userId) {
    const user = await dbGetMain('SELECT id, email, name FROM users WHERE id = ?', [userId]);
    const userDb = await getUserDb(userId);
    const profile = await dbGetUser(userDb, 'SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const plan = await getActivePlan(userId);
    
    return {
        user,
        profile,
        activePlan: plan,
        hasActivePlan: !!plan
    };
}

// ============================================================================
// NEW FUNCTIONS — Plan details, progress, gamification, etc.
// ============================================================================

/**
 * Get a specific plan by ID with ownership check.
 * Returns null if not found or not owned by userId.
 */
async function getPlanById(userId, planId) {
    const userDb = await getUserDb(userId);
    const plan = await dbGetUser(userDb,
        'SELECT * FROM training_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
    );
    if (!plan) return null;

    const sessions = await dbAllUser(userDb,
        'SELECT * FROM training_sessions WHERE plan_id = ? ORDER BY week_number, session_number',
        [planId]
    );

    // Group sessions by week to build TrainingPlanCard structure
    const weeksMap = {};
    for (const s of sessions) {
        const wk = s.week_number || 1;
        if (!weeksMap[wk]) {
            weeksMap[wk] = { week: wk, phase: s.phase || 'Foundation', sessions: [] };
        }
        weeksMap[wk].sessions.push({
            id: String(s.id),
            day: s.day_number || 1,
            type: s.type || 'E',
            title: s.title || s.type || 'Séance',
            description: s.description || '',
            completed: !!s.completed,
            steps: s.steps ? (typeof s.steps === 'string' ? JSON.parse(s.steps) : s.steps) : [],
        });
    }

    const weeks = Object.values(weeksMap).sort((a, b) => a.week - b.week);
    const totalWeeks = plan.weeks || weeks.length || 1;
    const completedSessions = sessions.filter(s => s.completed).length;
    const currentWeek = Math.max(1, Math.min(
        Math.ceil((completedSessions / Math.max(sessions.length, 1)) * totalWeeks) || 1,
        totalWeeks
    ));

    return {
        id: String(plan.id),
        name: plan.name || 'Plan d\'entraînement',
        target: plan.goal || plan.target_distance ? `${Math.round((plan.target_distance || 0) / 1000)} km` : 'Objectif',
        durationWeeks: totalWeeks,
        currentWeek,
        startDate: plan.start_date || new Date().toISOString(),
        endDate: plan.end_date || new Date().toISOString(),
        weeks,
    };
}

/**
 * Compute plan progress metrics from sessions.
 */
async function getPlanProgress(userId, planId) {
    const userDb = await getUserDb(userId);
    const plan = await dbGetUser(userDb,
        'SELECT * FROM training_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
    );
    if (!plan) return null;

    const sessions = await dbAllUser(userDb,
        'SELECT * FROM training_sessions WHERE plan_id = ? AND user_id = ?',
        [planId, userId]
    );

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed || s.status === 'completed').length;
    const missedSessions = sessions.filter(s => s.status === 'missed').length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Compute streaks
    const sortedCompleted = sessions
        .filter(s => s.completed || s.status === 'completed')
        .sort((a, b) => (a.week_number - b.week_number) || (a.session_number - b.session_number));

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    for (const s of sortedCompleted) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
    }
    currentStreak = streak;

    // Weekly volume (km per week)
    const weeklyMap = {};
    for (const s of sessions) {
        const wk = s.week_number || 1;
        if (!weeklyMap[wk]) weeklyMap[wk] = 0;
        if (s.completed || s.status === 'completed') {
            weeklyMap[wk] += (s.actual_distance || s.target_distance || 0) / 1000;
        }
    }
    const weeklyVolume = Object.entries(weeklyMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([week, volume]) => ({ week: Number(week), volume: Math.round(volume * 10) / 10 }));

    // Intensity distribution
    const intensityCounts = { low: 0, moderate: 0, high: 0 };
    for (const s of sessions) {
        if (s.completed || s.status === 'completed') {
            const intensity = s.intensity || 'low';
            if (intensity === 'high' || intensity === 'very_high') intensityCounts.high++;
            else if (intensity === 'moderate') intensityCounts.moderate++;
            else intensityCounts.low++;
        }
    }
    const totalIntensity = completedSessions || 1;
    const intensityDistribution = {
        low: Math.round((intensityCounts.low / totalIntensity) * 100),
        moderate: Math.round((intensityCounts.moderate / totalIntensity) * 100),
        high: Math.round((intensityCounts.high / totalIntensity) * 100),
    };

    // Average RPE
    const rpeValues = sessions
        .filter(s => s.rpe != null)
        .map(s => s.rpe);
    const averageRpe = rpeValues.length > 0
        ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
        : 0;

    // Phase progress
    const phaseMap = {};
    for (const s of sessions) {
        const phase = s.phase || 'Foundation';
        if (!phaseMap[phase]) phaseMap[phase] = { total: 0, completed: 0 };
        phaseMap[phase].total++;
        if (s.completed || s.status === 'completed') phaseMap[phase].completed++;
    }
    const phaseProgress = Object.entries(phaseMap).map(([phase, { total, completed }]) => ({
        phase,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    }));

    return {
        planId,
        totalSessions,
        completedSessions,
        missedSessions,
        currentStreak,
        longestStreak,
        weeklyVolume,
        intensityDistribution,
        averageRpe: Math.round(averageRpe * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        phaseProgress,
    };
}

/**
 * Compute gamification data for a plan.
 */
async function getGamification(userId, planId) {
    const userDb = await getUserDb(userId);
    const plan = await dbGetUser(userDb,
        'SELECT * FROM training_plans WHERE id = ? AND user_id = ?',
        [planId, userId]
    );
    if (!plan) return null;

    const sessions = await dbAllUser(userDb,
        'SELECT * FROM training_sessions WHERE plan_id = ? AND user_id = ?',
        [planId, userId]
    );

    const completedSessions = sessions.filter(s => s.completed || s.status === 'completed');
    const totalKm = completedSessions.reduce((s, sess) => s + (sess.actual_distance || sess.target_distance || 0) / 1000, 0);
    const totalHours = completedSessions.reduce((s, sess) => s + (sess.actual_time || sess.target_duration || 0) / 3600, 0);

    // Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    for (const s of completedSessions) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
    }
    currentStreak = streak;

    // XP and level
    const xp = completedSessions.length * 100 + Math.round(totalKm * 10);
    const xpToNext = 1000;
    const level = Math.floor(xp / xpToNext) + 1;
    const levelTitles = ['Débutant', 'Coureur', 'Athlète', 'Champion', 'Élite'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    // Badges
    const badges = [];
    if (completedSessions.length >= 1) badges.push({ id: 'first_session', name: 'Première séance', description: 'Complétez votre première séance', icon: 'star', earnedAt: completedSessions[0]?.completion_date || new Date().toISOString() });
    if (completedSessions.length >= 5) badges.push({ id: 'five_sessions', name: '5 séances', description: 'Complétez 5 séances', icon: 'flame', earnedAt: completedSessions[4]?.completion_date || new Date().toISOString() });
    if (totalKm >= 50) badges.push({ id: 'fifty_km', name: '50 km', description: 'Courez 50 km au total', icon: 'trophy', earnedAt: new Date().toISOString() });
    if (completedSessions.length >= 10) badges.push({ id: 'ten_sessions', name: '10 séances', description: 'Complétez 10 séances', icon: 'medal', earnedAt: completedSessions[9]?.completion_date || new Date().toISOString() });

    // Achievements
    const achievements = [
        { id: 'sessions_10', name: '10 séances', progress: Math.min(completedSessions.length, 10), target: 10, unlocked: completedSessions.length >= 10 },
        { id: 'km_100', name: '100 km', progress: Math.min(Math.round(totalKm), 100), target: 100, unlocked: totalKm >= 100 },
        { id: 'streak_7', name: 'Série de 7', progress: Math.min(currentStreak, 7), target: 7, unlocked: currentStreak >= 7 },
    ];

    return {
        planId,
        badges,
        streaks: {
            current: currentStreak,
            longest: longestStreak,
            lastActiveDate: completedSessions.length > 0
                ? (completedSessions[completedSessions.length - 1].completion_date || new Date().toISOString())
                : new Date().toISOString(),
        },
        achievements,
        level: {
            current: level,
            xp: xp % xpToNext,
            xpToNext,
            title: levelTitle,
        },
        stats: {
            totalKm: Math.round(totalKm * 10) / 10,
            totalHours: Math.round(totalHours * 10) / 10,
            totalSessions: completedSessions.length,
        },
    };
}

/**
 * Mark a session as missed.
 */
async function markSessionMissed(userId, { sessionId }) {
    const userDb = await getUserDb(userId);
    await dbRunUser(userDb,
        "UPDATE training_sessions SET status = 'missed' WHERE id = ? AND user_id = ?",
        [sessionId, userId]
    );
    return { success: true };
}

/**
 * Schedule a VMA/VDOT test.
 */
async function scheduleTest(userId, { testType = 'vma', scheduledDate }) {
    const userDb = await getUserDb(userId);
    const testProtocols = {
        vma: {
            name: 'Test VMA 6 minutes',
            description: 'Courez la plus grande distance possible en 6 minutes.',
            steps: ['Échauffement 10 min', 'Course maximale 6 min', 'Récupération 10 min'],
        },
        vdot: {
            name: 'Test VDOT 5 km',
            description: 'Courez 5 km à votre meilleure allure.',
            steps: ['Échauffement 10 min', 'Course 5 km effort maximal', 'Récupération 10 min'],
        },
        cooper: {
            name: 'Test de Cooper 12 minutes',
            description: 'Courez la plus grande distance possible en 12 minutes.',
            steps: ['Échauffement 10 min', 'Course maximale 12 min', 'Récupération 10 min'],
        },
    };

    const protocol = testProtocols[testType] || testProtocols.vma;
    const date = scheduledDate || new Date().toISOString().split('T')[0];

    const result = await dbRunUser(userDb, `
        INSERT INTO training_sessions (user_id, plan_id, type, title, description, day_number, week_number, scheduled_date, status)
        VALUES (?, NULL, 'TEST', ?, ?, 1, 0, ?, 'scheduled')
    `, [userId, protocol.name, protocol.description, date]);

    return {
        success: true,
        testId: result.lastID || 0,
        message: `Test ${protocol.name} planifié pour le ${date}`,
        testProtocol: protocol,
    };
}

/**
 * Submit test results and update VDOT.
 */
async function submitTestResults(userId, { testType = 'vma', distance, time, heartRate }) {
    const userDb = await getUserDb(userId);

    let newVdot = null;
    let newVma = null;

    if (distance && time && time > 0) {
        const speedMs = distance / time;
        const speedKmh = speedMs * 3.6;

        if (testType === 'vma' || testType === 'cooper') {
            // VMA ≈ distance (m) / time (s) * 3.6 * correction factor
            newVma = Math.round(speedKmh * 10) / 10;
            newVdot = Math.round(estimateVDOTFromVMA(newVma) * 10) / 10;
        } else if (testType === 'vdot') {
            // VDOT from 5km time
            const timeMins = time / 60;
            if (timeMins > 0) {
                newVdot = Math.round((29.54 + 5.000663 * (distance / 1000) - 1.455 * timeMins) * 10) / 10;
                newVma = Math.round(newVdot * 0.18 * 10) / 10;
            }
        }
    }

    const previous = await dbGetUser(userDb, 'SELECT vdot, vma FROM user_profiles WHERE user_id = ?', [userId]);

    if (newVdot) {
        await dbRunUser(userDb, `
            INSERT INTO user_profiles (user_id, vdot, vma, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET vdot = excluded.vdot, vma = excluded.vma, updated_at = excluded.updated_at
        `, [userId, newVdot, newVma]);
    }

    const paces = newVdot ? calculatePaces(newVdot) : {};

    return {
        success: true,
        message: newVdot ? `VDOT mis à jour : ${newVdot}` : 'Résultats enregistrés',
        newVma,
        newVdot,
        updatedPaces: paces,
        progress: {
            previous: previous || {},
            current: { vdot: newVdot, vma: newVma },
            improvement: previous?.vdot && newVdot
                ? `+${Math.round((newVdot - previous.vdot) * 10) / 10} VDOT`
                : 'Première mesure',
        },
    };
}

/**
 * Add an external event (race, travel, illness, etc.) that may affect the plan.
 */
async function addExternalEvent(userId, { eventType = 'other', date, description = '', impact = 'low' }) {
    const userDb = await getUserDb(userId);

    // Find sessions in the event window (±3 days)
    const eventDate = new Date(date || new Date());
    const windowStart = new Date(eventDate);
    windowStart.setDate(windowStart.getDate() - 3);
    const windowEnd = new Date(eventDate);
    windowEnd.setDate(windowEnd.getDate() + 3);

    const affectedSessions = await dbAllUser(userDb, `
        SELECT id FROM training_sessions
        WHERE user_id = ? AND scheduled_date BETWEEN ? AND ? AND completed = 0
    `, [userId, windowStart.toISOString().split('T')[0], windowEnd.toISOString().split('T')[0]]);

    const planAdjustments = [];
    if (impact === 'high' && affectedSessions.length > 0) {
        planAdjustments.push(`${affectedSessions.length} séance(s) dans la fenêtre de l'événement`);
        planAdjustments.push('Réduction de l\'intensité recommandée');
    }

    return {
        success: true,
        message: `Événement "${eventType}" enregistré pour le ${date || 'aujourd\'hui'}`,
        affectedSessions: affectedSessions.map(s => s.id),
        planAdjustments,
    };
}

/**
 * Associate an activity with a training session.
 */
async function matchActivityToSession(userId, { activityId, sessionId }) {
    const userDb = await getUserDb(userId);

    await dbRunUser(userDb, `
        UPDATE training_sessions
        SET completed = 1, activity_id = ?, completion_date = datetime('now'), status = 'completed'
        WHERE id = ? AND user_id = ?
    `, [activityId, sessionId, userId]);

    const session = await dbGetUser(userDb,
        'SELECT * FROM training_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
    );

    return {
        success: true,
        message: 'Activité associée à la séance',
        integrated: true,
        session: session ? {
            id: session.id,
            title: session.title || session.type,
            type: session.type,
            week: session.week_number,
            day: session.day_number,
        } : null,
        estimatedRpe: session?.rpe || null,
    };
}

/**
 * Get pending (incomplete) sessions from the active plan.
 */
async function getPendingSessions(userId) {
    const activePlanData = await getActivePlan(userId);
    if (!activePlanData || !activePlanData.plan) {
        return { plan: null, sessions: [], recentActivities: [] };
    }

    const userDb = await getUserDb(userId);
    const plan = activePlanData.plan;

    const sessions = await dbAllUser(userDb, `
        SELECT * FROM training_sessions
        WHERE plan_id = ? AND user_id = ? AND (completed = 0 OR completed IS NULL) AND status != 'completed'
        ORDER BY week_number, session_number
    `, [plan.id, userId]);

    return {
        plan: {
            id: plan.id,
            name: plan.name,
            target_distance: plan.target_distance,
            weeks: plan.weeks,
        },
        sessions: sessions.map(s => ({
            id: s.id,
            planId: s.plan_id,
            weekNumber: s.week_number,
            dayNumber: s.day_number,
            title: s.title || s.type,
            type: s.type,
            scheduledDate: s.scheduled_date || null,
        })),
        recentActivities: [],
    };
}

/**
 * Adjust upcoming sessions based on completed session feedback and current PMC state.
 */
async function adaptPlanBasedOnFeedback(userId, planId, sessionId, feedback) {
    const userDb = await getUserDb(userId);

    // Get current session
    const session = await dbGetUser(userDb,
        'SELECT * FROM training_sessions WHERE id = ? AND plan_id = ?',
        [sessionId, planId]
    );
    if (!session) return { success: false, error: 'Session not found' };

    // Mark session completed
    await markSessionCompleted(userId, sessionId, feedback);

    // Get recent PMC state
    const recentActivities = await dbAllUser(userDb, `
        SELECT tss, start_date FROM activities
        WHERE date(start_date) >= date('now', '-42 days')
        ORDER BY start_date
    `);

    let adaptation = { adjustedSessions: 0, reason: 'none' };

    if (recentActivities[0]?.values?.length > 0) {
        const dailyTSS = {};
        for (const row of recentActivities[0].values) {
            const date = row[1]?.split('T')[0] || row[1];
            dailyTSS[date] = (dailyTSS[date] || 0) + (row[0] || 0);
        }

        const pmcData = Object.keys(dailyTSS).sort().map(date => ({
            date,
            tss: dailyTSS[date],
        }));

        const pmcResult = PMC.calculate(pmcData);
        const lastPmc = pmcResult[pmcResult.length - 1];
        const tsb = lastPmc.ctl - lastPmc.atl;
        const acwr = lastPmc.atl > 0 ? lastPmc.ctl / lastPmc.atl : 1;

        // If TSB very negative or ACWR high, reduce upcoming session intensity
        if (tsb < -20 || acwr > 1.5) {
            const upcomingSessions = await dbAllUser(userDb, `
                SELECT * FROM training_sessions
                WHERE plan_id = ? AND completed = 0 AND week_number >= ?
                ORDER BY week_number, session_number
                LIMIT 3
            `, [planId, session.week_number]);

            for (const upcoming of upcomingSessions) {
                let newIntensity = upcoming.intensity;
                let newDescription = upcoming.description;

                if (upcoming.intensity === 'high' || upcoming.intensity === 'very_high') {
                    newIntensity = 'moderate';
                    newDescription = `[ADAPTÉ] ${upcoming.description}\n⚠️ Intensité réduite due à la fatigue accumulée (TSB: ${Math.round(tsb)}).`;
                    await dbRunUser(userDb, `
                        UPDATE training_sessions SET intensity = ?, description = ?, adapted = 1
                        WHERE id = ?
                    `, [newIntensity, newDescription, upcoming.id]);
                    adaptation.adjustedSessions++;
                    adaptation.reason = 'fatigue';
                }
            }
        }

        // If RPE was very high, add recovery day
        if (feedback.rpe && feedback.rpe > 8) {
            const nextSession = await dbGetUser(userDb, `
                SELECT * FROM training_sessions
                WHERE plan_id = ? AND completed = 0 AND (week_number > ? OR (week_number = ? AND session_number > ?))
                ORDER BY week_number, session_number LIMIT 1
            `, [planId, session.week_number, session.week_number, session.session_number]);

            if (nextSession && nextSession.intensity !== 'rest') {
                await dbRunUser(userDb, `
                    UPDATE training_sessions SET type = 'R', intensity = 'rest', title = 'Récupération (adapté)',
                    description = 'Jour de repos ajouté suite à un effort perçu élevé (RPE: ' || ? || ').',
                    adapted = 1
                    WHERE id = ?
                `, [feedback.rpe, nextSession.id]);
                adaptation.adjustedSessions++;
                adaptation.reason = adaptation.reason === 'none' ? 'high_rpe' : adaptation.reason + ',high_rpe';
            }
        }
    }

    return { success: true, adaptation };
}

/**
 * Get weekly plan summary with PMC integration.
 */
async function getWeeklyPlanSummary(userId, weekNumber) {
    const userDb = await getUserDb(userId);

    const sessions = await dbAllUser(userDb, `
        SELECT * FROM training_sessions
        WHERE week_number = ? AND user_id = ?
        ORDER BY day_number
    `, [weekNumber, userId]);

    const totalTSS = sessions.reduce((sum, s) => sum + (s.expected_tss || 0), 0);
    const totalDistance = sessions.reduce((sum, s) => sum + (s.distance_target || 0), 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.time_target || 0), 0);

    const intensityCounts = { low: 0, moderate: 0, high: 0 };
    for (const s of sessions) {
        if (s.intensity === 'high' || s.intensity === 'very_high') intensityCounts.high++;
        else if (s.intensity === 'moderate') intensityCounts.moderate++;
        else intensityCounts.low++;
    }

    return {
        weekNumber,
        sessionCount: sessions.length,
        totalTSS,
        totalDistance: Math.round(totalDistance / 1000 * 10) / 10,
        totalTimeHours: Math.round(totalTime / 3600 * 10) / 10,
        intensityDistribution: intensityCounts,
        sessions: sessions.map(s => ({
            id: s.id,
            day: s.day_number,
            type: s.type,
            title: s.title,
            intensity: s.intensity,
            completed: !!s.completed,
        })),
    };
}

module.exports = {
    createTrainingPlan,
    getActivePlan,
    getPlanSessions,
    markSessionCompleted,
    getTodaySessions,
    getUpcomingSessions,
    getCoachProfile,
    getPlanById,
    getPlanProgress,
    getGamification,
    markSessionMissed,
    scheduleTest,
    submitTestResults,
    addExternalEvent,
    matchActivityToSession,
    getPendingSessions,
    adaptPlanBasedOnFeedback,
    getWeeklyPlanSummary,
    SESSION_TYPES
};