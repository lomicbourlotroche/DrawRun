/**
 * ============================================================
 * Algorithm Tests
 * ============================================================
 */

const { 
    SCIENTIFIC_CONSTANTS,
    MathUtils,
    Cardiovascular,
    RunningPerformance,
    TrainingLoad,
    PMC,
    Polarization,
    HRV,
    CriticalPower,
    Overtraining,
} = require('../src/algorithms');

describe('Scientific Constants', () => {
    test('should have PMC constants', () => {
        expect(SCIENTIFIC_CONSTANTS).toHaveProperty('PMC');
        expect(SCIENTIFIC_CONSTANTS.PMC).toHaveProperty('TAU_FITNESS_DEFAULT');
        expect(SCIENTIFIC_CONSTANTS.PMC.TAU_FITNESS_DEFAULT).toBe(42);
    });

    test('should have ACWR thresholds', () => {
        expect(SCIENTIFIC_CONSTANTS).toHaveProperty('ACWR');
        expect(SCIENTIFIC_CONSTANTS.ACWR).toHaveProperty('OPTIMAL_MIN');
        expect(SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MIN).toBe(0.8);
        expect(SCIENTIFIC_CONSTANTS.ACWR.OPTIMAL_MAX).toBe(1.3);
    });

    test('should have VDOT constants', () => {
        expect(SCIENTIFIC_CONSTANTS).toHaveProperty('VDOT');
        expect(SCIENTIFIC_CONSTANTS.VDOT).toHaveProperty('E_LOW');
    });
});

describe('MathUtils', () => {
    test('should clamp values', () => {
        expect(MathUtils.clamp(5, 0, 10)).toBe(5);
        expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
        expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });

    test('should calculate mean', () => {
        expect(MathUtils.mean([1, 2, 3, 4, 5])).toBe(3);
        expect(MathUtils.mean([])).toBe(0);
    });

    test('should format pace', () => {
        expect(MathUtils.formatPace(300)).toBe('5:00');
        expect(MathUtils.formatPace(330)).toBe('5:30');
        expect(MathUtils.formatPace(0)).toBe('--:--');
    });

    test('should parse pace', () => {
        expect(MathUtils.parsePace('5:30')).toBe(330);
    });
});

describe('Cardiovascular Module', () => {
    test('calculateMaxHR exists', () => {
        expect(typeof Cardiovascular.calculateMaxHR).toBe('function');
    });

    test('calculateMaxHR returns correct value', () => {
        expect(Cardiovascular.calculateMaxHR(30)).toBe(187);
    });

    test('calculateKarvonenZones exists', () => {
        expect(typeof Cardiovascular.calculateKarvonenZones).toBe('function');
    });

    test('calculateKarvonenZones returns zones', () => {
        const zones = Cardiovascular.calculateKarvonenZones(30, 60, 'M');
        expect(Array.isArray(zones)).toBe(true);
        expect(zones.length).toBe(7);
    });

    test('estimateMaxHR exists', () => {
        expect(typeof Cardiovascular.estimateMaxHR).toBe('function');
    });

    test('calculatePercentZones exists', () => {
        expect(typeof Cardiovascular.calculatePercentZones).toBe('function');
    });
});

describe('RunningPerformance Module', () => {
    test('calculateVDOT exists', () => {
        expect(typeof RunningPerformance.calculateVDOT).toBe('function');
    });

    test('calculateVDOT returns reasonable value', () => {
        const vdot = RunningPerformance.calculateVDOT(5000, 15);
        expect(vdot).toBeGreaterThan(50);
        expect(vdot).toBeLessThan(80);
    });

    test('predictRaceTime exists', () => {
        expect(typeof RunningPerformance.predictRaceTime).toBe('function');
    });

    test('estimateVO2max exists', () => {
        expect(typeof RunningPerformance.estimateVO2max).toBe('function');
    });

    test('estimateVO2max returns correct value', () => {
        const vo2max = RunningPerformance.estimateVO2max(15);
        expect(vo2max).toBeCloseTo(54.7, 1);
    });

    test('getTrainingPaces exists', () => {
        expect(typeof RunningPerformance.getTrainingPaces).toBe('function');
    });

    test('getTrainingPaces returns training zones', () => {
        const paces = RunningPerformance.getTrainingPaces(50);
        expect(paces).toHaveProperty('E');
        expect(paces).toHaveProperty('M');
        expect(paces).toHaveProperty('T');
    });

    test('calculateSpeedZones exists', () => {
        expect(typeof RunningPerformance.calculateSpeedZones).toBe('function');
    });

    test('getPaceSeconds exists', () => {
        expect(typeof RunningPerformance.getPaceSeconds).toBe('function');
    });

    test('predictMarathon exists', () => {
        expect(typeof RunningPerformance.predictMarathon).toBe('function');
    });

    test('predictHalfMarathon exists', () => {
        expect(typeof RunningPerformance.predictHalfMarathon).toBe('function');
    });

    test('getPerformanceLevel exists', () => {
        expect(typeof RunningPerformance.getPerformanceLevel).toBe('function');
    });
});

describe('TrainingLoad Module', () => {
    test('calculateTSS exists', () => {
        expect(typeof TrainingLoad.calculateTSS).toBe('function');
    });

    test('calculateTSS returns correct value', () => {
        const tss = TrainingLoad.calculateTSS(3600, 0.85);
        expect(tss).toBeCloseTo(72.25, 0);
    });

    test('calculateTRIMP exists', () => {
        expect(typeof TrainingLoad.calculateTRIMP).toBe('function');
    });

    test('calculateTRIMPFromAvgHR exists', () => {
        expect(typeof TrainingLoad.calculateTRIMPFromAvgHR).toBe('function');
    });

    test('estimateIFFromHR exists', () => {
        expect(typeof TrainingLoad.estimateIFFromHR).toBe('function');
    });

    test('calculateNormalizedValue exists', () => {
        expect(typeof TrainingLoad.calculateNormalizedValue).toBe('function');
    });
});

describe('PMC Module', () => {
    test('calculate exists', () => {
        expect(typeof PMC.calculate).toBe('function');
    });

    test('calculate returns PMC data', () => {
        const activities = [
            { date: '2024-01-01', tss: 100 },
            { date: '2024-01-02', tss: 120 },
            { date: '2024-01-03', tss: 90 },
        ];
        const data = PMC.calculate(activities);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(3);
    });

    test('calculateACWR exists', () => {
        expect(typeof PMC.calculateACWR).toBe('function');
    });

    test('calculateACWR returns correct ratio', () => {
        const acwr = PMC.calculateACWR(100, 100);
        expect(acwr).toBe(1);
    });

    test('getACWRStatus exists', () => {
        expect(typeof PMC.getACWRStatus).toBe('function');
    });

    test('getACWRStatus returns optimal for good ACWR', () => {
        const status = PMC.getACWRStatus(1.0);
        expect(status).toHaveProperty('status');
        expect(status.status).toBe('optimal');
    });

    test('getACWRStatus returns risky for high ACWR', () => {
        const status = PMC.getACWRStatus(1.4);
        expect(status).toHaveProperty('status');
        expect(['risky', 'overreaching']).toContain(status.status);
    });

    test('calculateMonotony exists', () => {
        expect(typeof PMC.calculateMonotony).toBe('function');
    });

    test('calculateStrain exists', () => {
        expect(typeof PMC.calculateStrain).toBe('function');
    });

    test('getStrainStatus exists', () => {
        expect(typeof PMC.getStrainStatus).toBe('function');
    });

    test('estimateReadiness exists', () => {
        expect(typeof PMC.estimateReadiness).toBe('function');
    });
});

describe('Polarization Module', () => {
    test('calculatePolarizationIndex exists', () => {
        expect(typeof Polarization.calculatePolarizationIndex).toBe('function');
    });

    test('calculatePolarizationIndex returns value', () => {
        const activities = [
            { zonePercent: { 1: 40, 2: 40, 3: 5, 4: 10, 5: 5 } }
        ];
        const index = Polarization.calculatePolarizationIndex(activities);
        expect(typeof index).toBe('number');
    });

    test('classifyDistribution exists', () => {
        expect(typeof Polarization.classifyDistribution).toBe('function');
    });

    test('getRecommendation exists', () => {
        expect(typeof Polarization.getRecommendation).toBe('function');
    });
});

describe('HRV Module', () => {
    test('analyzeRecovery exists', () => {
        expect(typeof HRV.analyzeRecovery).toBe('function');
    });

    test('analyzeRecovery returns analysis', () => {
        const result = HRV.analyzeRecovery(50, 50, 60);
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('readiness');
    });

    test('calculateStressScore exists', () => {
        expect(typeof HRV.calculateStressScore).toBe('function');
    });
});

describe('Overtraining Module', () => {
    test('detectOTS exists', () => {
        expect(typeof Overtraining.detectOTS).toBe('function');
    });

    test('detectOTS returns status', () => {
        const result = Overtraining.detectOTS({
            performanceTrend: -15,
            hrvRatio: 0.6,
            sleepQuality: 40,
        });
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('riskScore');
        expect(result).toHaveProperty('recommendation');
    });
});

describe('CriticalPower Module', () => {
    test('estimateFromEfforts exists', () => {
        expect(typeof CriticalPower.estimateFromEfforts).toBe('function');
    });

    test('estimateFromEfforts returns CP and W prime', () => {
        const efforts = [
            { duration: 120, value: 400 },
            { duration: 300, value: 350 },
            { duration: 600, value: 300 },
        ];
        const result = CriticalPower.estimateFromEfforts(efforts);
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('CP');
        expect(result).toHaveProperty('W_prime');
    });

    test('timeToExhaustion exists', () => {
        expect(typeof CriticalPower.timeToExhaustion).toBe('function');
    });

    test('estimateFTP exists', () => {
        expect(typeof CriticalPower.estimateFTP).toBe('function');
    });
});