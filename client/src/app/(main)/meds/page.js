'use client';

import { useState } from 'react';
import {
  Pill,
  Check,
  Clock,
  Bell,
  Volume2,
  Calendar,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore, getTodayKey } from '@/store/useAppStore';
import { playClinicalChime, subscribeToWebPush } from '@/lib/alarmManager';
import { speakMedicine } from '@/lib/voiceReader';

export default function MyMedsPage() {
  const {
    medications,
    doseLogs,
    toggleDoseTaken,
    alarmTimes,
    setAlarmTime,
    triggerAlarm,
    pushSubscribed,
    setPushSubscribed,
    user,
  } = useAppStore();

  const [activeSlotFilter, setActiveSlotFilter] = useState('all');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');

  const today = getTodayKey();
  const todayLogs = doseLogs[today] || {};

  // Compute adherence metrics
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  medications.forEach((med) => {
    const parts = (med.dosagePattern || '1+0+1').split('+').map((s) => s.trim());
    const medLog = todayLogs[med.medicineName] || {};

    if (parts[0] && parts[0] !== '0') {
      totalDosesToday++;
      if (medLog.morning) takenDosesToday++;
    }
    if (parts[1] && parts[1] !== '0') {
      totalDosesToday++;
      if (medLog.noon) takenDosesToday++;
    }
    if (parts[2] && parts[2] !== '0') {
      totalDosesToday++;
      if (medLog.night) takenDosesToday++;
    }
  });

  const adherencePercentage =
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  // Handle Mode 2 Background Web Push Subscription
  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushStatusMessage('');
    try {
      await subscribeToWebPush(user?._id);
      setPushSubscribed(true);
      setPushStatusMessage('✓ Background Push Alarms successfully activated!');
    } catch (err) {
      console.error('[WebPush Error]:', err);
      setPushStatusMessage('Error: ' + (err.message || 'Could not enable Web Push.'));
    } finally {
      setPushLoading(false);
    }
  };

  // Test Mode 1 in-app alarm trigger
  const handleTestInAppAlarm = (med) => {
    playClinicalChime();
    triggerAlarm(med || medications[0]);
  };

  return (
    <main className="w-full space-y-6">
      {/* Editorial Header */}
      <div className="pb-3 hairline-divider">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Medication Adherence
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        <h1 className="text-xl font-bold text-primaryText tracking-tight mt-1">
          Daily Medicine Checklist
        </h1>
        <p className="text-xs text-secondaryText mt-0.5">
          Mark each scheduled dose as taken and customize dual-mode chime & background push alarms.
        </p>
      </div>

      {/* Adherence Progress Card (Strict Hairline Design) */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primaryText">
              Today&apos;s Adherence
            </span>
            <p className="text-[11px] text-secondaryText mt-0.5">
              {takenDosesToday} of {totalDosesToday} scheduled doses taken
            </p>
          </div>
          <span
            className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
              adherencePercentage === 100
                ? 'bg-badge-inStockBg text-badge-inStockText'
                : 'bg-brand-light text-brand'
            }`}
          >
            {adherencePercentage}%
          </span>
        </div>

        {/* Adherence Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand h-full transition-all duration-500 rounded-full"
            style={{ width: `${adherencePercentage}%` }}
          />
        </div>
      </section>

      {/* Medication Slot Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs">
        {[
          { key: 'all', label: 'All Doses' },
          { key: 'morning', label: 'Morning (সকাল)' },
          { key: 'noon', label: 'Noon (দুপুর)' },
          { key: 'night', label: 'Night (রাত)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSlotFilter(tab.key)}
            className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
              activeSlotFilter === tab.key
                ? 'bg-surface text-brand font-semibold shadow-none border border-divider'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Checklist Rows */}
      <section className="space-y-3">
        {medications.map((med, index) => {
          const medLog = todayLogs[med.medicineName] || {};
          const patternParts = (med.dosagePattern || '1+0+1')
            .split('+')
            .map((s) => s.trim());
          const hasMorning = patternParts[0] && patternParts[0] !== '0';
          const hasNoon = patternParts[1] && patternParts[1] !== '0';
          const hasNight = patternParts[2] && patternParts[2] !== '0';

          return (
            <div
              key={med.medicineName + index}
              className="hairline-box rounded-xl p-4 bg-surface space-y-3"
            >
              {/* Row Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-primaryText">
                    {med.medicineName}{' '}
                    {med.strength && (
                      <span className="font-normal text-xs text-secondaryText">
                        ({med.strength})
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-secondaryText mt-0.5">
                    {med.genericName} • {med.dosageForm || 'Tablet'}
                  </p>
                </div>

                <button
                  onClick={() => speakMedicine(med, 'bn')}
                  title="Listen in Bangla"
                  className="p-1.5 text-brand rounded border border-divider hover:bg-gray-50 text-xs flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium font-bengali">শুনুন</span>
                </button>
              </div>

              {/* Meal & Duration Instruction */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bengali font-semibold text-brand bg-brand-light px-2 py-0.5 rounded">
                  {med.instructionsBn || med.mealInstruction || 'খাবারের পরে'}
                </span>
                <span className="text-secondaryText">• {med.duration || '7 days'}</span>
              </div>

              {/* Interactive Dose Checklist Buttons (Morning, Noon, Night) */}
              <div className="pt-2 hairline-divider-t grid grid-cols-3 gap-2">
                {/* Morning Slot */}
                <button
                  disabled={!hasMorning}
                  onClick={() => toggleDoseTaken(med.medicineName, 'morning')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                    !hasMorning
                      ? 'opacity-30 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : medLog.morning
                      ? 'bg-badge-inStockBg border-green-300 text-badge-inStockText font-semibold'
                      : 'border-divider bg-surface text-primaryText hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px]">
                    {medLog.morning ? (
                      <Check className="w-3 h-3 text-badge-inStockText" />
                    ) : (
                      <Clock className="w-3 h-3 text-secondaryText" />
                    )}
                    <span>Morning</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    {hasMorning ? `${patternParts[0]} tab • ${alarmTimes.morning}` : 'None'}
                  </span>
                </button>

                {/* Noon Slot */}
                <button
                  disabled={!hasNoon}
                  onClick={() => toggleDoseTaken(med.medicineName, 'noon')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                    !hasNoon
                      ? 'opacity-30 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : medLog.noon
                      ? 'bg-badge-inStockBg border-green-300 text-badge-inStockText font-semibold'
                      : 'border-divider bg-surface text-primaryText hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px]">
                    {medLog.noon ? (
                      <Check className="w-3 h-3 text-badge-inStockText" />
                    ) : (
                      <Clock className="w-3 h-3 text-secondaryText" />
                    )}
                    <span>Noon</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    {hasNoon ? `${patternParts[1]} tab • ${alarmTimes.noon}` : 'None'}
                  </span>
                </button>

                {/* Night Slot */}
                <button
                  disabled={!hasNight}
                  onClick={() => toggleDoseTaken(med.medicineName, 'night')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                    !hasNight
                      ? 'opacity-30 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : medLog.night
                      ? 'bg-badge-inStockBg border-green-300 text-badge-inStockText font-semibold'
                      : 'border-divider bg-surface text-primaryText hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px]">
                    {medLog.night ? (
                      <Check className="w-3 h-3 text-badge-inStockText" />
                    ) : (
                      <Clock className="w-3 h-3 text-secondaryText" />
                    )}
                    <span>Night</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-0.5">
                    {hasNight ? `${patternParts[2]} tab • ${alarmTimes.night}` : 'None'}
                  </span>
                </button>
              </div>

              {/* Quick Trigger Mode 1 In-App Alarm */}
              <div className="pt-2 hairline-divider-t flex items-center justify-between">
                <span className="text-[11px] text-secondaryText">
                  Test In-App Clinical Chime
                </span>
                <button
                  onClick={() => handleTestInAppAlarm(med)}
                  className="text-[11px] font-semibold text-alarm hover:underline flex items-center gap-1"
                >
                  <Bell className="w-3 h-3" /> Test Alarm
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dual-Mode Alarm Engine Configuration Box */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-4">
        <div className="flex items-start justify-between pb-2.5 hairline-divider">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Dual-Mode Alarm Engine
            </span>
            <h2 className="text-sm font-bold text-primaryText mt-0.5">
              Alarm Schedule & Push Setup
            </h2>
          </div>
          <Bell className="w-4 h-4 text-brand" />
        </div>

        {/* Mode 1: Customizable Alarm Times */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-primaryText block">
            Mode 1: Customizable In-App Chime Times
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-secondaryText block mb-1">Morning</span>
              <input
                type="time"
                value={alarmTimes.morning}
                onChange={(e) => setAlarmTime('morning', e.target.value)}
                className="w-full text-xs p-2 rounded border border-divider bg-gray-50 text-primaryText font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-secondaryText block mb-1">Noon</span>
              <input
                type="time"
                value={alarmTimes.noon}
                onChange={(e) => setAlarmTime('noon', e.target.value)}
                className="w-full text-xs p-2 rounded border border-divider bg-gray-50 text-primaryText font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-secondaryText block mb-1">Night</span>
              <input
                type="time"
                value={alarmTimes.night}
                onChange={(e) => setAlarmTime('night', e.target.value)}
                className="w-full text-xs p-2 rounded border border-divider bg-gray-50 text-primaryText font-mono"
              />
            </div>
          </div>
        </div>

        {/* Mode 2: Background / Closed Browser Web Push Notifications */}
        <div className="pt-3 hairline-divider-t space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <label className="text-xs font-semibold text-primaryText block">
                Mode 2: Background Web Push (Closed Browser)
              </label>
              <p className="text-[11px] text-secondaryText mt-0.5 leading-relaxed">
                Receive audible alarm alerts directly on your device even when this app is closed.
              </p>
            </div>
            {pushSubscribed && (
              <span className="text-[10px] font-bold text-badge-inStockText bg-badge-inStockBg px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            )}
          </div>

          <button
            onClick={handleEnablePush}
            disabled={pushLoading || pushSubscribed}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              pushSubscribed
                ? 'bg-gray-100 text-secondaryText cursor-default border border-divider'
                : 'bg-brand text-white hover:bg-brand-hover active:opacity-90'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {pushLoading
              ? 'Subscribing to VAPID Web Push...'
              : pushSubscribed
              ? 'Background Alarms Active'
              : 'Enable Background Alarms'}
          </button>

          {pushStatusMessage && (
            <p className="text-[11px] text-center font-medium text-brand">
              {pushStatusMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
