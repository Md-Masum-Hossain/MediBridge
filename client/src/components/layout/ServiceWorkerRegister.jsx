'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { playClinicalChime } from '@/lib/alarmManager';

export default function ServiceWorkerRegister() {
  const { hydrateAuth, medications, triggerAlarm, isAlarmSheetOpen } = useAppStore();

  useEffect(() => {
    // 1. Hydrate authentication from localStorage
    hydrateAuth();

    // 2. Register Service Worker for PWA & Web Push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[MediBridge PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[MediBridge PWA] Service Worker registration failed:', err);
        });
    }

    // 3. In-App Active Medication Alarm Checker (Runs every 30 seconds)
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check if any medication is due at this minute
      const dueMed = medications.find(
        (m) => m.isActive && (m.timings || []).includes(currentTimeStr)
      );

      if (dueMed && !isAlarmSheetOpen) {
        playClinicalChime();
        triggerAlarm(dueMed);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hydrateAuth, medications, triggerAlarm, isAlarmSheetOpen]);

  return null;
}
