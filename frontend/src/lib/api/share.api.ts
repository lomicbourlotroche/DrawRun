/**
 * ============================================================
 * SHARE API
 * ============================================================
 * 
 * Génération et téléchargement d'images de partage d'activités
 * 
 * @module lib/api/share.api
 */

import { client } from './client';

/**
 * Get share image URL for an activity
 * @param activityId Activity ID
 * @returns Object URL for the image
 */
async function getActivityShareImage(activityId: number): Promise<string> {
  const response = await fetch(`${client.getBaseUrl()}/api/activities/${activityId}/share-image`, {
    headers: {
      'Authorization': `Bearer ${client.getToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate share image');
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Download share image
 * @param activityId Activity ID
 * @param filename Optional filename
 */
async function downloadShareImage(activityId: number, filename?: string): Promise<void> {
  const url = await getActivityShareImage(activityId);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `drawrun-activity-${activityId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up object URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Share activity via native share API
 * @param activityId Activity ID
 * @param activityTitle Activity title
 * @param activityData Activity stats (distance, duration)
 * @returns True if shared successfully
 */
async function shareActivity(
  activityId: number,
  activityTitle: string,
  activityData: {
    distance?: number;
    duration?: number;
  }
): Promise<boolean> {
  const shareUrl = `${window.location.origin}/app/activities/${activityId}`;
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const shareText = activityData.distance 
    ? `Regarde mon activité sur DrawRun ! ${(activityData.distance / 1000).toFixed(2)}km en ${formatDuration(activityData.duration || 0)}`
    : `Regarde mon activité "${activityTitle}" sur DrawRun !`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `DrawRun - ${activityTitle}`,
        text: shareText,
        url: shareUrl,
      });
      return true;
    } catch {
      // User cancelled or share failed
      return false;
    }
  }
  
  return false;
}

/**
 * Copy activity link to clipboard
 * @param activityId Activity ID
 */
async function copyActivityLink(activityId: number): Promise<void> {
  const shareUrl = `${window.location.origin}/app/activities/${activityId}`;
  await navigator.clipboard.writeText(shareUrl);
}

export const shareApi = {
  getActivityShareImage,
  downloadShareImage,
  shareActivity,
  copyActivityLink,
};
