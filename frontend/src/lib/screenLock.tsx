'use client';

import { useState, useCallback } from 'react';

interface ScreenLockOptions {
  onUnlock?: () => void;
}

export function useScreenLock({ onUnlock }: ScreenLockOptions = {}) {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => {
    setIsLocked(false);
    onUnlock?.();
  }, [onUnlock]);

  return { isLocked, lock, unlock };
}

export function ScreenLockOverlay({
  isLocked,
  onUnlock,
}: {
  isLocked: boolean;
  onUnlock: () => void;
}) {
  if (!isLocked) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 select-none touch-none"
      onClick={onUnlock}
      onDoubleClick={onUnlock}
    >
      <div className="text-center text-white px-8 animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-lg font-semibold">Écran verrouillé</p>
        <p className="text-sm text-white/60 mt-1">Tapez deux fois pour déverrouiller</p>
      </div>
    </div>
  );
}
