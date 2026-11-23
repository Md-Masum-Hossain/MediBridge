'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, X, Camera, Pill, Store, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { label: 'Scan', href: '/', icon: Camera },
  { label: 'My Meds', href: '/meds', icon: Pill },
  {
    label: 'Pharmacies',
    href: '/pharmacies',
    icon: Store,
    isActiveMatch: (p) => p.startsWith('/pharmaci') || p.startsWith('/pharmacy'),
  },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const { medications, triggerAlarm } = useAppStore();

  const dueItems = (medications || []).slice(0, 3);

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface border-b border-divider">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between w-full">
          {/* Minimal Typographic Wordmark */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192x192.png"
              alt="MediBridge Logo"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base text-brand tracking-tight leading-none">
                MediBridge
              </span>
              <span className="text-[10px] text-secondaryText tracking-widest uppercase font-medium mt-0.5">
                Clinical PWA
              </span>
            </div>
          </div>

          {/* Desktop Nav Tabs — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 ml-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActiveMatch
                ? item.isActiveMatch(pathname)
                : pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-brand bg-brand-light'
                      : 'text-secondaryText hover:text-primaryText hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Live Notification Bell with Unread Dot */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="p-2 rounded-full hover:bg-gray-100 text-secondaryText transition-colors relative flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-primaryText" />
              {dueItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-surface animate-pulse" />
              )}
            </button>

            {/* Minimal Clinical Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-surface border border-divider rounded-lg p-3 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-divider mb-2">
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
                  {dueItems.length === 0 ? (
                    <p className="text-xs text-secondaryText text-center py-2">
                      No active medications. Scan a prescription to begin.
                    </p>
                  ) : (
                    dueItems.map((med, idx) => (
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
                    ))
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-divider text-center">
                  <span className="text-[10px] text-secondaryText">
                    Dual-mode background push active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
