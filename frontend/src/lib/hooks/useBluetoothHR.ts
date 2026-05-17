'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Bluetooth service and characteristic UUIDs for Heart Rate Monitor
 */
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';

/**
 * Heart Rate data from Bluetooth device
 */
export interface HRData {
  /** Current heart rate in beats per minute */
  heartRate: number;
  /** RR intervals in milliseconds (time between heartbeats) */
  rrIntervals: number[];
  /** Battery level percentage (0-100) or null if not available */
  batteryLevel: number | null;
  /** Name of the connected device */
  deviceName: string;
}

/**
 * Bluetooth device with GATT server
 */
interface BluetoothDeviceWithGATT extends BluetoothDevice {
  gatt: BluetoothRemoteGATTServer;
}

/**
 * Result from useBluetoothHR hook
 */
export interface UseBluetoothHRResult {
  /** Current heart rate data, or null if not connected */
  hrData: HRData | null;
  /** Whether a device is currently connected */
  isConnected: boolean;
  /** Whether the hook is currently scanning for devices */
  isScanning: boolean;
  /** Error message, or null if no error */
  error: string | null;
  /** Connect to a Bluetooth HR device */
  connect: () => Promise<void>;
  /** Disconnect from the current device */
  disconnect: () => void;
}

/**
 * Custom hook for managing Bluetooth Heart Rate Monitor connection.
 * 
 * Features:
 * - Scans for and connects to BLE HR monitors
 * - Reads heart rate and RR interval data
 * - Reads battery level if available
 * - Handles connection errors gracefully
 * - Provides connection state management
 * 
 * @returns Object with HR data, connection state, and control functions
 * 
 * @example
 * ```typescript
 * const { hrData, isConnected, error, connect, disconnect } = useBluetoothHR();
 * 
 * useEffect(() => {
 *   connect();
 *   return () => disconnect();
 * }, [connect, disconnect]);
 * 
 * if (isConnected && hrData) {
 *   console.log(`HR: ${hrData.heartRate} bpm`);
 * }
 * ```
 */
export function useBluetoothHR(): UseBluetoothHRResult {
  const [hrData, setHrData] = useState<HRData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Disconnect from the current device and reset state
   */
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setHrData(null);
  }, []);

  /**
   * Connect to a Bluetooth Heart Rate Monitor device
   */
  const connect = useCallback(async () => {
    // Check if Bluetooth API is available
    if (!navigator.bluetooth) {
      setError('Bluetooth non disponible sur cet appareil');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [BATTERY_SERVICE],
      }) as BluetoothDeviceWithGATT;

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setHrData(null);
      });

      // Connect to GATT server
      const server = await device.gatt.connect();

      // Get Heart Rate service and characteristic
      const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
      const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
      await hrChar.startNotifications();

      // Handle heart rate data
      hrChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value as DataView;
        if (!value) return;

        // Parse heart rate (first byte is flags)
        const flags = value.getUint8(0);
        const isUint16 = flags & 0x01;
        const hr = isUint16 ? value.getUint16(1, true) : value.getUint8(1);

        // Parse RR intervals if available
        const rrIntervals: number[] = [];
        let offset = isUint16 ? 3 : 2;
        while (offset + 2 <= value.byteLength && (flags & 0x10)) {
          const rr = value.getUint16(offset, true);
          if (rr > 0) rrIntervals.push(rr);
          offset += 2;
        }

        // Update heart rate data
        setHrData(prev => ({
          heartRate: hr,
          rrIntervals,
          batteryLevel: prev?.batteryLevel ?? null,
          deviceName: device.name || 'Cardio',
        }));
      });

      // Try to read battery level
      let batteryLevel: number | null = null;
      try {
        const battService = await server.getPrimaryService(BATTERY_SERVICE);
        const battChar = await battService.getCharacteristic(BATTERY_LEVEL);
        const battValue = await battChar.readValue();
        batteryLevel = battValue.getUint8(0);
      } catch {
        // Battery service is optional, ignore errors
      }

      // Initialize HR data with battery level
      setHrData(prev => ({
        heartRate: prev?.heartRate ?? 0,
        rrIntervals: [],
        batteryLevel,
        deviceName: device.name || 'Cardio',
      }));

      setIsConnected(true);
    } catch (err: unknown) {
      // Handle specific errors
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Aucun appareil sélectionné');
      } else if (err instanceof Error) {
        setError(err.message || 'Erreur de connexion');
      } else {
        setError('Erreur de connexion Bluetooth');
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
    hrData,
    isConnected,
    isScanning,
    error,
    connect,
    disconnect,
  };
}

export default useBluetoothHR;
