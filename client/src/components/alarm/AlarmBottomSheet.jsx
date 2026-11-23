'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function AlarmBottomSheet() {
  const { isAlarmSheetOpen, activeAlarm, dismissAlarm } = useAppStore();

  if (!isAlarmSheetOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-surface w-full max-w-md rounded-t-2xl p-6 shadow-2xl hairline-divider-t"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-alarm">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primaryText">Medication Due</h3>
              <p className="text-xs text-secondaryText">Scheduled Dose Reminder</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6 border border-divider">
            <p className="font-semibold text-primaryText">
              {activeAlarm?.medicineName || 'Napa Extra 500mg'}
            </p>
            <p className="text-xs text-secondaryText mt-0.5">
              Dosage: {activeAlarm?.dosagePattern || '1+0+1'} • After Meal
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={dismissAlarm}
              className="py-3 px-4 rounded-xl border border-divider text-secondaryText font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
            >
              <Clock className="w-4 h-4" />
              Snooze (10m)
            </button>
            <button
              onClick={dismissAlarm}
              className="py-3 px-4 rounded-xl bg-brand text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-hover shadow-sm"
            >
              <Check className="w-4 h-4" />
              Taken
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
