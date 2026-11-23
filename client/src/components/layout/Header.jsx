'use client';

import { Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-surface hairline-divider px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg">
          M
        </div>
        <span className="font-bold text-lg text-brand tracking-tight">MediBridge</span>
      </div>
      <button
        aria-label="Notifications"
        className="p-2 rounded-full hover:bg-gray-100 text-secondaryText transition-colors"
      >
        <Bell className="w-5 h-5" />
      </button>
    </header>
  );
}
