'use client';

import { useState } from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { medications, triggerAlarm, activeAlarm } = useAppStore();

  const dueItems = (medications || []).slice(0, 3);

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface hairline-divider px-4 py-3.5 flex items-center justify-between max-w-md mx-auto w-full">
        {/* Minimal Typographic Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand flex items-center justify-center text-white font-bold text-sm tracking-wide">
            MB
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-brand tracking-tight leading-none">
              MediBridge
            </span>
            <span className="text-[10px] text-secondaryText tracking-widest uppercase font-medium mt-0.5">
              Clinical PWA
            </span>
          </div>
        </div>

        {/* Live Notification Bell with Unread Dot */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-gray-100 text-secondaryText transition-colors relative flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-primaryText" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-surface animate-pulse" />
          </button>

          {/* Minimal Clinical Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-surface hairline-box rounded-lg p-3 z-50 text-left">
              <div className="flex items-center justify-between pb-2 hairline-divider mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primaryText">
                  Medication Reminders
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-secondaryText hover:text-primaryText"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {dueItems.map((med, idx) => (
                  <div
                    key={med._id || idx}
                    className="p-2 bg-gray-50 rounded border border-divider text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-primaryText">{med.medicineName}</p>
                      <p className="text-[11px] text-secondaryText">
                        {med.dosagePattern} • {med.mealInstruction}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        triggerAlarm(med);
                        setShowNotifications(false);
                      }}
                      className="text-[11px] px-2 py-1 bg-brand text-white rounded font-medium hover:bg-brand-hover"
                    >
                      Trigger
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 hairline-divider-t text-center">
                <span className="text-[10px] text-secondaryText">
                  Dual-mode background push active
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
