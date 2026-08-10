/**
 * ============================================================
 * SHARE API
 * ============================================================
 *
 * Generation et telechargement d'images de partage d'activites
 * Support multi-tailles: small (512x512), medium (1080x1080), large (2048x2048)
 *
 * @module lib/api/share.api
 */

import { client } from './client';

// Available image sizes
export type ShareImageSize = 'small' | 'medium' | 'large';

export interface ShareStats {
  success: boolean;
  total_shares: number;
  shares_by_type: Array<{
    share_type: string;
    platform: string | null;
    count: number;
    last_shared: string | null;
  }>;
  activity_id: number;
}

export interface ShareEventParams {
  share_type: 'social' | 'link' | 'image' | 'story';
  platform?: 'twitter' | 'facebook' | 'instagram' | 'whatsapp' | 'native' | string;
}

/**
 * Get share image URL for an activity
 * @param activityId Activity ID
 * @param size Image size: 'small' (512x512), 'medium' (1080x1080), 'large' (2048x2048)
 * @param preview If true, returns image without download headers (default: false)
 * @returns Object URL for the image
 */
async function getActivityShareImage(
  activityId: number,
  size: ShareImageSize = 'medium',
  preview: boolean = false,
): Promise<string> {
  const endpoint = preview
    ? `/api/activities/${activityId}/share-image/preview`
    : `/api/activities/${activityId}/share-image`;

  const params = new URLSearchParams({ size, download: String(!preview) });

  const blob = await client.fetchBlob(`${endpoint}?${params.toString()}`);
  return URL.createObjectURL(blob);
}

/**
 * Get share image as base64 data URL
 * @param activityId Activity ID
 * @param size Image size
 * @returns Base64 data URL
 */
async function getShareImageAsBase64(activityId: number, size: ShareImageSize = 'medium'): Promise<string> {
  const url = await getActivityShareImage(activityId, size, true);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } else {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to create canvas context'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Download share image
 * @param activityId Activity ID
 * @param size Image size (default: 'medium')
 * @param filename Optional filename
 */
async function downloadShareImage(
  activityId: number,
  size: ShareImageSize = 'medium',
  filename?: string,
): Promise<void> {
  const url = await getActivityShareImage(activityId, size, false);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `drawrun-activity-${activityId}-${size}.png`;
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
  },
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
    ? `Regarde mon activite sur DrawRun ! ${(activityData.distance / 1000).toFixed(2)}km en ${formatDuration(activityData.duration || 0)}`
    : `Regarde mon activite "${activityTitle}" sur DrawRun !`;

  // Log the share event
  try {
    await logShareEvent(activityId, {
      share_type: 'social',
      platform: 'native',
    });
  } catch {
    // Silently fail - analytics should not block sharing
  }

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

  // Log the share event
  try {
    await logShareEvent(activityId, {
      share_type: 'link',
    });
  } catch {
    // Silently fail
  }
}

/**
 * Log a share event to the backend
 * @param activityId Activity ID
 * @param params Share event parameters
 */
async function logShareEvent(activityId: number, params: ShareEventParams): Promise<void> {
  await client.request(`/api/activities/${activityId}/share`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get share statistics for an activity
 * @param activityId Activity ID
 * @returns Share statistics
 */
async function getShareStats(activityId: number): Promise<ShareStats> {
  return client.request(`/api/activities/${activityId}/share/stats`);
}

/**
 * Open share modal with image preview
 * @param activityId Activity ID
 * @param activityTitle Activity title
 * @param activityData Activity stats
 * @param size Image size for preview
 */
async function openShareModal(
  activityId: number,
  activityTitle: string,
  activityData: {
    distance?: number;
    duration?: number;
  },
  size: ShareImageSize = 'medium',
): Promise<void> {
  const imageUrl = await getActivityShareImage(activityId, size, true);
  const shareUrl = `${window.location.origin}/app/activities/${activityId}`;

  // Create modal element dynamically with safe DOM APIs (not innerHTML)
  const closeModal = () => {
    modal.remove();
    URL.revokeObjectURL(imageUrl);
  };

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 20px; border-radius: 12px;
    max-width: 90%; max-height: 90vh; overflow-y: auto;
  `;

  const title = document.createElement('h2');
  title.style.cssText = 'margin: 0 0 20px 0; font-size: 1.5rem;';
  title.textContent = 'Partager cette activite';
  content.appendChild(title);

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Apercu du partage';
  img.style.cssText = 'width: 100%; max-width: 400px; margin: 0 auto 20px; display: block; border-radius: 8px;';
  content.appendChild(img);

  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copier le lien';
  copyBtn.style.cssText =
    'padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(shareUrl).then(() => alert('Lien copie !'));
  };
  btnGroup.appendChild(copyBtn);

  const openBtn = document.createElement('button');
  openBtn.textContent = 'Ouvrir le lien';
  openBtn.style.cssText =
    'padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;';
  openBtn.onclick = () => window.open(shareUrl, '_blank');
  btnGroup.appendChild(openBtn);

  content.appendChild(btnGroup);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fermer';
  closeBtn.style.cssText =
    'padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;';
  closeBtn.onclick = closeModal;
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

export const shareApi = {
  getActivityShareImage,
  getShareImageAsBase64,
  downloadShareImage,
  shareActivity,
  copyActivityLink,
  logShareEvent,
  getShareStats,
  openShareModal,
};
