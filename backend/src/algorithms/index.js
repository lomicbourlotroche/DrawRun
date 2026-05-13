/* eslint-disable security/detect-object-injection, unused-imports/no-unused-vars, no-constant-condition */
/**
 * DrawRun Scientific Algorithms v2.0
 * ================================
 * 
 * Fichier barillet — chaque module a été extrait dans son propre fichier.
 * Tous les imports existants (require('./algorithms/index')) continuent de fonctionner.
 * 
 * Modules disponibles:
 *   SCIENTIFIC_CONSTANTS, MathUtils, Cardiovascular, RunningPerformance,
 *   TrainingLoad, PMC, Polarization, HRV, CriticalPower, Overtraining,
 *   Taper, Recommendations, SportAnalysis, RunningPower, SleepOptimization,
 *   AltitudeTraining, Nutrition, Biomechanics, EnvironmentalImpact, RaceStrategy
 * 
 * Références:
 * [1] Banister, E.W. (1975). Development of a technique for measuring exercise-induced feeling states.
 * [2] Edwards, T.L. (1993). Heart rate: A practical guide to monitoring heart rate. 
 * [3] Seiler, S. & Kjerland, G.Ø. (2006). Quantifying training intensity distribution...
 * [4] Jack Daniels (2021). Daniels' Running Formula, 4th Edition. Human Kinetics.
 * [5] Hellard, P. et al. (2006). Assessing limitations of Banister model. J Sports Sci.
 * [6] Busso, T. & Chalencon, S. (2023). Validity of Impulse-Response Models. MSSE.
 * [7] Gabbett, T.J. (2016). The training-injury prevention paradox. Br J Sports Med.
 * [8] Maupin, D. et al. (2020). ACWR and Injury Risk. Sports Med.
 * [9] Poole, D.C. et al. (2016). Critical Power. MSSE.
 * [10] Esco, M.R. et al. (2025). HRV monitoring. Sensors.
 * [11] Mujika, I. & Padilla, S. (2003). Scientific bases for precompetition tapering. MSSE.
 * [12] Støren, Ø. et al. (2008). Running economy. J Strength Cond Res.
 */

'use strict';

const SCIENTIFIC_CONSTANTS = require('./scientific_constants');
const { MathUtils } = require('./math_utils');
const { Cardiovascular } = require('./cardiovascular');
const { RunningPerformance } = require('./running_performance');
const { TrainingLoad } = require('./training_load');
const { PMC } = require('./pmc');
const { Polarization } = require('./polarization');
const { HRV } = require('./hrv');
const { CriticalPower } = require('./critical_power');
const { Overtraining } = require('./overtraining');
const { Taper } = require('./taper');
const { Recommendations } = require('./recommendations');
const { SportAnalysis } = require('./sport_analysis');
const { RunningPower } = require('./running_power');
const { SleepOptimization } = require('./sleep_optimization');
const { AltitudeTraining } = require('./altitude_training');
const { Nutrition } = require('./nutrition');
const { Biomechanics } = require('./biomechanics');
const { EnvironmentalImpact } = require('./environmental_impact');
const { RaceStrategy } = require('./race_strategy');

module.exports = {
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
    Taper,
    Recommendations,
    SportAnalysis,
    RunningPower,
    SleepOptimization,
    AltitudeTraining,
    Nutrition,
    EnvironmentalImpact,
    RaceStrategy,
    Biomechanics,
};
