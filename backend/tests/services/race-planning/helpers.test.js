'use strict';

/**
 * ============================================================
 * RACE PLANNING HELPERS TESTS
 * ============================================================
 * Tests for analyzeGpxProfile, getPacingStrategy, generateScientificSplits,
 * getRaceHRPhase, getSplitNutrition, calculateNutritionStrategy
 */

const {
    analyzeGpxProfile,
    getPacingStrategy,
    generateScientificSplits,
    getRaceHRPhase,
    getSplitNutrition,
    calculateNutritionStrategy,
} = require('../../../src/services/race-planning/helpers.service');

describe('analyzeGpxProfile', () => {
    test('should return null for empty points', () => {
        expect(analyzeGpxProfile(null)).toBeNull();
        expect(analyzeGpxProfile([])).toBeNull();
        expect(analyzeGpxProfile([{ lat: 1, lon: 1, ele: 100, dist: 0 }])).toBeNull();
    });

    test('should analyze flat profile', () => {
        const points = [
            { lat: 48.85, lon: 2.35, ele: 100, dist: 0 },
            { lat: 48.86, lon: 2.36, ele: 102, dist: 1000 },
            { lat: 48.87, lon: 2.37, ele: 101, dist: 2000 },
        ];
        const result = analyzeGpxProfile(points);
        expect(result).toBeDefined();
        expect(result.terrainType).toBe('flat');
        expect(result.elevGain).toBeGreaterThanOrEqual(0);
        expect(result.totalDistM).toBe(2000);
    });

    test('should detect rolling terrain', () => {
        const points = [
            { lat: 48.85, lon: 2.35, ele: 100, dist: 0 },
            { lat: 48.86, lon: 2.36, ele: 130, dist: 1000 },
            { lat: 48.87, lon: 2.37, ele: 120, dist: 2000 },
        ];
        const result = analyzeGpxProfile(points);
        expect(result).toBeDefined();
        // 30m gain over 2km = 15m/km -> rolling
        expect(result.terrainType).toBe('rolling');
    });

    test('should detect mountainous terrain', () => {
        const points = [
            { lat: 48.85, lon: 2.35, ele: 100, dist: 0 },
            { lat: 48.86, lon: 2.36, ele: 200, dist: 1000 },
            { lat: 48.87, lon: 2.37, ele: 250, dist: 2000 },
        ];
        const result = analyzeGpxProfile(points);
        expect(result).toBeDefined();
        // 150m gain over 2km = 75m/km -> mountainous
        expect(result.terrainType).toBe('mountainous');
    });

    test('should return km segments', () => {
        const points = [
            { lat: 48.85, lon: 2.35, ele: 100, dist: 0 },
            { lat: 48.86, lon: 2.36, ele: 120, dist: 1000 },
            { lat: 48.87, lon: 2.37, ele: 110, dist: 2000 },
        ];
        const result = analyzeGpxProfile(points);
        expect(result.kmSegments).toHaveLength(2);
        expect(result.kmSegments[0]).toHaveProperty('km', 1);
        expect(result.kmSegments[0]).toHaveProperty('grade');
        expect(result.kmSegments[1]).toHaveProperty('km', 2);
    });
});

describe('getPacingStrategy', () => {
    test('should return even strategy for 5K or less', () => {
        const strategy = getPacingStrategy(5);
        expect(strategy.type).toBe('even');
        expect(strategy.phases).toHaveLength(3);
    });

    test('should return slight-negative for 10K', () => {
        const strategy = getPacingStrategy(10);
        expect(strategy.type).toBe('slight-negative');
    });

    test('should return negative-split for half marathon', () => {
        const strategy = getPacingStrategy(21.0975);
        expect(strategy.type).toBe('negative-split');
    });

    test('should return conservative-negative for marathon', () => {
        const strategy = getPacingStrategy(42.195);
        expect(strategy.type).toBe('conservative-negative');
    });

    test('should return ultra-conservative for ultra distances', () => {
        const strategy = getPacingStrategy(80);
        expect(strategy.type).toBe('ultra-conservative');
    });

    test('should adjust name for hilly 10K courses', () => {
        const gpxSegments = [
            { km: 1, grade: 5 },
            { km: 2, grade: -3 },
        ];
        const strategy = getPacingStrategy(10, gpxSegments);
        expect(strategy.type).toBe('slight-negative');
        expect(strategy.description).toContain('montées');
    });
});

describe('getRaceHRPhase', () => {
    test('should return correct phase for 5K start', () => {
        const phase = getRaceHRPhase(0.05, 5);
        expect(phase.name).toContain('Zone 3');
        expect(phase.minPct).toBeLessThan(phase.maxPct);
    });

    test('should return correct phase for 5K middle', () => {
        const phase = getRaceHRPhase(0.5, 5);
        expect(phase.name).toContain('Zone 4');
    });

    test('should return correct phase for 5K end', () => {
        const phase = getRaceHRPhase(0.9, 5);
        expect(phase.name).toContain('Zone 5');
    });

    test('should return correct phase for marathon start', () => {
        const phase = getRaceHRPhase(0.05, 42.195);
        expect(phase.name).toContain('Zone 2');
        expect(phase.minPct).toBeLessThanOrEqual(0.72);
    });

    test('should return correct phase for half marathon middle', () => {
        const phase = getRaceHRPhase(0.5, 21.0975);
        expect(phase.name).toContain('Zone 3-4');
    });

    test('should handle boundary progress values', () => {
        const phase1 = getRaceHRPhase(0.1, 10);
        expect(phase1).toBeDefined();

        const phase2 = getRaceHRPhase(1.0, 10);
        expect(phase2).toBeDefined();
    });
});

describe('getSplitNutrition', () => {
    const gpxSegments = [
        { km: 1, grade: 5 },
        { km: 2, grade: -3 },
        { km: 3, grade: 6 },
        { km: 4, grade: 2 },
    ];

    test('should return empty array for races under 1 hour', () => {
        const nutrition = getSplitNutrition(1, 1800, 1800, 5, 70);
        expect(nutrition).toEqual([]);
    });

    test('should suggest water after climbs', () => {
        const nutrition = getSplitNutrition(3, 9000, 14400, 21.1, 70, gpxSegments, 3);
        const waterAfterClimb = nutrition.find(n => n.label.includes('après montée'));
        expect(waterAfterClimb).toBeDefined();
        expect(waterAfterClimb.type).toBe('water');
    });

    test('should suggest water at regular intervals', () => {
        // At 15 min intervals
        const nutrition = getSplitNutrition(2, 1800, 14400, 21.1, 70);
        const water = nutrition.find(n => n.type === 'water');
        expect(water).toBeDefined();
    });

    test('should suggest gel after 30 min', () => {
        const nutrition = getSplitNutrition(5, 5400, 14400, 21.1, 70);
        const gel = nutrition.find(n => n.type === 'gel');
        expect(gel).toBeDefined();
        expect(gel.label).toContain('Gel');
    });

    test('should suggest sodium after 1 hour for long races', () => {
        const nutrition = getSplitNutrition(10, 7200, 14400, 21.1, 70);
        const sodium = nutrition.find(n => n.type === 'sodium');
        expect(sodium).toBeDefined();
    });

    test('should suggest solid food for ultra distances', () => {
        const nutrition = getSplitNutrition(15, 14400, 28800, 50, 70);
        const solid = nutrition.find(n => n.type === 'solid');
        expect(solid).toBeDefined();
        expect(solid.label).toContain('Aliment solide');
    });
});

describe('generateScientificSplits', () => {
    const baseParams = {
        distance: 10,
        basePace: 270, // 4:30/km in seconds
        elevationProfile: { gainPerKm: 0 },
        pacingStrategy: getPacingStrategy(10),
        fcm: 185,
        restingHR: 60,
        totalRaceTime: 2700, // 45 min
        weight: 70,
        strategyBias: 0,
        temperature: 15,
    };

    test('should generate correct number of splits', () => {
        const splits = generateScientificSplits(baseParams);
        expect(splits).toHaveLength(10);
    });

    test('each split should have required fields', () => {
        const splits = generateScientificSplits(baseParams);
        splits.forEach(split => {
            expect(split).toHaveProperty('km');
            expect(split).toHaveProperty('splitTime');
            expect(split).toHaveProperty('pace');
            expect(split).toHaveProperty('hrZone');
            expect(split).toHaveProperty('hrRange');
        });
    });

    test('cumulative times should be increasing', () => {
        const splits = generateScientificSplits(baseParams);
        for (let i = 1; i < splits.length; i++) {
            expect(splits[i].cumulativeTime).toBeGreaterThan(splits[i - 1].cumulativeTime);
        }
    });

    test('should apply strategy bias correctly', () => {
        const aggressive = generateScientificSplits({ ...baseParams, strategyBias: 1 });
        const conservative = generateScientificSplits({ ...baseParams, strategyBias: -1 });
        // Aggressive should start slower (more negative split)
        expect(aggressive[0].pace).not.toBe(conservative[0].pace);
    });

    test('should handle elevation profile with GPX segments', () => {
        const gpxSegments = [
            { km: 1, grade: 2, elevChange: 10 },
            { km: 2, grade: -1, elevChange: -5 },
            { km: 3, grade: 3, elevChange: 15 },
            { km: 4, grade: 0, elevChange: 0 },
            { km: 5, grade: -2, elevChange: -10 },
            { km: 6, grade: 1, elevChange: 5 },
            { km: 7, grade: 0, elevChange: 0 },
            { km: 8, grade: -1, elevChange: -5 },
            { km: 9, grade: 2, elevChange: 10 },
            { km: 10, grade: 0, elevChange: 0 },
        ];
        const splits = generateScientificSplits({
            ...baseParams,
            gpxKmSegments: gpxSegments,
        });
        expect(splits).toHaveLength(10);
        // Elevation factors should differ
        const factors = splits.map(s => s.elevationFactor);
        expect(new Set(factors).size).toBeGreaterThan(1);
    });

    test('should handle heat factor', () => {
        const cold = generateScientificSplits({ ...baseParams, temperature: 10 });
        const hot = generateScientificSplits({ ...baseParams, temperature: 30 });
        // Hot should have more cardiac drift
        const coldDrift = cold.map(s => s.cardiacDrift);
        const hotDrift = hot.map(s => s.cardiacDrift);
        expect(Math.max(...hotDrift)).toBeGreaterThanOrEqual(Math.max(...coldDrift));
    });

    test('should include nutrition for long races', () => {
        const marathonParams = {
            distance: 42.195,
            basePace: 300,
            elevationProfile: { gainPerKm: 0 },
            pacingStrategy: getPacingStrategy(42.195),
            fcm: 180,
            restingHR: 55,
            totalRaceTime: 12600, // 3h30
            weight: 70,
            strategyBias: 0,
            temperature: 15,
        };
        const splits = generateScientificSplits(marathonParams);
        const hasNutrition = splits.some(s => s.nutrition && s.nutrition.length > 0);
        expect(hasNutrition).toBe(true);
    });

    test('should handle partial last km', () => {
        const params = { ...baseParams, distance: 10.5 };
        const splits = generateScientificSplits(params);
        expect(splits).toHaveLength(11);
        expect(splits[10].distance).toBeCloseTo(0.5, 1);
    });
});

describe('calculateNutritionStrategy', () => {
    test('should return no nutrition for races under 1 hour', () => {
        const result = calculateNutritionStrategy({
            distance: 5,
            totalRaceTime: 1500, // 25 min
            weight: 70,
            temperature: 15,
            elevationProfile: {},
        });
        expect(result.carbPerHour).toBe(0);
        expect(result.totalWater).toBe(0);
        expect(result.totalGels).toBe(0);
    });

    test('should calculate nutrition for marathon', () => {
        const result = calculateNutritionStrategy({
            distance: 42.195,
            totalRaceTime: 12600, // 3h30
            weight: 70,
            temperature: 15,
            elevationProfile: {},
        });
        expect(result.carbPerHour).toBe(60);
        expect(result.totalWater).toBeGreaterThan(0);
        expect(result.totalGels).toBeGreaterThan(0);
        expect(result.duringRace).toBeInstanceOf(Array);
        expect(result.duringRace.length).toBeGreaterThan(0);
    });

    test('should adjust for hot temperatures', () => {
        const normal = calculateNutritionStrategy({
            distance: 42.195,
            totalRaceTime: 14400,
            weight: 70,
            temperature: 15,
            elevationProfile: {},
        });
        const hot = calculateNutritionStrategy({
            distance: 42.195,
            totalRaceTime: 14400,
            weight: 70,
            temperature: 30,
            elevationProfile: {},
        });
        expect(hot.carbPerHour).toBeLessThanOrEqual(normal.carbPerHour);
        expect(hot.fluidMlPerHour).toBeGreaterThan(normal.fluidMlPerHour);
    });

    test('should calculate ultra nutrition', () => {
        const result = calculateNutritionStrategy({
            distance: 80,
            totalRaceTime: 28800, // 8 hours
            weight: 70,
            temperature: 20,
            elevationProfile: {},
        });
        expect(result.carbPerHour).toBe(90);
        expect(result.totalWater).toBeGreaterThan(0);
        expect(result.duringRace.length).toBeGreaterThan(0);
        // Should include solid food recommendation
        const hasSolid = result.duringRace.some(n => n.type === 'solid');
        expect(hasSolid).toBe(true);
    });

    test('should include pre-race and post-race info', () => {
        const result = calculateNutritionStrategy({
            distance: 21.0975,
            totalRaceTime: 5400,
            weight: 70,
            temperature: 15,
            elevationProfile: {},
        });
        expect(result.preRace).toBeDefined();
        expect(result.preRace.meal).toBeDefined();
        expect(result.preRace.topUp).toBeDefined();
        expect(result.postRace).toBeDefined();
        expect(result.postRace.within30min).toBeDefined();
        expect(result.postRace.within2hours).toBeDefined();
    });

    test('should include scientific references', () => {
        const result = calculateNutritionStrategy({
            distance: 42.195,
            totalRaceTime: 12600,
            weight: 70,
            temperature: 15,
            elevationProfile: {},
        });
        expect(result.references).toBeInstanceOf(Array);
        expect(result.references.length).toBeGreaterThan(0);
    });

    test('should handle edge case with very light weight', () => {
        const result = calculateNutritionStrategy({
            distance: 42.195,
            totalRaceTime: 14400,
            weight: 45,
            temperature: 25,
            elevationProfile: {},
        });
        expect(result.fluidMlPerHour).toBeGreaterThan(0);
        expect(result.caffeineDose).toBe(135); // 45 * 3
    });
});
