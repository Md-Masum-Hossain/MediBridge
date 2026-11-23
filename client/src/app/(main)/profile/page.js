'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Store,
  FileText,
  Bell,
  Volume2,
  LogOut,
  LogIn,
  FileDown,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { generatePrescriptionPdf } from '@/lib/pdfGenerator';
import { speakPrescriptionList } from '@/lib/voiceReader';
import { subscribeToWebPush } from '@/lib/alarmManager';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    logout,
    setUser,
    prescriptions,
    setPrescriptions,
    soundEnabled,
    setSoundEnabled,
    language,
    setLanguage,
    pushSubscribed,
    setPushSubscribed,
  } = useAppStore();

  const [isLoadingRx, setIsLoadingRx] = useState(false);
  const [pushStatus, setPushStatus] = useState('');

  useEffect(() => {
    async function loadPrescriptions() {
      setIsLoadingRx(true);
      try {
        const response = await api.get('/prescriptions');
        if (response?.data) setPrescriptions(response.data);
      } catch (err) {
        console.warn('[Profile] Failed to fetch prescriptions:', err);
      } finally {
        setIsLoadingRx(false);
      }
    }
    loadPrescriptions();
  }, [setPrescriptions]);

  const handleQuickDemoLogin = (role = 'patient') => {
    if (role === 'pharmacy_owner') {
      setUser(
        { _id: 'demo-owner-id', name: 'MediCare Express Dhanmondi Manager', email: 'owner.dhanmondi@medibridge.com', role: 'pharmacy_owner', phone: '+880 1711-223344' },
        'demo-jwt-token-owner'
      );
    } else {
      setUser(
        { _id: 'demo-patient-id', name: 'Rahim Ahmed (Patient)', email: 'patient@medibridge.com', role: 'patient', phone: '+880 1700-112233' },
        'demo-jwt-token-patient'
      );
    }
  };

  const handleEnablePush = async () => {
    try {
      await subscribeToWebPush(user?._id);
      setPushSubscribed(true);
      setPushStatus('Background push enabled!');
    } catch (err) {
      setPushStatus(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 w-full">
      {/* Page editorial kicker */}
      <div className="pb-4 border-b border-divider mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            User Account &amp; Settings
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Verified Profile
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primaryText tracking-tight mt-1">
          Profile &amp; Clinical Records
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          View digitized prescription history, adjust alarm preferences, or manage pharmacy inventory.
        </p>
      </div>

      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

        {/* ── Left Sidebar ── User card + Preferences */}
        <aside className="md:col-span-4 md:pr-8 md:border-r md:border-divider space-y-6 pb-8 md:pb-0">

          {/* User Card */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Account
            </h2>
            <div className="border border-divider rounded-lg p-4">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-primaryText">{user.name}</h3>
                      <p className="text-xs text-secondaryText">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand text-white">
                          {user.role === 'pharmacy_owner' ? 'Pharmacy Owner' : 'Patient'}
                        </span>
                        {user.phone && (
                          <span className="text-[11px] text-secondaryText font-mono">{user.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-divider pt-3">
                    <button
                      onClick={logout}
                      className="w-full py-1.5 px-2 rounded border border-divider text-xs text-secondaryText hover:text-red-700 flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-xs text-secondaryText">
                    Sign in to sync prescriptions and alarms across devices.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Link href="/login" className="py-2 px-4 rounded bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover">
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </Link>
                    <Link href="/register" className="py-2 px-4 rounded border border-divider text-primaryText text-xs font-medium hover:bg-gray-50">
                      Register
                    </Link>
                  </div>
                  <div className="border-t border-divider pt-3 text-[11px] text-secondaryText">
                    <span className="block mb-1">Quick Demo:</span>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleQuickDemoLogin('patient')} className="text-brand font-semibold hover:underline">
                        Patient
                      </button>
                      <span>·</span>
                      <button onClick={() => handleQuickDemoLogin('pharmacy_owner')} className="text-brand font-semibold hover:underline">
                        Pharmacy Owner
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Pharmacy Owner Portal Banner */}
          {user?.role === 'pharmacy_owner' && (
            <section>
              <div className="border border-brand/30 bg-brand-light/40 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-brand font-bold text-xs uppercase tracking-wider">
                    <Store className="w-4 h-4" />
                    Owner Dashboard
                  </div>
                  <p className="text-xs text-primaryText font-medium mt-1">
                    Live Stock Toggle &amp; Inventory
                  </p>
                </div>
                <Link
                  href="/pharmacy-portal"
                  className="py-2 px-3 rounded bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover"
                >
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>
          )}

          {/* Preferences */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Preferences &amp; Accessibility
            </h2>
            <div className="border border-divider rounded-lg divide-y divide-divider">
              {/* Sound toggle */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-primaryText">Clinical Sound Chime</span>
                  <p className="text-[11px] text-secondaryText">Play chime on reminder trigger</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${soundEnabled ? 'bg-brand' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Language */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-primaryText">Voice Language</span>
                  <p className="text-[11px] text-secondaryText">English vs বাংলা instructions</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded">
                  <button
                    onClick={() => setLanguage('bn')}
                    className={`px-2 py-1 rounded text-xs font-medium font-bengali ${language === 'bn' ? 'bg-surface text-brand font-bold' : 'text-secondaryText'}`}
                  >বাংলা</button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded text-xs font-medium ${language === 'en' ? 'bg-surface text-brand font-bold' : 'text-secondaryText'}`}
                  >English</button>
                </div>
              </div>

              {/* Web Push */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-primaryText">Background Push</span>
                  <p className="text-[11px] text-secondaryText">Alerts when browser is closed</p>
                </div>
                <button
                  onClick={handleEnablePush}
                  disabled={pushSubscribed}
                  className={`py-1 px-2.5 rounded text-[11px] font-semibold ${pushSubscribed ? 'bg-badge-inStockBg text-badge-inStockText cursor-default' : 'bg-brand text-white hover:bg-brand-hover'}`}
                >
                  {pushSubscribed ? 'Active' : 'Enable'}
                </button>
              </div>
            </div>
            {pushStatus && <p className="text-[11px] text-brand mt-2 text-center">{pushStatus}</p>}
          </section>
        </aside>

        {/* ── Right Column ── Prescription History */}
        <main className="md:col-span-8 md:pl-8 pt-6 md:pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText">
                Saved Prescriptions ({prescriptions.length})
              </h2>
            </div>
            <span className="text-[11px] text-secondaryText">Cloud Archive</span>
          </div>

          {isLoadingRx ? (
            <p className="text-xs text-secondaryText text-center py-8">Loading clinical history...</p>
          ) : prescriptions.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-divider rounded-lg">
              <FileText className="w-10 h-10 text-secondaryText mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-primaryText">No saved prescriptions yet.</p>
              <p className="text-xs text-secondaryText mt-1">
                Prescriptions scanned on the Home tab will be archived here.
              </p>
            </div>
          ) : (
            <div className="border border-divider rounded-lg overflow-hidden divide-y divide-divider">
              {prescriptions.map((rx, idx) => (
                <div key={rx._id || idx} className="p-4 bg-surface space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-primaryText">
                        {rx.doctorInfo?.name || 'Dr. Md. Rafiqul Islam'}
                      </h4>
                      <p className="text-[11px] text-secondaryText mt-0.5">
                        {rx.doctorInfo?.hospitalOrClinic || 'Square Hospitals, Dhaka'} ·{' '}
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded">
                      {rx.medicines?.length || 0} Medicines
                    </span>
                  </div>

                  {/* Medicine name chips */}
                  {rx.medicines && rx.medicines.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rx.medicines.slice(0, 5).map((m, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-secondaryText rounded">
                          {m.medicineName}
                        </span>
                      ))}
                      {rx.medicines.length > 5 && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-secondaryText rounded">
                          +{rx.medicines.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-divider">
                    <button
                      onClick={() => generatePrescriptionPdf(rx)}
                      className="py-1 px-2.5 rounded border border-divider text-[11px] font-medium text-primaryText flex items-center gap-1 hover:bg-gray-50"
                    >
                      <FileDown className="w-3 h-3 text-brand" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => speakPrescriptionList(rx.medicines, 'bn')}
                      className="py-1 px-2.5 rounded border border-divider text-[11px] font-medium text-primaryText flex items-center gap-1 hover:bg-gray-50"
                    >
                      <Volume2 className="w-3 h-3 text-brand" />
                      Listen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
