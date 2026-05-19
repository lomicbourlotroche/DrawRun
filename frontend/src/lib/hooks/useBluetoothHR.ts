export interface BluetoothHRState {
  hr: number | null;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
  isScanning: boolean;
}
export function useBluetoothHR(onHR?: (hr: number) => void): BluetoothHRState & {
  startScanning: () => void;
  stopScanning: () => void;
  disconnect: () => void;
} {
  return {
    hr: null,
    isConnected: false,
    deviceName: null,
    error: null,
    isScanning: false,
    startScanning: () => {},
    stopScanning: () => {},
    disconnect: () => {},
  };
}
