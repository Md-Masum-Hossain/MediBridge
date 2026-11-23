'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, AlertCircle, ArrowLeft, Store, User } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [role, setRole] = useState('patient'); // 'patient' | 'pharmacy_owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });

      if (response?.token && response?.user) {
        setUser(response.user, response.token);

        if (response.user.role === 'pharmacy_owner') {
          router.push('/pharmacy-portal');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      console.error('[Login Error]:', err);
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = (targetRole) => {
    setRole(targetRole);
    if (targetRole === 'pharmacy_owner') {
      setEmail('owner.dhanmondi@medibridge.com');
      setPassword('password123');
    } else {
      setEmail('patient@medibridge.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm mx-auto w-full space-y-5">
        {/* Top Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-secondaryText hover:text-primaryText font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Scanner
        </Link>

        {/* Clinical Editorial Header */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded bg-brand text-white font-bold text-base flex items-center justify-center mx-auto mb-2">
            MB
          </div>
          <h1 className="text-xl font-bold text-primaryText tracking-tight">
            MediBridge Sign In
          </h1>
          <p className="text-xs text-secondaryText">
            Access synchronized prescriptions and medication reminder alarms.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemoFill('patient')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
              role === 'patient'
                ? 'bg-surface text-brand font-semibold shadow-none border border-divider'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Patient
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoFill('pharmacy_owner')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
              role === 'pharmacy_owner'
                ? 'bg-surface text-brand font-semibold shadow-none border border-divider'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Pharmacy Owner
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container (Strict Hairline Box) */}
        <form onSubmit={handleLogin} className="hairline-box rounded-xl p-5 bg-surface space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient@medibridge.com"
              className="w-full text-xs p-2.5 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-brand text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-brand-hover active:opacity-90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-3 hairline-divider-t text-center space-y-1.5">
            <span className="text-[10px] text-secondaryText block uppercase tracking-wider font-semibold">
              Instant Demo Autofill
            </span>
            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('patient')}
                className="text-brand font-semibold hover:underline"
              >
                Patient Demo
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('pharmacy_owner')}
                className="text-brand font-semibold hover:underline"
              >
                Pharmacy Owner Demo
              </button>
            </div>
          </div>
        </form>

        {/* Footer Link to Register */}
        <p className="text-xs text-center text-secondaryText">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
