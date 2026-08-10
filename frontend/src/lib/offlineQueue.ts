const STORAGE_KEY = 'drawrun_recording_checkpoint';
const QUEUE_KEY = 'drawrun_save_queue';

export interface RecordingCheckpoint {
  points: Array<{ gps: RawPoint; timestamp: number }>;
  stats: {
    distance: number;
    duration: number;
    elapsedTime: number;
    elevationGain: number;
    elevationLoss: number;
  };
  activityType: string;
  activityName: string;
  laps: LapData[];
  timestamp: number;
}

interface RawPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LapData {
  number: number;
  startTime: number;
  endTime: number | null;
  distance: number;
  duration: number;
}

export interface QueuedSave {
  gpxData: string;
  name: string;
  type: string;
  timestamp: number;
  retries: number;
}

export function saveCheckpoint(data: RecordingCheckpoint): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

export function loadCheckpoint(): RecordingCheckpoint | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    clearCheckpoint();
    return null;
  }
}

export function clearCheckpoint(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function enqueueSave(save: QueuedSave): void {
  try {
    const queue = getSaveQueue();
    queue.push(save);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* quota exceeded */ }
}

export function getSaveQueue(): QueuedSave[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

export function removeFromQueue(index: number): void {
  const queue = getSaveQueue();
  queue.splice(index, 1);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function processSaveQueue(
  importFn: (_name: string, _gpx: string, _type: string) => Promise<unknown>
): Promise<{ success: number; failed: number }> {
  const queue = getSaveQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  let i = 0;
  while (i < queue.length) {
    const item = queue[i];
    try {
      await importFn(item.name, item.gpxData, item.type);
      removeFromQueue(i);
      success++;
    } catch {
      item.retries++;
      if (item.retries >= 3) {
        removeFromQueue(i);
      } else {
        i++;
      }
      failed++;
    }
  }

  return { success, failed };
}
