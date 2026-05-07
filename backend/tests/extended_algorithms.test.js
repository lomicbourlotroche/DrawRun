/**
 * ============================================================
 * Extended Algorithm Tests (Biomechanics, Tapering, RaceStrategy)
 * ============================================================
 */

const { 
    Biomechanics,
    Taper,
    RaceStrategy,
    Nutrition
} = require('../src/algorithms');

describe('Biomechanics Module', () => {
    test('calculateVerticalOscillation returns reasonable values', () => {
        const vo = Biomechanics.calculateVerticalOscillation(180, 4.0);
        expect(vo).toBeGreaterThan(5);
        expect(vo).toBeLessThan(15);
    });

    test('calculateGroundContactTime returns reasonable values', () => {
        const gct = Biomechanics.calculateGroundContactTime(180, 4.0);
        expect(gct).toBeGreaterThan(150);
        expect(gct).toBeLessThan(350);
    });

    test('calculateLegStiffness returns reasonable values', () => {
        const stiffness = Biomechanics.calculateLegStiffness(70, 0.08, 0.25);
        expect(stiffness).toBeGreaterThan(5);
        expect(stiffness).toBeLessThan(20);
    });

    test('getRating returns correct rating', () => {
        expect(Biomechanics.getRating('cadence', 185)).toBe('excellent');
        expect(Biomechanics.getRating('cadence', 165)).toBe('fair');
        expect(Biomechanics.getRating('oscillation', 7)).toBe('excellent');
    });
});

describe('Taper Module', () => {
    test('calculateOptimalTaper returns a plan with correct duration', () => {
        const result = Taper.calculateOptimalTaper(50, 14, 'marathon');
        expect(result).toHaveProperty('plan');
        expect(result.plan.length).toBe(15); // J-14 to J-0
        expect(result).toHaveProperty('expectedGain');
    });

    test('expected gain should be between 2 and 5 percent', () => {
        const result = Taper.calculateOptimalTaper(50, 14, '10k');
        expect(result.expectedGain).toBeGreaterThanOrEqual(2);
        expect(result.expectedGain).toBeLessThanOrEqual(5);
    });

    test('volume should decrease exponentially', () => {
        const result = Taper.calculateOptimalTaper(100, 14, 'marathon');
        const firstDay = result.plan[0].volumePercent; // J-14
        const lastDay = result.plan[result.plan.length - 2].volumePercent; // J-1
        expect(firstDay).toBeGreaterThan(lastDay);
    });
});

describe('RaceStrategy Module', () => {
    const mockPoints = [
        { dist: 0, elev: 0 },
        { dist: 1000, elev: 10 },
        { dist: 2000, elev: -5 },
        { dist: 3000, elev: 5 }
    ];
    const mockAthlete = { vdot: 50, weight: 70 };

    test('generatePlan returns complete strategy', () => {
        const strategy = RaceStrategy.generatePlan(mockPoints, mockAthlete, { temp: 15 });
        expect(strategy).toHaveProperty('segments');
        expect(strategy).toHaveProperty('summary');
        expect(strategy).toHaveProperty('nutrition');
        expect(strategy).toHaveProperty('taper');
    });

    test('adjustPaceForGrade slows down on ascent', () => {
        const flatPace = 300; // 5:00
        const uphillPace = RaceStrategy.adjustPaceForGrade(flatPace, 5); // 5% grade
        expect(uphillPace).toBeGreaterThan(flatPace);
    });
});

describe('Nutrition Module', () => {
    test('calculateRequirements returns carbs and hydration', () => {
        const req = Nutrition.calculateRequirements(120, 0.8, 70); // 2h at 80%
        expect(req.carbs.totalG).toBeGreaterThan(60);
        expect(req.hydration.totalMl).toBeGreaterThan(1000);
    });
});

/**
 * ============================================================
 * Property-Based Tests (Robustness)
 * ============================================================
 */
const { fc } = require('@fast-check/jest');
const { MathUtils } = require('../src/algorithms');

describe('Algorithm Robustness (Property-Based)', () => {
    test('MathUtils.clamp should always return a value between min and max', () => {
        fc.assert(
            fc.property(fc.double(), fc.double(), fc.double(), (val, min, max) => {
                const actualMin = Math.min(min, max);
                const actualMax = Math.max(min, max);
                const clamped = MathUtils.clamp(val, actualMin, actualMax);
                return clamped >= actualMin && clamped <= actualMax;
            })
        );
    });

    test('Biomechanics.estimateMetrics should never crash and return reasonable values', () => {
        fc.assert(
            fc.property(fc.integer({ min: 100, max: 250 }), fc.double({ min: 1, max: 10 }), (cadence, speedMs) => {
                const metrics = Biomechanics.estimateMetrics(speedMs, cadence, 70, 180);
                return metrics !== null && 
                       metrics.verticalOscillation > 0 && 
                       metrics.groundContactTime > 0;
            })
        );
    });

    test('Taper.calculateOptimalTaper should handle various loads and durations', () => {
        fc.assert(
            fc.property(fc.double({ min: 10, max: 200 }), fc.integer({ min: 3, max: 21 }), (load, duration) => {
                const result = Taper.calculateOptimalTaper(load, duration, 'marathon');
                // The algorithm caps actualDays at targetDays (14 for marathon)
                const expectedLength = Math.min(duration, 14) + 1;
                return result.plan.length === expectedLength && 
                       result.expectedGain >= 2 && 
                       result.expectedGain <= 5;
            })
        );
    });
});
