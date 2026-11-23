'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, Volume2, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { playClinicalChime, stopClinicalChime } from '@/lib/alarmManager';
import { speakMedicine, stopVoiceReadout } from '@/lib/voiceReader';

export default function AlarmBottomSheet() {
  const {
    isAlarmSheetOpen,
    activeAlarm,
    dismissAlarm,
    snoozeAlarm,
    toggleDoseTaken,
    soundEnabled,
  } = useAppStore();

  useEffect(() => {
    if (isAlarmSheetOpen && soundEnabled) {
      playClinicalChime();
    }
    return () => {
      stopClinicalChime();
      stopVoiceReadout();
    };
  }, [isAlarmSheetOpen, soundEnabled]);

  if (!isAlarmSheetOpen || !activeAlarm) return null;

  const handleTaken = () => {
    stopClinicalChime();
    stopVoiceReadout();
    // Determine slot based on current time or default to morning
    const hour = new Date().getHours();
    const slot = hour < 12 ? 'morning' : hour < 17 ? 'noon' : 'night';
    toggleDoseTaken(activeAlarm.medicineName, slot);
    dismissAlarm();
  };

  const handleSnooze = () => {
    stopClinicalChime();
    stopVoiceReadout();
    snoozeAlarm(10);
  };

  const handleVoiceListen = () => {
    speakMedicine(activeAlarm, 'bn');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end justify-center p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="bg-surface w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 hairline-box shadow-none border-b-0 sm:border-b"
        >
          {/* Top Grab Handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-alarm-light text-alarm flex items-center justify-center">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-alarm">
                  Scheduled Dose Alert
                </span>
                <h3 className="text-lg font-bold text-primaryText leading-snug">
                  Time for Medication
                </h3>
              </div>
            </div>
            <button
              onClick={dismissAlarm}
              className="p-1 text-secondaryText hover:text-primaryText rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clinical Medicine Details (Hairline Box) */}
          <div className="hairline-box rounded-lg p-4 mb-5 bg-[#FAFAFA]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-base text-primaryText">
                  {activeAlarm.medicineName}{' '}
                  {activeAlarm.strength && (
                    <span className="font-normal text-sm text-secondaryText">
                      ({activeAlarm.strength})
                    </span>
                  )}
                </h4>
                <p className="text-xs text-secondaryText mt-0.5">
                  {activeAlarm.genericName || 'Active Pharmaceutical Ingredient'} •{' '}
                  {activeAlarm.dosageForm || 'Tablet'}
                </p>
              </div>
              <button
                onClick={handleVoiceListen}
                title="Listen in Bangla"
                className="p-2 rounded border border-divider hover:bg-gray-100 text-brand"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 hairline-divider-t text-xs">
              <div>
                <span className="text-secondaryText text-[10px] uppercase font-medium">Dosage</span>
                <p className="font-semibold text-primaryText mt-0.5">
                  {activeAlarm.dosagePattern || '1+0+1'}
                </p>
              </div>
              <div>
                <span className="text-secondaryText text-[10px] uppercase font-medium">
                  Meal Instruction
                </span>
                <p className="font-semibold text-primaryText mt-0.5">
                  {activeAlarm.mealInstruction || 'After Meal'}
                </p>
              </div>
            </div>

            {activeAlarm.instructionsBn && (
              <div className="mt-2.5 pt-2 hairline-divider-t">
                <p className="text-xs font-bengali text-brand font-medium">
                  {activeAlarm.instructionsBn}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons: Snooze & Taken */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSnooze}
              className="py-3 px-4 rounded-lg border border-divider text-primaryText font-medium text-xs flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Clock className="w-4 h-4 text-secondaryText" />
              Snooze (10m)
            </button>
            <button
              onClick={handleTaken}
              className="py-3 px-4 rounded-lg bg-brand text-white font-medium text-xs flex items-center justify-center gap-2 hover:bg-brand-hover active:opacity-95 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark as Taken
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
