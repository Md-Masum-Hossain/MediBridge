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
  StopCircle,
  PlayCircle,
  Trash2,
  Download,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore, getTodayKey } from '@/store/useAppStore';
import { playClinicalChime, subscribeToWebPush } from '@/lib/alarmManager';
import { speakMedicine } from '@/lib/voiceReader';
import { generateRegimenPdf } from '@/lib/pdfGenerator';

export default function MyMedsPage() {
  const {
    medications,
    prescriptions,
    doseLogs,
    toggleDoseTaken,
    alarmTimes,
    setAlarmTime,
    triggerAlarm,
    pushSubscribed,
    setPushSubscribed,
    user,
    stopOrResumeMedication,
    removeMedication,
  } = useAppStore();

  const [activeSlotFilter, setActiveSlotFilter] = useState('all');
  // 'active' | 'stopped'
  const [statusFilter, setStatusFilter] = useState('active');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');
  // Track in-flight actions: { [key]: 'stopping'|'removing' }
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState('');

  const today = getTodayKey();
  const todayLogs = doseLogs[today] || {};

  // ── Build a flat enriched medication list with prescriptionId & index ──────
  // We derive from prescriptions store (source of truth) so indices remain correct.
  const enrichedMeds = prescriptions.flatMap((rx) =>
    (rx.medicines || []).map((med, idx) => ({
      ...med,
      _prescriptionId: String(rx._id),
      _medIndex: idx,
    }))
  );

  // Fall back to plain medications array when no prescriptions are loaded yet
  const medsSource =
    enrichedMeds.length > 0
      ? enrichedMeds
      : medications.map((m, i) => ({ ...m, _prescriptionId: null, _medIndex: i }));

  // ── Filtered views ────────────────────────────────────────────────────────
  const activeMeds = medsSource.filter((m) => (m.status || 'active') === 'active');
  const stoppedMeds = medsSource.filter((m) => m.status === 'stopped');
  const displayMeds = statusFilter === 'stopped' ? stoppedMeds : activeMeds;

  // ── Adherence (only active meds) ─────────────────────────────────────────
  let totalDosesToday = 0;
  let takenDosesToday = 0;

  activeMeds.forEach((med) => {
    const parts = (med.dosagePattern || '1+0+1').split('+').map((s) => s.trim());
    const medLog = todayLogs[med.medicineName] || {};
    if (parts[0] && parts[0] !== '0') { totalDosesToday++; if (medLog.morning) takenDosesToday++; }
    if (parts[1] && parts[1] !== '0') { totalDosesToday++; if (medLog.noon) takenDosesToday++; }
    if (parts[2] && parts[2] !== '0') { totalDosesToday++; if (medLog.night) takenDosesToday++; }
  });

  const adherencePercentage =
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    triggerAlarm(med || medsSource[0]);
  };

  const handleStopResume = async (med) => {
    if (!med._prescriptionId) {
      setActionError('Cannot update — prescription not loaded from server.');
      return;
    }
    const key = `${med._prescriptionId}-${med._medIndex}`;
    setActionLoading((p) => ({ ...p, [key]: 'toggling' }));
    setActionError('');
    try {
      await stopOrResumeMedication(med._prescriptionId, med._medIndex);
    } catch (err) {
      setActionError(err.message || 'Failed to update medicine status.');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const handleRemove = async (med) => {
    if (!med._prescriptionId) {
      setActionError('Cannot remove — prescription not loaded from server.');
      return;
    }
    if (!confirm(`Remove "${med.medicineName}" from this prescription? This cannot be undone.`)) return;
    const key = `${med._prescriptionId}-${med._medIndex}`;
    setActionLoading((p) => ({ ...p, [key]: 'removing' }));
    setActionError('');
    try {
      await removeMedication(med._prescriptionId, med._medIndex);
    } catch (err) {
      setActionError(err.message || 'Failed to remove medicine.');
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const handleDownloadPdf = () => {
    generateRegimenPdf(activeMeds);
  };

  // ── Tab definitions ───────────────────────────────────────────────────────
  const slotTabs = [
    { key: 'all', label: 'All Doses' },
    { key: 'morning', label: 'Morning (সকাল)' },
    { key: 'noon', label: 'Noon (দুপুর)' },
    { key: 'night', label: 'Night (রাত)' },
  ];

  const statusTabs = [
    { key: 'active', label: 'Active', count: activeMeds.length },
    { key: 'stopped', label: 'Stopped', count: stoppedMeds.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 w-full">
      {/* Page editorial kicker */}
      <div className="pb-4 border-b border-divider mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Medication Adherence
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-secondaryText flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            {/* Download Regimen PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={activeMeds.length === 0}
              title="Download active regimen as PDF"
              className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[11px] font-semibold transition-colors ${
                activeMeds.length === 0
                  ? 'border-divider text-secondaryText opacity-40 cursor-not-allowed'
                  : 'border-brand text-brand hover:bg-brand hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Download Regimen PDF
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primaryText tracking-tight mt-1">
          Daily Medicine Checklist
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Mark each scheduled dose as taken. Stop or remove medications, and download your active
          regimen any time.
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
                  No active medications. Scan a prescription first.
                </p>
              )}
            </div>
          </section>

          {/* Stopped medications summary */}
          {stoppedMeds.length > 0 && (
            <section>
              <div className="border border-divider rounded-lg p-3 flex items-center gap-2 bg-gray-50">
                <StopCircle className="w-4 h-4 text-secondaryText shrink-0" />
                <p className="text-[11px] text-secondaryText leading-snug">
                  <span className="font-semibold text-primaryText">{stoppedMeds.length}</span> medication
                  {stoppedMeds.length !== 1 ? 's' : ''} stopped — view in the{' '}
                  <button
                    className="underline text-brand font-semibold"
                    onClick={() => setStatusFilter('stopped')}
                  >
                    Stopped
                  </button>{' '}
                  tab.
                </p>
              </div>
            </section>
          )}

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

          {/* Global action error */}
          {actionError && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {actionError}
            </div>
          )}

          {/* Active / Stopped status filter tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-divider">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`pb-2 px-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                  statusFilter === tab.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-secondaryText hover:text-primaryText'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === tab.key
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-secondaryText'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

            {/* Slot filter — only on Active tab */}
            {statusFilter === 'active' && (
              <div className="ml-auto flex items-center gap-1 p-1 bg-gray-100 rounded-lg text-xs">
                <Filter className="w-3 h-3 text-secondaryText ml-1" />
                {slotTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSlotFilter(tab.key)}
                    className={`py-1 px-2 rounded-md font-medium transition-all ${
                      activeSlotFilter === tab.key
                        ? 'bg-surface text-brand font-semibold border border-divider'
                        : 'text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Empty state */}
          {displayMeds.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-divider rounded-lg">
              <Pill className="w-10 h-10 text-secondaryText mx-auto mb-3 opacity-30" />
              {statusFilter === 'stopped' ? (
                <>
                  <p className="text-sm font-semibold text-primaryText">No stopped medications</p>
                  <p className="text-xs text-secondaryText mt-1">
                    Medications you stop will appear here — your history is preserved.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-primaryText">No active medications</p>
                  <p className="text-xs text-secondaryText mt-1">
                    Scan a prescription on the Home tab to populate your daily checklist.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-divider border border-divider rounded-lg overflow-hidden">
              {displayMeds.map((med) => {
                const medLog = todayLogs[med.medicineName] || {};
                const patternParts = (med.dosagePattern || '1+0+1').split('+').map((s) => s.trim());
                const hasMorning = patternParts[0] && patternParts[0] !== '0';
                const hasNoon = patternParts[1] && patternParts[1] !== '0';
                const hasNight = patternParts[2] && patternParts[2] !== '0';
                const isStopped = med.status === 'stopped';
                const actionKey = `${med._prescriptionId}-${med._medIndex}`;
                const isToggling = actionLoading[actionKey] === 'toggling';
                const isRemoving = actionLoading[actionKey] === 'removing';
                const isLoading = isToggling || isRemoving;

                // Apply slot filter (only relevant on Active tab)
                if (statusFilter === 'active') {
                  if (activeSlotFilter === 'morning' && !hasMorning) return null;
                  if (activeSlotFilter === 'noon' && !hasNoon) return null;
                  if (activeSlotFilter === 'night' && !hasNight) return null;
                }

                return (
                  <div
                    key={actionKey + med.medicineName}
                    className={`p-4 space-y-3 bg-surface ${isStopped ? 'opacity-70' : ''}`}
                  >
                    {/* Row Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-primaryText">
                            {med.medicineName}{' '}
                            {med.strength && (
                              <span className="font-normal text-xs text-secondaryText">({med.strength})</span>
                            )}
                          </h3>
                          {isStopped && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-secondaryText border border-divider">
                              Stopped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondaryText mt-0.5 truncate">
                          {med.genericName} · {med.dosageForm || 'Tablet'}
                        </p>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Listen */}
                        {!isStopped && (
                          <button
                            onClick={() => speakMedicine(med, 'bn')}
                            title="Listen in Bangla"
                            className="p-1.5 text-brand rounded border border-divider hover:bg-gray-50 text-xs flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium font-bengali">শুনুন</span>
                          </button>
                        )}

                        {/* Stop / Resume */}
                        {med._prescriptionId && (
                          <button
                            onClick={() => handleStopResume(med)}
                            disabled={isLoading}
                            title={isStopped ? 'Resume medication' : 'Stop medication'}
                            className={`p-1.5 rounded border text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                              isStopped
                                ? 'border-brand text-brand hover:bg-brand hover:text-white'
                                : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isToggling ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                            ) : isStopped ? (
                              <PlayCircle className="w-3.5 h-3.5" />
                            ) : (
                              <StopCircle className="w-3.5 h-3.5" />
                            )}
                            {isStopped ? 'Resume' : 'Stop'}
                          </button>
                        )}

                        {/* Remove */}
                        {med._prescriptionId && (
                          <button
                            onClick={() => handleRemove(med)}
                            disabled={isLoading}
                            title="Remove medication permanently"
                            className={`p-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isRemoving ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bengali instruction badge */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bengali font-semibold text-brand bg-brand-light px-2 py-0.5 rounded">
                        {med.instructionsBn || med.mealInstruction || 'খাবারের পরে'}
                      </span>
                      <span className="text-secondaryText">· {med.duration || '7 days'}</span>
                    </div>

                    {/* Dose Checklist Buttons — only for active meds */}
                    {!isStopped && (
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
                    )}

                    {/* Stopped message */}
                    {isStopped && (
                      <p className="text-[11px] text-secondaryText italic">
                        This medication has been stopped. Reminders are disabled.
                      </p>
                    )}

                    {/* Test alarm link (active only) */}
                    {!isStopped && (
                      <div className="flex items-center justify-end pt-1 border-t border-divider">
                        <button
                          onClick={() => handleTestInAppAlarm(med)}
                          className="text-[11px] font-semibold text-alarm hover:underline flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" /> Test Chime
                        </button>
                      </div>
                    )}
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
