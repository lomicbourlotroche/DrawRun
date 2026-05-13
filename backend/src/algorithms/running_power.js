'use strict';

const { MathUtils } = require('./math_utils');

const RunningPower = {
    /**
     * Estimate running power from pace and grade
     * Ref: Minetti et al. (2002) metabolic cost model
     * @param {number} paceSecPerKm - Pace in seconds per km
     * @param {number} grade - Grade as decimal (0.05 = 5% uphill)
     * @param {number} weight - Runner weight in kg
     * @returns {object} Power estimation with components
     */
    estimateFromPace: (paceSecPerKm, grade = 0, weight = 70) => {
        const speedMs = 1000 / paceSecPerKm;

        // Horizontal power (COST of running ~ 0.98 J/kg/m at optimal speed)
        const costOfRunning = 0.98 + 0.002 * Math.abs(speedMs - 3.5);
        const horizontalPower = costOfRunning * weight * speedMs;

        // Vertical power (mgh/t)
        const verticalSpeed = speedMs * grade;
        const verticalPower = weight * 9.81 * verticalSpeed;

        // Total mechanical power (efficiency ~25%)
        const totalMechanical = horizontalPower + Math.max(0, verticalPower);
        const metabolicPower = totalMechanical / 0.25;

        // Form power (lateral oscillation, ~15-25% of total)
        const formPower = metabolicPower * 0.20;

        // Leg spring stiffness adjustment
        const legSpringFactor = 1 + 0.05 * Math.abs(grade);

        const totalPower = Math.round((metabolicPower + formPower) * legSpringFactor);

        return {
            totalPower,
            horizontalPower: Math.round(horizontalPower),
            verticalPower: Math.round(Math.max(0, verticalPower)),
            formPower: Math.round(formPower),
            metabolicPower: Math.round(metabolicPower),
            efficiency: 0.25,
            grade,
            speed: Math.round(speedMs * 100) / 100,
        };
    },

    /**
     * Estimate power from HR and pace (when no power meter)
     * Uses HR as proxy for metabolic demand
     */
    estimateFromHR: (heartRate, maxHR, paceSecPerKm, weight = 70) => {
        const hrPercent = heartRate / maxHR;
        const basePower = RunningPower.estimateFromPace(paceSecPerKm, 0, weight);

        // HR-based correction factor
        const hrCorrection = 0.7 + 0.6 * hrPercent;
        const adjustedPower = Math.round(basePower.totalPower * hrCorrection);

        return {
            totalPower: adjustedPower,
            hrPercent: Math.round(hrPercent * 100) / 100,
            confidence: hrPercent > 0.5 && hrPercent < 0.95 ? 'moderate' : 'low',
            ...basePower,
        };
    },

    /**
     * Calculate power zones from FTP (Functional Threshold Power)
     * 7-zone model (Coggan adapted for running)
     */
    calculatePowerZones: (ftp) => {
        return [
            { zone: 1, name: 'Active Recovery', min: 0, max: Math.round(ftp * 0.55), description: 'Récupération active' },
            { zone: 2, name: 'Endurance', min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75), description: 'Endurance fondamentale' },
            { zone: 3, name: 'Tempo', min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.90), description: 'Allure tempo' },
            { zone: 4, name: 'Threshold', min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05), description: 'Seuil lactique' },
            { zone: 5, name: 'VO2max', min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20), description: 'VO2max' },
            { zone: 6, name: 'Anaerobic', min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50), description: 'Anaérobie' },
            { zone: 7, name: 'Neuromuscular', min: Math.round(ftp * 1.50), max: Infinity, description: 'Neuromusculaire' },
        ];
    },

    /**
     * Estimate FTP from race performance
     */
    estimateFTPFromRace: (raceDistanceKm, raceTimeSec, weight = 70) => {
        const paceSecPerKm = raceTimeSec / raceDistanceKm;
        const power = RunningPower.estimateFromPace(paceSecPerKm, 0, weight);

        // FTP ≈ 95% of 1-hour power
        const durationHours = raceTimeSec / 3600;
        const ftpFactor = durationHours >= 1 ? 0.95 : 0.90 + 0.05 * durationHours;

        return Math.round(power.totalPower * ftpFactor);
    },

    /**
     * Calculate Normalized Power for running (similar to cycling)
     * Uses 30-second rolling average with 4th power
     */
    calculateNormalizedPower: (powerSamples, sampleIntervalSec = 1) => {
        if (powerSamples.length < 30) return MathUtils.mean(powerSamples);

        // 30-second rolling average
        const rollingAvg = [];
        const windowSize = Math.floor(30 / sampleIntervalSec);

        for (let i = windowSize; i < powerSamples.length; i++) {
            const window = powerSamples.slice(i - windowSize, i);
            rollingAvg.push(MathUtils.mean(window));
        }

        // NP = (mean(x^4))^(1/4)
        const fourthPowers = rollingAvg.map(p => Math.pow(p, 4));
        const meanFourth = MathUtils.mean(fourthPowers);
        return Math.round(Math.pow(meanFourth, 0.25));
    },

    /**
     * Calculate Intensity Factor (IF) = NP / FTP
     */
    calculateIntensityFactor: (normalizedPower, ftp) => {
        if (!ftp || ftp === 0) return null;
        return Math.round((normalizedPower / ftp) * 1000) / 1000;
    },

    /**
     * Calculate Running Stress Score from power
     */
    calculatePowerTSS: (durationSec, normalizedPower, ftp) => {
        if (!ftp || ftp === 0) return 0;
        const if_ = normalizedPower / ftp;
        return Math.round((durationSec * if_ * if_ * 100) / 3600);
    },
};

module.exports = { RunningPower };
