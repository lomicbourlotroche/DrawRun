/**
 * ============================================================
 * API CLIENT - Barrel Export
 * ============================================================
 * 
 * Ce fichier exporte tous les modules API pour rétrocompatibilité
 * avec l'ancien api.ts monolithique.
 * 
 * IMPORTANT: Ce fichier maintient la compatibilité ascendante.
 * Tous les imports existants continueront de fonctionner.
 * 
 * @module lib/api
 */

// ============================================================================
// Exports des types partagés
// ============================================================================

export { ApiError } from './types';
export type {
  SyncResult,
  SyncStatus,
  AlgoZonesParams,
  AlgoZonesResponse,
  AlgoVdotParams,
  AlgoVdotResponse,
  AlgoPmcParams,
  AlgoPmcResponse,
  AlgoRecommendationsParams,
  AlgoReadinessParams,
  AlgoReadinessResponse,
  AlgoTaperParams,
  AlgoOvertrainingParams,
  AlgoCriticalPowerParams,
  AlgoTSSParams,
  AlgoHealthParams,
  StartAdaptivePlanParams,
  SubmitPlanFeedbackParams,
  ReportMissedSessionParams,
  ScheduleTestParams,
  SubmitTestResultsParams,
  AddExternalEventParams,
  MatchActivityToSessionParams,
  CreateGroupParams,
  ShareStatsParams,
  LeaderboardParams,
  CreateConversationParams,
  SendMessageParams,
  CreateChallengeParams,
  UpdateChallengeProgressParams,
  CreateEventParams,
  CreateBadgeParams,
  CreateSegmentParams,
  GetNearbySegmentsParams,
  CreateSegmentEffortParams,
  CreateRouteParams,
  GetPublicRoutesParams,
  GetHeatmapParams,
  GetPopularLocationsParams,
  AddActivityPhotoParams,
  CalculateTSSParams,
  UpdatePreferencesParams,
  CompleteOnboardingStepParams,
  AddManualActivityParams,
  ConnectServiceParams,
  AddCommentParams,
  AddReactionParams,
  RemoveReactionParams,
  PaginationParams,
} from './types';

// ============================================================================
// Exports du client HTTP
// ============================================================================

export { client, ApiClient } from './client';

// ============================================================================
// Exports des modules API par domaine
// ============================================================================

export { authApi } from './auth.api';
export { profileApi } from './profile.api';
export { activitiesApi } from './activities.api';
export { syncApi } from './sync.api';
export { algoApi } from './algo.api';
export { coachApi } from './coach.api';
export { socialApi } from './social.api';
export { exploreApi } from './explore.api';
export { metricsApi } from './metrics.api';
export { onboardingApi } from './onboarding.api';
export { notificationsApi } from './notifications.api';
export { racePlanningApi } from './race-planning.api';
export { weatherApi } from './weather.api';
export { shareApi } from './share.api';

// ============================================================================
// RETROCOMPATIBILITÉ - Ancien api.ts
// ============================================================================

/**
 * IMPORTANT: L'objet 'api' ci-dessous maintient la compatibilité avec
 * l'ancien fichier api.ts. Tous les imports existants comme:
 *   import { api } from '@/lib/api';
 *   api.login(email, password);
 * continueront de fonctionner sans modification.
 * 
 * NOTE: Pour les nouveaux développements, préférez l'utilisation des
 * modules spécifiques:
 *   import { authApi } from '@/lib/api';
 *   authApi.login(email, password);
 */

import { authApi } from './auth.api';
import { profileApi } from './profile.api';
import { activitiesApi } from './activities.api';
import { syncApi } from './sync.api';
import { algoApi } from './algo.api';
import { coachApi } from './coach.api';
import { socialApi } from './social.api';
import { exploreApi } from './explore.api';
import { metricsApi } from './metrics.api';
import { onboardingApi } from './onboarding.api';
import { notificationsApi } from './notifications.api';
import { racePlanningApi } from './race-planning.api';
import { weatherApi } from './weather.api';
import { shareApi } from './share.api';
import { userConstantsApi } from './user-constants.api';
import { client } from './client';

// Création d'un objet api unifié pour rétrocompatibilité
export const api = {
  // Client methods
  getToken: () => client.getToken(),
  setToken: (token: string | null) => client.setToken(token),
  setRefreshToken: (token: string | null) => client.setRefreshToken(token),
  getRefreshToken: () => client.getRefreshToken(),
  isAuthenticated: () => client.isAuthenticated(),
  clearToken: () => client.clearToken(),

  // Auth endpoints
  healthCheck: authApi.healthCheck,
  login: authApi.login,
  register: authApi.register,
  forgotPassword: authApi.forgotPassword,
  resetPassword: authApi.resetPassword,
  changePassword: authApi.changePassword,
  setup2FA: authApi.setup2FA,
  enable2FA: authApi.enable2FA,
  disable2FA: authApi.disable2FA,
  deleteAccount: authApi.deleteAccount,
  disconnectService: authApi.disconnectService,
  connectStrava: authApi.connectStrava,
  connectGarmin: authApi.connectGarmin,
  connectSuunto: authApi.connectSuunto,
  disconnectStrava: authApi.disconnectStrava,
  disconnectGarmin: authApi.disconnectGarmin,
  disconnectSuunto: authApi.disconnectSuunto,

  // Profile endpoints
  getProfile: profileApi.getProfile,
  updateProfile: profileApi.updateProfile,
  getExtendedProfile: profileApi.getExtendedProfile,
  updateExtendedProfile: profileApi.updateExtendedProfile,
  getAthlete: profileApi.getAthlete,
  getAthleteStats: profileApi.getAthleteStats,
  uploadAvatar: profileApi.uploadAvatar,

  // Activities endpoints
  getActivities: activitiesApi.getActivities,
  getActivity: activitiesApi.getActivity,
  getActivityStreams: activitiesApi.getActivityStreams,
  getActivitySplits: activitiesApi.getActivitySplits,
  getActivityAnalysis: activitiesApi.getActivityAnalysis,
  createActivity: activitiesApi.createActivity,
  addManualActivity: activitiesApi.addManualActivity,
  importGpx: activitiesApi.importGpx,

  // Sync endpoints
  sync: syncApi.sync,
  getSyncStatus: syncApi.getSyncStatus,
  getStravaUrl: syncApi.getStravaUrl,
  uploadHealthConnectActivities: syncApi.uploadHealthConnectActivities,

  // Algorithm endpoints
  getZones: algoApi.getZones,
  getAlgoZones: algoApi.getZones, // alias
  getVdot: algoApi.getVdot,
  getAlgoVdot: algoApi.getVdot, // alias
  getAlgoPmc: algoApi.getPmc, // algo version with params
  getRecommendations: algoApi.getRecommendations,
  getAlgoRecommendations: algoApi.getRecommendations, // alias
  getAlgoReadiness: algoApi.getReadiness,
  getPolarization: algoApi.getPolarization,
  getAlgoPolarization: algoApi.getPolarization, // alias
  getHRV: algoApi.getHRV,
  getAlgoHRV: algoApi.getHRV, // alias
  getTaper: algoApi.getTaper,
  getAlgoTaper: algoApi.getTaper, // alias
  getOvertraining: algoApi.getOvertraining,
  getAlgoOvertraining: algoApi.getOvertraining, // alias
  getCriticalPower: algoApi.getCriticalPower,
  getAlgoCriticalPower: algoApi.getCriticalPower, // alias
  getAlgoTSS: algoApi.getTSS, // alias
  getHealth: algoApi.getHealth,
  getAlgoHealth: algoApi.getHealth, // alias
  getAlgoConstants: algoApi.getConstants,

  // Coach endpoints
  getCoachProfile: coachApi.getCoachProfile,
  getActivePlan: coachApi.getActivePlan,
  generatePlan: coachApi.generatePlan,
  startAdaptivePlan: coachApi.startAdaptivePlan,
  submitPlanFeedback: coachApi.submitPlanFeedback,
  getPlan: coachApi.getPlan,
  reportMissedSession: coachApi.reportMissedSession,
  getPlanProgress: coachApi.getPlanProgress,
  scheduleTest: coachApi.scheduleTest,
  submitTestResults: coachApi.submitTestResults,
  addExternalEvent: coachApi.addExternalEvent,
  getGamification: coachApi.getGamification,
  matchActivityToSession: coachApi.matchActivityToSession,
  getPendingSessions: coachApi.getPendingSessions,

  // Social endpoints
  getFriends: socialApi.getFriends,
  getPendingFriendRequests: socialApi.getPendingFriendRequests,
  sendFriendRequest: socialApi.sendFriendRequest,
  acceptFriendRequest: socialApi.acceptFriendRequest,
  rejectFriendRequest: socialApi.rejectFriendRequest,
  removeFriend: socialApi.removeFriend,
  getGroups: socialApi.getGroups,
  getPublicGroups: socialApi.getPublicGroups,
  getGroupDetail: socialApi.getGroupDetail,
  createGroup: socialApi.createGroup,
  editGroup: socialApi.editGroup,
  deleteGroup: socialApi.deleteGroup,
  joinGroup: socialApi.joinGroup,
  leaveGroup: socialApi.leaveGroup,
  getGroupMembers: socialApi.getGroupMembers,
  kickMember: socialApi.kickMember,
  promoteMember: socialApi.promoteMember,
  getGroupActivities: socialApi.getGroupActivities,
  getGroupEvents: socialApi.getGroupEvents,
  createGroupEvent: socialApi.createEvent,
  joinGroupEvent: socialApi.joinEvent,
  getGroupEvents: socialApi.getGroupEvents,
  likeActivity: socialApi.likeActivity,
  unlikeActivity: socialApi.unlikeActivity,
  getActivityLikes: socialApi.getActivityLikes,
  getLikedActivities: socialApi.getLikedActivities,
  toggleActivityDraw: socialApi.toggleActivityDraw,
  getActivityDraws: socialApi.getActivityDraws,
  getActivityDrawStats: socialApi.getActivityDrawStats,
  hasUserDrawnActivity: socialApi.hasUserDrawnActivity,
  getUserDrawnActivities: socialApi.getUserDrawnActivities,
  getSocialFeed: socialApi.getSocialFeed,
  getSocialFeedPaginated: socialApi.getSocialFeedPaginated,
  searchUsers: socialApi.searchUsers,
  getPublicProfile: socialApi.getPublicProfile,
  addComment: socialApi.addComment,
  getActivityComments: socialApi.getActivityComments,
  deleteComment: socialApi.deleteComment,
  addReaction: socialApi.addReaction,
  removeReaction: socialApi.removeReaction,
  getActivityReactions: socialApi.getActivityReactions,
  getUserActivityReactions: socialApi.getUserActivityReactions,
  createConversation: socialApi.createConversation,
  getUserConversations: socialApi.getUserConversations,
  getConversationMessages: socialApi.getConversationMessages,
  sendMessage: socialApi.sendMessage,
  getConversationParticipants: socialApi.getConversationParticipants,
  createGroupConversation: socialApi.createGroupConversation,
  createChallenge: socialApi.createChallenge,
  joinChallenge: socialApi.joinChallenge,
  updateChallengeProgress: socialApi.updateChallengeProgress,
  getUserChallenges: socialApi.getUserChallenges,
  getPublicChallenges: socialApi.getPublicChallenges,
  getChallengeDetails: socialApi.getChallengeDetails,
  createChallengeTeam: socialApi.createChallengeTeam,
  joinChallengeTeam: socialApi.joinChallengeTeam,
  getChallengeTeams: socialApi.getChallengeTeams,
  getLeaderboard: socialApi.getLeaderboard,
  shareStats: socialApi.shareStats,
  createEvent: socialApi.createEvent,
  joinEvent: socialApi.joinEvent,
  createBadge: socialApi.createBadge,
  awardBadge: socialApi.awardBadge,
  getUserBadges: socialApi.getUserBadges,
  getUserLevel: socialApi.getUserLevel,
  addXP: socialApi.addXP,
  generatePartnerSuggestions: socialApi.generatePartnerSuggestions,
  getPartnerSuggestions: socialApi.getPartnerSuggestions,
  addActivityPhoto: socialApi.addActivityPhoto,
  getActivityPhotos: socialApi.getActivityPhotos,
  deleteActivityPhoto: socialApi.deleteActivityPhoto,
  getNotifications: socialApi.getNotifications,
  markNotificationAsRead: socialApi.markNotificationAsRead,
  markAllNotificationsAsRead: socialApi.markAllNotificationsAsRead,
  deleteNotification: socialApi.deleteNotification,

  // Explore endpoints
  createSegment: exploreApi.createSegment,
  getNearbySegments: exploreApi.getNearbySegments,
  getPublicSegments: exploreApi.getPublicSegments,
  getSegment: exploreApi.getSegment,
  getSegmentLeaderboard: exploreApi.getSegmentLeaderboard,
  createSegmentEffort: exploreApi.createSegmentEffort,
  getMySegmentEfforts: exploreApi.getMySegmentEfforts,
  createRoute: exploreApi.createRoute,
  getPublicRoutes: exploreApi.getPublicRoutes,
  getRoute: exploreApi.getRoute,
  addRouteToFavorites: exploreApi.addRouteToFavorites,
  removeRouteFromFavorites: exploreApi.removeRouteFromFavorites,
  useRoute: exploreApi.useRoute,
  getMyRoutes: exploreApi.getMyRoutes,
  getFavoriteRoutes: exploreApi.getFavoriteRoutes,
  getHeatmap: exploreApi.getHeatmap,
  getPopularLocations: exploreApi.getPopularLocations,

  // Metrics endpoints
  getPmc: metricsApi.getPmc, // Simple version without params - returns PmcDataPoint[]
  getTSS: metricsApi.calculateTSS, // Convenience alias
  recalculateMetrics: metricsApi.recalculateMetrics,
  getMetrics: metricsApi.getMetrics,
  checkOvertraining: metricsApi.checkOvertraining,
  calculateTSS: metricsApi.calculateTSS,

  // Onboarding endpoints
  getOnboardingStatus: onboardingApi.getOnboardingStatus,
  completeOnboardingStep: onboardingApi.completeOnboardingStep,
  getPreferences: onboardingApi.getPreferences,
  updatePreferences: onboardingApi.updatePreferences,
  updateWidgets: onboardingApi.updateWidgets,

  // Notifications endpoints
  getVapidKey: notificationsApi.getVapidKey,
  subscribePush: notificationsApi.subscribePush,
  unsubscribePush: notificationsApi.unsubscribePush,
  sendTestNotification: notificationsApi.sendTestNotification,

  // Race Planning endpoints
  calculateRacePlan: racePlanningApi.calculateRacePlan,

  // Weather endpoints
  getActivityWeather: weatherApi.getActivityWeather,

  // Share endpoints
  getActivityShareImage: shareApi.getActivityShareImage,
  downloadShareImage: shareApi.downloadShareImage,
  shareActivity: shareApi.shareActivity,
  copyActivityLink: shareApi.copyActivityLink,

  // User Constants endpoint
  getUserConstants: userConstantsApi.get,
};

// ============================================================================
// Export par défaut pour compatibilité
// ============================================================================

export default api;

// ============================================================================
// TODO: Migration Guide
// ============================================================================

/**
 * GUIDE DE MIGRATION vers la nouvelle architecture modulaire:
 * 
 * AVANT (ancien api.ts):
 *   import { api } from '@/lib/api';
 *   api.login(email, password);
 * 
 * APRÈS (nouvelle architecture):
 *   import { authApi } from '@/lib/api';
 *   authApi.login(email, password);
 * 
 * AVANTAGES de la nouvelle architecture:
 * 1. Tree-shaking: seul le code utilisé est chargé
 * 2. Meilleure organisation: un fichier = un domaine
 * 3. Tests plus faciles: mocking par module
 * 4. Maintenabilité: modifications locales
 * 
 * La rétrocompatibilité est maintenue via l'objet 'api' ci-dessus,
 * donc pas d'urgence à migrer le code existant.
 */
