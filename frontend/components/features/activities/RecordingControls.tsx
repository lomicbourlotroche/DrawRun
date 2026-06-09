'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, MapPin, Target, X, Save,
  Heart, BluetoothConnected, Flag, Lock, Camera, Zap,
  Eye, EyeOff,
} from '@/components/ui/icons';

type RecordingState = 'idle' | 'recording' | 'paused' | 'finished' | 'review';

interface RecordingControlsProps {
  state: RecordingState;
  permissionStatus: string;
  isScanning: boolean;
  hrConnected: boolean;
  intervalConfig: { work: number; rest: number; repeats: number } | null;
  gpsHighAccuracy: boolean;
  autoPauseEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onMarkLap: () => void;
  onTakePhoto: () => void;
  onConnectHR: () => void;
  onDisconnectHR: () => void;
  onLockScreen: () => void;
  onStartInterval: () => void;
  onCancel: () => void;
  onReview: () => void;
  onShowRoutePicker: () => void;
  onShowSegmentPicker: () => void;
  onToggleAutoPause: () => void;
}

export function RecordingControls({
  state, permissionStatus, isScanning, hrConnected, intervalConfig,
  gpsHighAccuracy, autoPauseEnabled,
  onStart, onPause, onResume, onStop, onMarkLap, onTakePhoto,
  onConnectHR, onDisconnectHR, onLockScreen, onStartInterval,
  onCancel, onReview, onShowRoutePicker, onShowSegmentPicker, onToggleAutoPause,
}: RecordingControlsProps) {
  return (
    <div className="px-4 pb-6 pt-3 bg-background border-t border-surface">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-6"
          >
            <button
              onClick={onShowRoutePicker}
              className="w-12 h-12 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
              aria-label="Sélectionner un itinéraire"
            >
              <MapPin className="w-5 h-5 text-muted" />
            </button>
            <button
              onClick={onStart}
              disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
              className="w-20 h-20 rounded-full bg-peak hover:bg-peak/90 active:bg-peak/80 disabled:opacity-50 flex items-center justify-center transition-colors"
              aria-label="Démarrer l'enregistrement"
            >
              <Play className="w-8 h-8 fill-white text-foreground ml-1" />
            </button>
            <button
              onClick={onShowSegmentPicker}
              className="w-12 h-12 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
              aria-label="Sélectionner un segment"
            >
              <Target className="w-5 h-5 text-muted" />
            </button>
          </motion.div>
        )}
        {state === 'recording' && (
          <motion.div
            key="recording-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-4"
          >
            {!hrConnected ? (
              <button
                onClick={onConnectHR}
                disabled={isScanning}
                className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover disabled:opacity-50 flex items-center justify-center transition-colors"
                aria-label="Connecter un capteur cardiaque"
              >
                <Heart className="w-4 h-4 text-muted" />
              </button>
            ) : (
              <button
                onClick={onDisconnectHR}
                className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
                title="Connecté"
                aria-label="Déconnecter le capteur cardiaque"
              >
                <BluetoothConnected className="w-4 h-4 text-muted" />
              </button>
            )}
            <button
              onClick={onMarkLap}
              className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
              aria-label="Marquer un tour"
            >
              <Flag className="w-4 h-4 text-muted" />
            </button>
            <button
              onClick={onPause}
              className="w-14 h-14 rounded-full bg-warning hover:bg-warning/90 active:bg-warning/80 flex items-center justify-center transition-colors"
              aria-label="Mettre en pause"
            >
              <Pause className="w-6 h-6 fill-white text-foreground" />
            </button>
            <button
              onClick={onStop}
              className="w-14 h-14 rounded-full bg-danger hover:bg-danger/90 active:bg-danger/80 flex items-center justify-center transition-colors"
              aria-label="Arrêter l'enregistrement"
            >
              <Square className="w-6 h-6 fill-white text-foreground" />
            </button>
            <button
              onClick={onLockScreen}
              className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
              aria-label="Verrouiller l'écran"
            >
              <Lock className="w-4 h-4 text-muted" />
            </button>
            <button
              onClick={onTakePhoto}
              className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
              aria-label="Prendre une photo"
            >
              <Camera className="w-4 h-4 text-muted" />
            </button>
            {!intervalConfig && (
              <button
                onClick={onStartInterval}
                className="w-10 h-10 rounded-full hover:bg-surface active:bg-surface-hover flex items-center justify-center transition-colors"
                aria-label="Démarrer un entraînement fractionné"
              >
                <Zap className="w-4 h-4 text-muted" />
              </button>
            )}
          </motion.div>
        )}
        {state === 'paused' && (
          <motion.div
            key="paused-controls"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-6"
          >
            <button
              onClick={onResume}
              className="w-16 h-16 rounded-full bg-peak hover:bg-peak/90 active:bg-peak/80 flex items-center justify-center transition-colors"
              aria-label="Reprendre l'enregistrement"
            >
              <Play className="w-7 h-7 fill-white text-foreground ml-1" />
            </button>
            <button
              onClick={onStop}
              className="w-16 h-16 rounded-full bg-danger hover:bg-danger/90 active:bg-danger/80 flex items-center justify-center transition-colors"
              aria-label="Arrêter l'enregistrement"
            >
              <Square className="w-7 h-7 fill-white text-foreground" />
            </button>
          </motion.div>
        )}
        {state === 'finished' && (
          <motion.div
            key="finished-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-center gap-3 w-full max-w-sm"
          >
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-lg bg-surface hover:bg-surface-hover active:bg-muted text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Supprimer
            </button>
            <button
              onClick={onReview}
              className="flex-1 h-12 rounded-lg bg-peak hover:bg-peak/90 active:bg-peak/80 text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Voir le résumé
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {state === 'recording' && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={onToggleAutoPause}
            className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
              autoPauseEnabled
                ? 'text-foreground bg-surface'
                : 'text-muted'
            }`}
          >
            {autoPauseEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Auto-pause
          </button>
          <span className="text-[10px] text-muted">
            {gpsHighAccuracy ? 'GPS haute précision' : 'GPS économie'}
          </span>
        </div>
      )}
    </div>
  );
}
