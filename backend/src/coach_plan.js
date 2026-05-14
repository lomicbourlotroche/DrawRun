'use strict';

const planService = require('./services/coach/plan.service');
const sessionService = require('./services/coach/session.service');
const orchestration = require('./services/coach/index');

module.exports = {
    SESSION_TYPES: planService.SESSION_TYPES,
    createTrainingPlan: planService.createTrainingPlan,
    getPlanById: planService.getPlanById,
    getPlanProgress: planService.getPlanProgress,
    getWeeklyPlanSummary: planService.getWeeklyPlanSummary,
    getActivePlan: planService.getActivePlan,
    getPlanSessions: sessionService.getPlanSessions,
    markSessionCompleted: sessionService.markSessionCompleted,
    getTodaySessions: sessionService.getTodaySessions,
    getUpcomingSessions: sessionService.getUpcomingSessions,
    markSessionMissed: sessionService.markSessionMissed,
    scheduleTest: sessionService.scheduleTest,
    submitTestResults: sessionService.submitTestResults,
    matchActivityToSession: sessionService.matchActivityToSession,
    getPendingSessions: sessionService.getPendingSessions,
    adaptPlanBasedOnFeedback: sessionService.adaptPlanBasedOnFeedback,
    getCoachProfile: orchestration.getCoachProfile,
    getGamification: orchestration.getGamification,
    addExternalEvent: orchestration.addExternalEvent,
};
