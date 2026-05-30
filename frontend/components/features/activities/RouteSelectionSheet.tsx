'use client';

interface Route {
  id: string;
  name: string;
  description?: string;
  polyline: string;
  distance: number;
  elevationGain: number;
}

interface RouteSelectionSheetProps {
  userRoutes: Route[];
  loadingRoutes: boolean;
  onSelect: (_route: Route) => void;
  onClose: () => void;
  formatDistance: (_meters: number) => string;
}

export function RouteSelectionSheet({ userRoutes, loadingRoutes, onSelect, onClose, formatDistance }: RouteSelectionSheetProps) {
  return (
    <div className="space-y-2">
      {loadingRoutes && <p className="text-center text-muted">Chargement...</p>}
      {!loadingRoutes && userRoutes.length === 0 && (
        <p className="text-center text-muted py-8">Aucun parcours enregistré</p>
      )}
      {userRoutes.map(route => (
        <button
          type="button"
          key={route.id}
          onClick={() => onSelect(route)}
          className="w-full text-left p-3 rounded-lg hover:bg-surface transition-colors"
        >
          <p className="font-medium text-foreground">{route.name}</p>
          <p className="text-sm text-muted mt-0.5">
            {formatDistance(route.distance)} · {Math.round(route.elevationGain)}m D+
          </p>
        </button>
      ))}
      <button onClick={onClose} className="w-full min-w-[120px] h-12 rounded-lg bg-surface hover:bg-surface-hover text-foreground text-sm font-medium transition-colors">Retour</button>
    </div>
  );
}
