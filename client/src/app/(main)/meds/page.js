'use client';

import { useState } from 'react';
import {
  Pill,
  Check,
  Clock,
  Bell,
  Volume2,
  Calendar,
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

  // Compute adherence
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  medications.forEach((med) => {
    const parts = (med.dosagePattern || '1+0+1').split('+').map((s) => s.trim());
    const medLog = todayLogs[med.medicineName] || {};
    if (parts[0] && parts[0] !== '0') { totalDosesToday++; if (medLog.morning) takenDosesToday++; }
    if (parts[1] && parts[1] !== '0') { totalDosesToday++; if (medLog.noon) takenDosesToday++; }
    if (parts[2] && parts[2] !== '0') { totalDosesToday++; if (medLog.night) takenDosesToday++; }
  });

  const adherencePercentage =
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushStatusMessage('');
    try {
      await subscribeToWebPush(user?._id);
      setPushSubscribed(true);
      setPushStatusMessage('✓ Background Push Alarms successfully activated!');
    } catch (err) {
      setPushStatusMessage('Error: ' + (err.message || 'Could not enable Web Push.'));
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestInAppAlarm = (med) => {
    playClinicalChime();
    triggerAlarm(med || medications[0]);
  };

  const slotTabs = [
    { key: 'all', label: 'All Doses' },
    { key: 'morning', label: 'Morning (সকাল)' },
    { key: 'noon', label: 'Noon (দুপুর)' },
    { key: 'night', label: 'Night (রাত)' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 w-full">
      {/* Page editorial kicker */}
      <div className="pb-4 border-b border-divider mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Medication Adherence
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primaryText tracking-tight mt-1">
          Daily Medicine Checklist
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Mark each scheduled dose as taken and customize dual-mode chime &amp; background push alarms.
        </p>
      </div>

      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

        {/* ── Left Sidebar ── Adherence + Alarm Config */}
        <aside className="md:col-span-4 md:pr-8 md:border-r md:border-divider space-y-6 pb-8 md:pb-0">
          {/* Adherence Progress */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Today&apos;s Adherence
            </h2>
            <div className="border border-divider rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-secondaryText">
                  {takenDosesToday} of {totalDosesToday} scheduled doses taken
                </p>
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
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand h-full transition-all duration-500 rounded-full"
                  style={{ width: `${adherencePercentage}%` }}
                />
              </div>
              {totalDosesToday === 0 && (
                <p className="text-[11px] text-secondaryText text-center pt-1">
                  No medications active. Scan a prescription first.
                </p>
              )}
            </div>
          </section>

          {/* Dual-Mode Alarm Engine */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Dual-Mode Alarm Engine
            </h2>
            <div className="border border-divider rounded-lg p-4 space-y-4">
              {/* Mode 1: Chime Times */}
              <div>
                <label className="text-xs font-semibold text-primaryText block mb-2">
                  Mode 1 — In-App Chime Times
                </label>
                <div className="space-y-2">
                  {[
                    { slot: 'morning', label: 'Morning' },
                    { slot: 'noon', label: 'Noon' },
                    { slot: 'night', label: 'Night' },
                  ].map(({ slot, label }) => (
                    <div key={slot} className="flex items-center justify-between">
                      <span className="text-[11px] text-secondaryText w-16">{label}</span>
                      <input
                        type="time"
                        value={alarmTimes[slot]}
                        onChange={(e) => setAlarmTime(slot, e.target.value)}
                        className="text-xs p-1.5 rounded border border-divider bg-gray-50 text-primaryText font-mono flex-1 ml-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode 2: Web Push */}
              <div className="border-t border-divider pt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-primaryText block">
                      Mode 2 — Background Push
                    </label>
                    <p className="text-[11px] text-secondaryText mt-0.5 leading-relaxed">
                      Receive alerts even when the browser is closed.
                    </p>
                  </div>
                  {pushSubscribed && (
                    <span className="text-[10px] font-bold text-badge-inStockText bg-badge-inStockBg px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <button
                  onClick={handleEnablePush}
                  disabled={pushLoading || pushSubscribed}
                  className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    pushSubscribed
                      ? 'bg-gray-100 text-secondaryText cursor-default border border-divider'
                      : 'bg-brand text-white hover:bg-brand-hover active:opacity-90'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {pushLoading ? 'Subscribing...' : pushSubscribed ? 'Push Active' : 'Enable Push'}
                </button>
                {pushStatusMessage && (
                  <p className="text-[11px] text-center font-medium text-brand">{pushStatusMessage}</p>
                )}
              </div>
            </div>
          </section>
        </aside>

        {/* ── Right Column ── Medication Checklist */}
        <main className="md:col-span-8 md:pl-8 pt-6 md:pt-0">
          {/* Slot filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg text-xs mb-5">
            {slotTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSlotFilter(tab.key)}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                  activeSlotFilter === tab.key
                    ? 'bg-surface text-brand font-semibold border border-divider'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {medications.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-divider rounded-lg">
              <Pill className="w-10 h-10 text-secondaryText mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-primaryText">No active medications</p>
              <p className="text-xs text-secondaryText mt-1">
                Scan a prescription on the Home tab to populate your daily checklist.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-divider border border-divider rounded-lg overflow-hidden">
              {medications.map((med, index) => {
                const medLog = todayLogs[med.medicineName] || {};
                const patternParts = (med.dosagePattern || '1+0+1').split('+').map((s) => s.trim());
                const hasMorning = patternParts[0] && patternParts[0] !== '0';
                const hasNoon = patternParts[1] && patternParts[1] !== '0';
                const hasNight = patternParts[2] && patternParts[2] !== '0';

                // Apply slot filter
                if (activeSlotFilter === 'morning' && !hasMorning) return null;
                if (activeSlotFilter === 'noon' && !hasNoon) return null;
                if (activeSlotFilter === 'night' && !hasNight) return null;

                return (
                  <div key={med.medicineName + index} className="p-4 space-y-3 bg-surface">
                    {/* Row Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-primaryText">
                          {med.medicineName}{' '}
                          {med.strength && (
                            <span className="font-normal text-xs text-secondaryText">({med.strength})</span>
                          )}
                        </h3>
                        <p className="text-xs text-secondaryText mt-0.5">
                          {med.genericName} · {med.dosageForm || 'Tablet'}
                        </p>
                      </div>
                      <button
                        onClick={() => speakMedicine(med, 'bn')}
                        title="Listen in Bangla"
                        className="p-1.5 text-brand rounded border border-divider hover:bg-gray-50 text-xs flex items-center gap-1 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium font-bengali">শুনুন</span>
                      </button>
                    </div>

                    {/* Bengali instruction badge */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bengali font-semibold text-brand bg-brand-light px-2 py-0.5 rounded">
                        {med.instructionsBn || med.mealInstruction || 'খাবারের পরে'}
                      </span>
                      <span className="text-secondaryText">· {med.duration || '7 days'}</span>
                    </div>

                    {/* Dose Checklist Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { slot: 'morning', label: 'Morning', has: hasMorning, qty: patternParts[0], time: alarmTimes.morning, taken: medLog.morning },
                        { slot: 'noon', label: 'Noon', has: hasNoon, qty: patternParts[1], time: alarmTimes.noon, taken: medLog.noon },
                        { slot: 'night', label: 'Night', has: hasNight, qty: patternParts[2], time: alarmTimes.night, taken: medLog.night },
                      ].map(({ slot, label, has, qty, time, taken }) => (
                        <button
                          key={slot}
                          disabled={!has}
                          onClick={() => toggleDoseTaken(med.medicineName, slot)}
                          className={`py-2 px-2 rounded border text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                            !has
                              ? 'opacity-30 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : taken
                              ? 'bg-badge-inStockBg border-green-300 text-badge-inStockText font-semibold'
                              : 'border-divider bg-surface text-primaryText hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px]">
                            {taken ? <Check className="w-3 h-3 text-badge-inStockText" /> : <Clock className="w-3 h-3 text-secondaryText" />}
                            <span>{label}</span>
                          </div>
                          <span className="text-[10px] opacity-75 mt-0.5">
                            {has ? `${qty} tab · ${time}` : 'None'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Test alarm link */}
                    <div className="flex items-center justify-end pt-1 border-t border-divider">
                      <button
                        onClick={() => handleTestInAppAlarm(med)}
                        className="text-[11px] font-semibold text-alarm hover:underline flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" /> Test Chime
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
