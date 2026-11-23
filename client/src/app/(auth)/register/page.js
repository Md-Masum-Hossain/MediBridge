'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ShieldCheck, AlertCircle, ArrowLeft, Store, User } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [role, setRole] = useState('patient'); // 'patient' | 'pharmacy_owner'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        role,
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
      console.error('[Register Error]:', err);
      setErrorMessage(err.message || 'Registration failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm mx-auto w-full space-y-5">
        {/* Top Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-secondaryText hover:text-primaryText font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        {/* Clinical Editorial Header */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded bg-brand text-white font-bold text-base flex items-center justify-center mx-auto mb-2">
            MB
          </div>
          <h1 className="text-xl font-bold text-primaryText tracking-tight">
            Create MediBridge Account
          </h1>
          <p className="text-xs text-secondaryText">
            Join as a Patient or registered Pharmacy Owner in Bangladesh.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setRole('patient')}
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
            onClick={() => setRole('pharmacy_owner')}
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

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="hairline-box rounded-xl p-5 bg-surface space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'pharmacy_owner' ? 'e.g. MediCare Dhanmondi Manager' : 'e.g. Rahim Ahmed'}
              className="w-full text-xs p-2.5 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@domain.com"
              className="w-full text-xs p-2.5 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1700-000000"
              className="w-full text-xs p-2.5 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primaryText block mb-1">
              Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
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
            <UserPlus className="w-4 h-4" />
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer Link to Login */}
        <p className="text-xs text-center text-secondaryText">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
