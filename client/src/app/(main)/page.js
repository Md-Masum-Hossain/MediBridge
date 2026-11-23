'use client';

import Link from 'next/link';
import { Pill, Store, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import PrescriptionScanner from '@/components/scanner/PrescriptionScanner';
import { useAppStore } from '@/store/useAppStore';

export default function HomePage() {
  const { prescriptions, medications } = useAppStore();

  const totalMeds = medications.length;

  return (
    <main className="w-full space-y-6">
      {/* Editorial Header */}
      <div className="pb-3 hairline-divider">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Clinical AI Digitization
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            DGDA Validated
          </span>
        </div>
        <h1 className="text-xl font-bold text-primaryText tracking-tight mt-1">
          Smart Prescription Assistant
        </h1>
        <p className="text-xs text-secondaryText mt-0.5 leading-relaxed">
          Upload handwritten or printed prescriptions to extract medicines, set scheduled reminders, and locate nearby pharmacies in Dhaka.
        </p>
      </div>

      {/* Core AI Prescription Scanner Component */}
      <PrescriptionScanner />

      {/* Quick Summary Section (Hairline Divided) */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-3">
        <div className="flex items-center justify-between pb-2 hairline-divider">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText">
            Today&apos;s Active Regimen
          </h2>
          <Link
            href="/meds"
            className="text-[11px] font-semibold text-brand flex items-center gap-1 hover:underline"
          >
            Manage Meds <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-gray-50 rounded-lg border border-divider">
            <div className="flex items-center gap-1.5 text-secondaryText text-[11px]">
              <Pill className="w-3.5 h-3.5 text-brand" />
              <span>Active Medicines</span>
            </div>
            <p className="text-base font-bold text-primaryText mt-1">
              {totalMeds} Prescribed
            </p>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-lg border border-divider">
            <div className="flex items-center gap-1.5 text-secondaryText text-[11px]">
              <Clock className="w-3.5 h-3.5 text-alarm" />
              <span>Next Due</span>
            </div>
            <p className="text-base font-bold text-primaryText mt-1">
              20:30 (Night)
            </p>
          </div>
        </div>

        <div className="pt-2 hairline-divider-t flex items-center justify-between">
          <span className="text-[11px] text-secondaryText">
            Need to purchase medicines?
          </span>
          <Link
            href="/pharmacies"
            className="text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded flex items-center gap-1 hover:bg-brand hover:text-white transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            Check Local Stock
          </Link>
        </div>
      </section>
    </main>
  );
}
