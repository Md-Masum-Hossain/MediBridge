'use client';

import Link from 'next/link';
import { Camera, Pill, Store, User } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { label: 'Scan', href: '/', icon: Camera },
    { label: 'My Meds', href: '/meds', icon: Pill },
    { label: 'Pharmacies', href: '/pharmacy', icon: Store },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface hairline-divider-t max-w-md mx-auto flex items-center justify-around py-2.5 shadow-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 text-xs text-secondaryText hover:text-brand transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
