export interface HRDataPoint {
  heartRate: number;
  timestamp: number;
}

export interface BluetoothHRState {
  hr: number | null;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
  isScanning: boolean;
}
export function useBluetoothHR(_onHR?: (_hr: number) => void): BluetoothHRState & {
  startScanning: () => void;
  stopScanning: () => void;
  disconnect: () => void;
  hrData: HRDataPoint | null;
  connect: () => void;
} {
  return {
    hr: null,
    hrData: null,
    isConnected: false,
    deviceName: null,
    error: null,
    isScanning: false,
    startScanning: () => {},
    stopScanning: () => {},
    disconnect: () => {},
    connect: () => {},
  };
}
