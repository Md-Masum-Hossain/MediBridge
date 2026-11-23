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
  Clock,
  ChevronRight,
  ExternalLink,
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

  // Fetch saved prescriptions from API on mount
  useEffect(() => {
    async function loadPrescriptions() {
      setIsLoadingRx(true);
      try {
        const response = await api.get('/prescriptions');
        if (response?.data) {
          setPrescriptions(response.data);
        }
      } catch (err) {
        console.warn('[Profile] Failed to fetch prescriptions from server:', err);
      } finally {
        setIsLoadingRx(false);
      }
    }
    loadPrescriptions();
  }, [setPrescriptions]);

  const handleQuickDemoLogin = (role = 'patient') => {
    if (role === 'pharmacy_owner') {
      setUser(
        {
          _id: 'demo-owner-id',
          name: 'MediCare Express Dhanmondi Manager',
          email: 'owner.dhanmondi@medibridge.com',
          role: 'pharmacy_owner',
          phone: '+880 1711-223344',
        },
        'demo-jwt-token-owner'
      );
    } else {
      setUser(
        {
          _id: 'demo-patient-id',
          name: 'Rahim Ahmed (Patient)',
          email: 'patient@medibridge.com',
          role: 'patient',
          phone: '+880 1700-112233',
        },
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
    <main className="w-full space-y-5">
      {/* Editorial Header */}
      <div className="pb-3 hairline-divider">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            User Account &amp; Settings
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Verified Profile
          </span>
        </div>
        <h1 className="text-xl font-bold text-primaryText tracking-tight mt-1">
          Profile &amp; Clinical Records
        </h1>
        <p className="text-xs text-secondaryText mt-0.5">
          View digitized prescription history, adjust alarm preferences, or manage pharmacy inventory.
        </p>
      </div>

      {/* User Information Card */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-3">
        {isAuthenticated && user ? (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
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
                    <span className="text-[11px] text-secondaryText font-mono">
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="py-1 px-2.5 rounded border border-divider text-xs text-secondaryText hover:text-red-700 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-secondaryText mb-3">
              Sign in to automatically sync your prescriptions and medication alarms across devices.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/login"
                className="py-2 px-4 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
              <Link
                href="/register"
                className="py-2 px-4 rounded-lg border border-divider text-primaryText text-xs font-medium hover:bg-gray-50"
              >
                Register
              </Link>
            </div>

            {/* Quick Demo Autofill Bar */}
            <div className="mt-4 pt-3 hairline-divider-t text-[11px] text-secondaryText flex items-center justify-center gap-2">
              <span>Quick Demo:</span>
              <button
                onClick={() => handleQuickDemoLogin('patient')}
                className="text-brand font-semibold hover:underline"
              >
                Patient
              </button>
              <span>•</span>
              <button
                onClick={() => handleQuickDemoLogin('pharmacy_owner')}
                className="text-brand font-semibold hover:underline"
              >
                Pharmacy Owner
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Pharmacy Owner Stock Portal Quick Access Banner */}
      {user?.role === 'pharmacy_owner' && (
        <section className="hairline-box rounded-xl p-4 bg-brand-light/40 border-brand/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-brand font-bold text-xs uppercase tracking-wider">
              <Store className="w-4 h-4" />
              <span>Pharmacy Owner Dashboard</span>
            </div>
            <p className="text-xs text-primaryText font-medium mt-1">
              Live Stock Toggle &amp; Inventory Management
            </p>
          </div>
          <Link
            href="/pharmacy-portal"
            className="py-2 px-3 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover"
          >
            Open Portal <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}

      {/* Saved Prescriptions History */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-3">
        <div className="flex items-center justify-between pb-2 hairline-divider">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText">
              Saved Prescriptions ({prescriptions.length})
            </h2>
          </div>
          <span className="text-[11px] text-secondaryText">Cloud Archive</span>
        </div>

        {isLoadingRx ? (
          <p className="text-xs text-secondaryText text-center py-4">Loading clinical history...</p>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-6 text-xs text-secondaryText">
            <p className="font-semibold text-primaryText">No saved prescriptions yet.</p>
            <p className="mt-1">Prescriptions scanned on the Home tab will be archived here.</p>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {prescriptions.map((rx, idx) => (
              <div key={rx._id || idx} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-primaryText">
                      {rx.doctorInfo?.name || 'Dr. Md. Rafiqul Islam'}
                    </h4>
                    <p className="text-[11px] text-secondaryText mt-0.5">
                      {rx.doctorInfo?.hospitalOrClinic || 'Square Hospitals, Dhaka'} •{' '}
                      {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded">
                    {rx.medicines?.length || 0} Medicines
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
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
      </section>

      {/* App Preferences (Audio & Language) */}
      <section className="hairline-box rounded-xl p-4 bg-surface space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText pb-2 hairline-divider">
          Preferences &amp; Accessibility
        </h2>

        {/* Audio Chime Toggle */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-primaryText">Clinical Sound Chime</span>
            <p className="text-[11px] text-secondaryText">Play chime when medicine reminder triggers</p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              soundEnabled ? 'bg-brand' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Language Selection */}
        <div className="pt-2 hairline-divider-t flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-primaryText">Voice &amp; Instruction Language</span>
            <p className="text-[11px] text-secondaryText">English vs বাংলা উচ্চারণ ও নির্দেশাবলী</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2 py-1 rounded text-xs font-medium font-bengali ${
                language === 'bn' ? 'bg-surface text-brand font-bold' : 'text-secondaryText'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded text-xs font-medium ${
                language === 'en' ? 'bg-surface text-brand font-bold' : 'text-secondaryText'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Web Push Status */}
        <div className="pt-2 hairline-divider-t flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-primaryText">Background Notifications</span>
            <p className="text-[11px] text-secondaryText">Web Push notifications when browser is closed</p>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushSubscribed}
            className={`py-1 px-2.5 rounded text-[11px] font-semibold ${
              pushSubscribed
                ? 'bg-badge-inStockBg text-badge-inStockText cursor-default'
                : 'bg-brand text-white hover:bg-brand-hover'
            }`}
          >
            {pushSubscribed ? 'Active' : 'Enable'}
          </button>
        </div>
      </section>
    </main>
  );
}
