'use client';

import { useState, useEffect, useCallback } from 'react';

const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';

interface HRData {
  heartRate: number;
  rrIntervals: number[];
  batteryLevel: number | null;
  deviceName: string;
}

export function useBluetoothHR() {
  const [hrData, setHrData] = useState<HRData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setHrData(null);
  }, []);

  const connect = useCallback(async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setError('Bluetooth non disponible sur cet appareil');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [BATTERY_SERVICE],
      });

      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setHrData(null);
      });

      const server = await device.gatt.connect();

      const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
      const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
      await hrChar.startNotifications();

      hrChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as any;
        const value = target.value as DataView;
        if (!value) return;
        const flags = value.getUint8(0);
        const isUint16 = flags & 0x01;
        const hr = isUint16 ? value.getUint16(1, true) : value.getUint8(1);

        const rrIntervals: number[] = [];
        let offset = isUint16 ? 3 : 2;
        while (offset + 2 <= value.byteLength && (flags & 0x10)) {
          const rr = value.getUint16(offset, true);
          if (rr > 0) rrIntervals.push(rr);
          offset += 2;
        }

        setHrData(prev => ({
          heartRate: hr,
          rrIntervals,
          batteryLevel: prev?.batteryLevel ?? null,
          deviceName: device.name || 'Cardio',
        }));
      });

      let batteryLevel: number | null = null;
      try {
        const battService = await server.getPrimaryService(BATTERY_SERVICE);
        const battChar = await battService.getCharacteristic(BATTERY_LEVEL);
        const battValue = await battChar.readValue();
        batteryLevel = battValue.getUint8(0);
      } catch { /* battery service optional */ }

      setHrData(prev => ({
        heartRate: prev?.heartRate ?? 0,
        rrIntervals: [],
        batteryLevel,
        deviceName: device.name || 'Cardio',
      }));

      setIsConnected(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Aucun appareil sélectionné');
      } else {
        setError((err as Error).message || 'Erreur de connexion');
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

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
