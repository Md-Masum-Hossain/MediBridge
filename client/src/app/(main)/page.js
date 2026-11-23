'use client';

import Link from 'next/link';
import { Pill, Store, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import PrescriptionScanner from '@/components/scanner/PrescriptionScanner';
import { useAppStore } from '@/store/useAppStore';

export default function HomePage() {
  const { medications, alarmTimes } = useAppStore();
  const totalMeds = medications.length;

  // Compute next upcoming alarm slot
  const nextDue = (() => {
    if (totalMeds === 0) return null;
    const now = new Date();
    const slots = [
      { label: 'Morning', time: alarmTimes.morning },
      { label: 'Noon', time: alarmTimes.noon },
      { label: 'Night', time: alarmTimes.night },
    ];
    const [hNow, mNow] = [now.getHours(), now.getMinutes()];
    const upcoming = slots.find(({ time }) => {
      const [h, m] = time.split(':').map(Number);
      return h > hNow || (h === hNow && m > mNow);
    });
    return upcoming || slots[0];
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 w-full">
      {/* Page-level editorial kicker */}
      <div className="pb-4 border-b border-divider mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Clinical AI Digitization
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            DGDA Validated
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primaryText tracking-tight mt-1">
          Smart Prescription Assistant
        </h1>
        <p className="text-xs text-secondaryText mt-1 leading-relaxed max-w-xl">
          Upload handwritten or printed prescriptions to extract medicines, set scheduled reminders,
          and locate nearby pharmacies in Dhaka.
        </p>
      </div>

      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* ── Left Sidebar (desktop col-span-5) ── */}
        <aside className="md:col-span-5 md:pr-8 md:border-r md:border-divider space-y-6 pb-6 md:pb-0">
          {/* Today's Active Regimen Panel */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText">
                Today&apos;s Active Regimen
              </h2>
              <Link
                href="/meds"
                className="text-[11px] font-semibold text-brand flex items-center gap-1 hover:underline"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {totalMeds === 0 ? (
              <div className="py-8 text-center border border-dashed border-divider rounded-lg">
                <Pill className="w-8 h-8 text-secondaryText mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-primaryText">No active medications</p>
                <p className="text-[11px] text-secondaryText mt-1">
                  Scan a prescription to begin tracking your regimen.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-divider border border-divider rounded-lg overflow-hidden">
                {/* Stat row */}
                <div className="grid grid-cols-2 divide-x divide-divider">
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-[11px] text-secondaryText">
                      <Pill className="w-3.5 h-3.5 text-brand" />
                      Active Medicines
                    </div>
                    <p className="text-lg font-bold text-primaryText mt-0.5">
                      {totalMeds}{' '}
                      <span className="text-xs font-normal text-secondaryText">Prescribed</span>
                    </p>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-[11px] text-secondaryText">
                      <Clock className="w-3.5 h-3.5 text-alarm" />
                      Next Due
                    </div>
                    <p className="text-lg font-bold text-primaryText mt-0.5">
                      {nextDue ? (
                        <>
                          {nextDue.time}{' '}
                          <span className="text-xs font-normal text-secondaryText">
                            ({nextDue.label})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-normal text-secondaryText">—</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Medicine list preview */}
                {medications.slice(0, 4).map((med, i) => (
                  <div key={med._id || i} className="px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-primaryText">{med.medicineName}</p>
                      <p className="text-[11px] text-secondaryText">
                        {med.dosagePattern} · {med.mealInstruction || med.instructionsBn}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-brand bg-brand-light px-2 py-0.5 rounded">
                      {med.duration || ''}
                    </span>
                  </div>
                ))}
                {medications.length > 4 && (
                  <div className="px-3 py-2 text-[11px] text-secondaryText text-center">
                    +{medications.length - 4} more medicines
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Quick link to pharmacies */}
          <section className="border-t border-divider pt-4 flex items-center justify-between">
            <span className="text-[11px] text-secondaryText">Need to purchase medicines?</span>
            <Link
              href="/pharmacies"
              className="text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded flex items-center gap-1 hover:bg-brand hover:text-white transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Check Local Stock
            </Link>
          </section>
        </aside>

        {/* ── Right Column (desktop col-span-7) — Scanner ── */}
        <main className="md:col-span-7 md:pl-8 pt-6 md:pt-0">
          <PrescriptionScanner />
        </main>
      </div>
    </div>
  );
}
