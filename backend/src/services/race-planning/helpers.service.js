'use strict';

const { MathUtils } = require('../../algorithms/index');

function analyzeGpxProfile(points) {
    if (!points || points.length < 2) return null;
    let elevGain = 0;
    let elevLoss = 0;
    let minEle = points[0].ele;
    let maxEle = points[0].ele;
    const totalDist = points[points.length - 1].dist;
    for (let i = 1; i < points.length; i++) {
        const dEle = points[i].ele - points[i - 1].ele;
        if (dEle > 0) elevGain += dEle;
        else elevLoss += Math.abs(dEle);
        if (points[i].ele < minEle) minEle = points[i].ele;
        if (points[i].ele > maxEle) maxEle = points[i].ele;
    }
    const distKm = totalDist / 1000;
    const gainPerKm = distKm > 0 ? elevGain / distKm : 0;
    let terrainType;
    if (gainPerKm < 10) terrainType = 'flat';
    else if (gainPerKm < 30) terrainType = 'rolling';
    else terrainType = 'mountainous';
    const kmSegments = [];
    let _segStart = 0;
    let segStartDist = 0;
    let segElevStart = points[0].ele;
    let kmNum = 1;
    for (let i = 1; i < points.length; i++) {
        const distFromSegStart = points[i].dist - segStartDist;
        if (distFromSegStart >= 1000 || i === points.length - 1) {
            const segDist = points[i].dist - segStartDist;
            const segElevChange = points[i].ele - segElevStart;
            const grade = segDist > 0 ? (segElevChange / segDist) * 100 : 0;
            kmSegments.push({
                km: kmNum++,
                distance: Math.round(segDist),
                elevChange: Math.round(segElevChange),
                grade: Math.round(grade * 10) / 10,
                avgEle: Math.round((points[i].ele + segElevStart) / 2),
            });
            segStartDist = points[i].dist;
            segElevStart = points[i].ele;
        }
    }
    return {
        elevGain: Math.round(elevGain),
        elevLoss: Math.round(elevLoss),
        elevMin: Math.round(minEle),
        elevMax: Math.round(maxEle),
        gainPerKm: Math.round(gainPerKm * 10) / 10,
        terrainType,
        kmSegments,
        totalDistM: Math.round(totalDist),
    };
}

function getPacingStrategy(distance, gpxKmSegments = null) {
    const hasClimbs = gpxKmSegments && gpxKmSegments.some(s => s.grade > 3);
    if (distance <= 5) {
        return {
            type: 'even', name: 'Allure régulière', description: 'Sur 5K, maintenez une allure constante du début à la fin.',
            phases: [
                { start: 0.00, end: 0.15, factor: 1.00, label: 'Mise en route' },
                { start: 0.15, end: 0.85, factor: 1.00, label: 'Allure cible' },
                { start: 0.85, end: 1.00, factor: 0.97, label: 'Final' },
            ],
            startFactor: 1.00, midFactor: 1.00, endFactor: 0.97,
        };
    } else if (distance <= 10) {
        return {
            type: 'slight-negative', name: 'Negative split léger',
            description: hasClimbs ? 'Gérez les montées sans forcer, relancez dans les descentes.' : 'Premier km +2%, milieu stable, dernier km à fond.',
            phases: [
                { start: 0.00, end: 0.10, factor: 1.02, label: 'Départ contenu' },
                { start: 0.10, end: 0.80, factor: 1.00, label: 'Allure cible' },
                { start: 0.80, end: 0.95, factor: 0.99, label: 'Accélération progressive' },
                { start: 0.95, end: 1.00, factor: 0.96, label: 'Sprint final' },
            ],
            startFactor: 1.02, midFactor: 1.00, endFactor: 0.96,
        };
    } else if (distance <= 21.0975) {
        return {
            type: 'negative-split', name: 'Negative split progressif',
            description: 'Départ conservateur (+3%), allure cible au milieu, accélération sur dernier 5K.',
            phases: [
                { start: 0.00, end: 0.10, factor: 1.03, label: 'Départ très contenu' },
                { start: 0.10, end: 0.75, factor: 1.00, label: 'Allure cible' },
                { start: 0.75, end: 0.90, factor: 0.99, label: 'Progression' },
                { start: 0.90, end: 1.00, factor: 0.97, label: 'Accélération finale' },
            ],
            startFactor: 1.03, midFactor: 1.00, endFactor: 0.97,
        };
    } else if (distance <= 42.195) {
        return {
            type: 'conservative-negative', name: 'Marathon — Gestion optimale',
            description: 'Départ très contrôlé (+4%), allure cible au 10K, gestion jusqu\'au 32K, relance si possible.',
            phases: [
                { start: 0.00, end: 0.08, factor: 1.04, label: 'Départ très contrôlé' },
                { start: 0.08, end: 0.20, factor: 1.02, label: 'Mise en jambes' },
                { start: 0.20, end: 0.75, factor: 1.00, label: 'Allure cible' },
                { start: 0.75, end: 0.88, factor: 1.01, label: 'Zone de gestion (risque de mur)' },
                { start: 0.88, end: 0.95, factor: 1.02, label: 'Dernière ligne droite' },
                { start: 0.95, end: 1.00, factor: 0.98, label: 'Final — tout donner' },
            ],
            startFactor: 1.04, midFactor: 1.01, endFactor: 0.98,
        };
    } else {
        return {
            type: 'ultra-conservative', name: 'Ultra — Gestion énergétique',
            description: 'Départ très lent (+8%), marche dans les montées, gestion stricte du glycogène, nutrition clé.',
            phases: [
                { start: 0.00, end: 0.10, factor: 1.08, label: 'Départ très lent' },
                { start: 0.10, end: 0.80, factor: 1.02, label: 'Allure de croisière' },
                { start: 0.80, end: 1.00, factor: 1.00, label: 'Gestion jusqu\'à la fin' },
            ],
            startFactor: 1.08, midFactor: 1.02, endFactor: 1.00,
        };
    }
}

function generateScientificSplits({ distance, basePace, elevationProfile, pacingStrategy, fcm, restingHR, totalRaceTime, weight, strategyBias = 0, gpxKmSegments = null, temperature = 15 }) {
    const splits = [];
    const numSplits = Math.ceil(distance);
    const totalMinutes = totalRaceTime / 60;
    const _biasStartFactor = pacingStrategy.startFactor + strategyBias * 0.04;
    const biasEndFactor = pacingStrategy.endFactor - strategyBias * 0.04;
    const _hrr = fcm - restingHR;
    const fitnessLevel = MathUtils.clamp((180 - fcm) / 30, 0.5, 1.5);
    for (let km = 1; km <= numSplits; km++) {
        const kmDistance = km === numSplits ? distance - (km - 1) : 1;
        const kmProgress = km / numSplits;
        let paceFactor;
        const { phases } = pacingStrategy;
        const activePhase = phases.find(p => kmProgress >= p.start && kmProgress < p.end);
        if (activePhase) {
            const phaseProgress = (kmProgress - activePhase.start) / (activePhase.end - activePhase.start);
            const nextPhase = phases[phases.indexOf(activePhase) + 1];
            if (nextPhase && phaseProgress > 0.85) {
                const transition = (phaseProgress - 0.85) / 0.15;
                paceFactor = activePhase.factor + (nextPhase.factor - activePhase.factor) * transition;
            } else {
                paceFactor = activePhase.factor;
            }
        } else {
            paceFactor = biasEndFactor;
        }
        if (kmProgress < 0.15) paceFactor = paceFactor + strategyBias * 0.04;
        else if (kmProgress > 0.85) paceFactor = paceFactor - strategyBias * 0.04;
        const heatFactor = temperature > 20 ? 1 + (temperature - 20) * 0.015 : 1;
        const cumulativeFatigue = Math.pow(kmProgress, 1.3);
        const driftPerMinute = 0.35 * cumulativeFatigue * heatFactor * (1.5 - fitnessLevel);
        const driftBpm = Math.round(kmProgress * totalMinutes * driftPerMinute);
        const driftCap = Math.round(Math.min(driftBpm, fcm * 0.08));
        let elevFactor = 1.0;
        let kmGrade = 0;
        let kmElevChange = 0;
        if (gpxKmSegments && gpxKmSegments[km - 1]) {
            const seg = gpxKmSegments[km - 1];
            kmGrade = seg.grade;
            kmElevChange = seg.elevChange;
            const g = MathUtils.clamp(kmGrade / 100, -0.45, 0.45);
            const costG = 155.4 * Math.pow(g, 5) - 30.4 * Math.pow(g, 4) - 43.3 * Math.pow(g, 3) + 46.3 * Math.pow(g, 2) + 19.5 * g + 3.6;
            elevFactor = costG / 3.6;
            elevFactor = MathUtils.clamp(elevFactor, 0.85, 1.40);
        } else if (elevationProfile.gainPerKm > 0) {
            const simulatedGain = Math.sin(km * 0.7) * elevationProfile.gainPerKm;
            const g = MathUtils.clamp((simulatedGain / 100) / 100, -0.10, 0.10);
            const costG = 155.4 * Math.pow(g, 5) - 30.4 * Math.pow(g, 4) - 43.3 * Math.pow(g, 3) + 46.3 * Math.pow(g, 2) + 19.5 * g + 3.6;
            elevFactor = costG / 3.6;
            elevFactor = MathUtils.clamp(elevFactor, 0.92, 1.20);
        }
        const splitPace = basePace * paceFactor * elevFactor;
        const splitTime = splitPace * kmDistance;
        const cumulativeTime = splits.reduce((acc, s) => acc + s.splitTime, 0) + splitTime;
        const hrPhase = getRaceHRPhase(kmProgress, distance);
        const hrMin = Math.round(fcm * hrPhase.minPct + restingHR * (1 - hrPhase.minPct) * 0.3);
        const hrMax = Math.round(fcm * hrPhase.maxPct + restingHR * (1 - hrPhase.maxPct) * 0.3);
        const nutrition = getSplitNutrition(km, cumulativeTime, totalRaceTime, distance, weight, gpxKmSegments, km);
        splits.push({
            km, distance: Math.round(kmDistance * 100) / 100,
            splitTime: Math.round(splitTime), cumulativeTime: Math.round(cumulativeTime),
            pace: Math.round(splitPace), paceFactor: Math.round(paceFactor * 1000) / 1000,
            hrZone: hrPhase.name, hrRange: `${hrMin + driftCap}-${hrMax + Math.min(driftCap, 12)} bpm`,
            cardiacDrift: driftCap, elevationFactor: Math.round(elevFactor * 100) / 100,
            grade: kmGrade, elevChange: kmElevChange, nutrition,
        });
    }
    return splits;
}

function getRaceHRPhase(progress, distance) {
    if (distance <= 5) {
        if (progress < 0.1) return { name: 'Zone 3 (Mise en route)', minPct: 0.75, maxPct: 0.82 };
        if (progress < 0.8) return { name: 'Zone 4 (Seuil)', minPct: 0.85, maxPct: 0.92 };
        return { name: 'Zone 5 (Effort maximal)', minPct: 0.92, maxPct: 0.98 };
    } else if (distance <= 21.0975) {
        if (progress < 0.1) return { name: 'Zone 2-3 (Progressif)', minPct: 0.70, maxPct: 0.78 };
        if (progress < 0.7) return { name: 'Zone 3-4 (Seuil)', minPct: 0.78, maxPct: 0.86 };
        if (progress < 0.9) return { name: 'Zone 4 (Soutenu)', minPct: 0.84, maxPct: 0.90 };
        return { name: 'Zone 4-5 (Final)', minPct: 0.88, maxPct: 0.95 };
    } else {
        if (progress < 0.1) return { name: 'Zone 2 (Contrôle)', minPct: 0.65, maxPct: 0.72 };
        if (progress < 0.5) return { name: 'Zone 2-3 (Aérobie)', minPct: 0.70, maxPct: 0.78 };
        if (progress < 0.8) return { name: 'Zone 3 (Seuil bas)', minPct: 0.75, maxPct: 0.82 };
        if (progress < 0.95) return { name: 'Zone 3-4 (Gestion)', minPct: 0.78, maxPct: 0.86 };
        return { name: 'Zone 4 (Final)', minPct: 0.84, maxPct: 0.92 };
    }
}

function getSplitNutrition(km, cumulativeTime, totalRaceTime, distance, weight, gpxKmSegments = null, kmIndex = 1) {
    const nutrition = [];
    const _hours = cumulativeTime / 3600;
    const minutes = cumulativeTime / 60;
    if (totalRaceTime < 3600) return nutrition;
    if (gpxKmSegments && gpxKmSegments[kmIndex - 1]) {
        const seg = gpxKmSegments[kmIndex - 1];
        const nextSeg = gpxKmSegments[kmIndex];
        if (seg.grade > 4 && (!nextSeg || nextSeg.grade < seg.grade - 2)) {
            nutrition.push({ type: 'water', label: 'Eau (après montée)', quantity: '200-250ml' });
        }
    }
    const waterInterval = 900;
    if (cumulativeTime > 0 && Math.floor(cumulativeTime / waterInterval) > Math.floor((cumulativeTime - waterInterval) / waterInterval)) {
        if (!nutrition.some(n => n.type === 'water')) {
            nutrition.push({ type: 'water', label: 'Eau', quantity: '150-200ml' });
        }
    }
    const gelInterval = 2700;
    if (cumulativeTime > 0 && cumulativeTime % gelInterval < 90 && cumulativeTime > 1800) {
        nutrition.push({ type: 'gel', label: 'Gel énergétique', quantity: '1 gel (25-30g glucides)' });
    }
    if (totalRaceTime > 7200 && minutes > 60 && Math.floor(minutes / 60) > Math.floor((minutes - 60) / 60)) {
        nutrition.push({ type: 'sodium', label: 'Électrolytes', quantity: '300-500mg sodium' });
    }
    if (totalRaceTime > 14400 && minutes > 90 && Math.floor(minutes / 120) > Math.floor((minutes - 120) / 120)) {
        nutrition.push({ type: 'solid', label: 'Aliment solide', quantity: 'Barre/banane (60-80g glucides)' });
    }
    return nutrition;
}

function calculateNutritionStrategy({ distance: _distance, totalRaceTime, weight, temperature, elevationProfile: _elevationProfile }) {
    const hours = totalRaceTime / 3600;
    const isLongRace = totalRaceTime > 3600;
    const isUltra = totalRaceTime > 14400;
    let carbPerHour;
    if (hours < 1) carbPerHour = 0;
    else if (hours < 2.5) carbPerHour = 30;
    else if (hours < 4) carbPerHour = 60;
    else carbPerHour = 90;
    if (temperature > 25) carbPerHour *= 0.9;
    else if (temperature > 30) carbPerHour *= 0.8;
    const baseFluidMlPerHour = 400 + (weight * 3);
    const tempAdjustment = temperature > 20 ? (temperature - 20) * 50 : 0;
    const fluidMlPerHour = baseFluidMlPerHour + tempAdjustment;
    const sodiumPerHour = isLongRace ? (temperature > 25 ? 700 : 500) : 300;
    const caffeineDose = Math.round(weight * 3);
    const preRaceMeal = {
        timing: '3-4h avant',
        carbs: `${Math.round(weight * 2)}g glucides`,
        description: 'Repas riche en glucides, faible en fibres et lipides. Ex: riz + poulet + compote.',
    };
    const preRaceTopUp = {
        timing: '15-30 min avant',
        carbs: '20-30g glucides',
        description: '1 gel + 200ml d\'eau ou boisson d\'effort. Caféine optionnelle (3mg/kg).',
    };
    const duringRace = [];
    if (isLongRace) {
        const gelFreq = hours < 2.5 ? '45' : '30';
        const gelPerHour = Math.ceil(carbPerHour / 25);
        duringRace.push({
            timing: `Toutes les ${gelFreq} minutes`,
            type: 'gel',
            amount: `${Math.round(carbPerHour)}g glucides/heure`,
            description: `${gelPerHour} gels/heure + eau. Alterner saveurs pour éviter l'écœurement. Gut training recommandé pour >60g/h.`,
        });
        duringRace.push({
            timing: 'Toutes les 15-20 min',
            type: 'fluid',
            amount: `${Math.round(fluidMlPerHour / 4)}ml`,
            description: 'Boire avant d\'avoir soif. En cas de chaleur >25°C, augmenter de 20%. En descente, en profiter pour boire.',
        });
        if (hours > 2) {
            duringRace.push({
                timing: 'Chaque heure',
                type: 'sodium',
                amount: `${sodiumPerHour}mg`,
                description: `Sodium via boissons ou comprimés. ${temperature > 25 ? 'Augmenter à 700-1000mg/h si grosse chaleur.' : 'Crucial si transpiration abondante.'}`,
            });
        }
        if (isUltra) {
            duringRace.push({
                timing: 'Toutes les 2h',
                type: 'solid',
                amount: '60-80g glucides',
                description: 'Banane, barre céréalière, sandwich. Mâcher bien, boire avec. Privilégier en plat ou descente.',
            });
        }
        duringRace.push({
            timing: 'Continu',
            type: 'strategy',
            amount: 'Plan nutritionnel',
            description: 'Notez ce que vous mangez/buvez. Adaptez selon votre ressenti. Un estomac vide après 2h = alerte.',
        });
    }
    const postRace = {
        within30min: {
            carbs: `${Math.round(weight * 1.2)}g glucides`,
            protein: `${Math.round(weight * 0.3)}g protéines`,
            description: 'Fenêtre anabolique: ratio 3:1 ou 4:1 glucides/protéines. Ex: shaker recovery + fruit.',
        },
        within2hours: {
            description: 'Repas complet: riz/pâtes + protéines maigres + légumes. Hydratation: 150% du poids perdu. Ajouter électrolytes.',
        },
    };
    const totalFluidMl = isLongRace ? Math.round(fluidMlPerHour * hours) : 0;
    const totalCarbsG = isLongRace ? Math.round(carbPerHour * hours) : 0;
    return {
        totalWater: totalFluidMl,
        totalGels: isLongRace ? Math.ceil(totalCarbsG / 25) : 0,
        carbPerHour: isLongRace ? carbPerHour : 0,
        fluidMlPerHour: isLongRace ? Math.round(fluidMlPerHour) : 0,
        sodiumPerHour: isLongRace ? sodiumPerHour : 0,
        totalCarbs: totalCarbsG,
        totalFluid: totalFluidMl,
        caffeineDose: isLongRace ? caffeineDose : 0,
        preRace: { meal: preRaceMeal, topUp: preRaceTopUp },
        duringRace: isLongRace ? duringRace : 'Pas de nutrition nécessaire pour les courses < 1h.',
        postRace,
        references: ['Jeukendrup (2020) Nutrition for endurance sports', 'ACSM Position Stand on Exercise and Fluid Replacement', 'Thomas et al. (2016) Position stand: Nutrition and athletic performance'],
    };
}

module.exports = {
    analyzeGpxProfile,
    getPacingStrategy,
    generateScientificSplits,
    getRaceHRPhase,
    getSplitNutrition,
    calculateNutritionStrategy,
};
