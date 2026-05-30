'use client';

interface CoachSession {
  id: string;
  name: string;
  type: string;
  duration: number;
  distance?: number;
  targetPace?: number;
  targetHeartRateZone?: { min: number; max: number };
  powerTarget?: number;
  intervalStructure?: Array<{ work: number; rest: number; repeats: number }>;
}

interface CoachSessionBannerProps {
  session: CoachSession;
  formatPace: (_speedKmh: number) => string;
}

export function CoachSessionBanner({ session, formatPace }: CoachSessionBannerProps) {
  return (
    <div className="mt-3 bg-surface rounded-lg px-3 py-2">
      <p className="text-sm font-medium text-foreground">{session.name}</p>
      {session.targetPace && (
        <p className="text-xs text-muted mt-0.5">Allure cible: {formatPace(60 / (session.targetPace / 60))}</p>
      )}
    </div>
  );
}
