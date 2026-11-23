'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Pill, Store, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface hairline-divider-t max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActiveMatch
          ? item.isActiveMatch(pathname)
          : pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 transition-colors ${
              isActive ? 'text-brand font-semibold' : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>

            {/* Framer Motion Active Indicator (NO AI-slop, clean hairline pill) */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute -top-1.5 w-8 h-0.5 bg-brand rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
