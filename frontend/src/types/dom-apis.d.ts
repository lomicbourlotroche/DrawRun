/**
 * Type declarations for non-standard Browser APIs used in DrawRun.
 *
 * - Battery Status API (navigator.getBattery)
 * - Screen Wake Lock API (navigator.wakeLock)
 */

// ============================================================================
// Battery Status API
// ============================================================================
// https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
}

interface Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

// ============================================================================
// Screen Wake Lock API
// ============================================================================
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API

interface WakeLockSentinel {
  release: () => Promise<void>;
  type: 'screen';
  released: boolean;
  onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null;
}

interface WakeLock {
  request: (type: 'screen') => Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: WakeLock;
}
