'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import PharmacyCard from '@/components/pharmacy/PharmacyCard';

// Popular Dhaka preset locations for instant testing
const DHAKA_PRESETS = [
  { name: 'Dhanmondi', lat: 23.7461, lng: 90.3756 },
  { name: 'Uttara', lat: 23.8732, lng: 90.3984 },
  { name: 'Mirpur', lat: 23.8071, lng: 90.3688 },
  { name: 'Mohammadpur', lat: 23.7588, lng: 90.3625 },
];

export default function PharmaciesPage() {
  const {
    userCoordinates,
    setUserCoordinates,
    nearbyPharmacies,
    setNearbyPharmacies,
    medications,
    selectedFilterMeds,
    setSelectedFilterMeds,
  } = useAppStore();

  const [latitude, setLatitude] = useState(userCoordinates?.[1] || 23.7461);
  const [longitude, setLongitude] = useState(userCoordinates?.[0] || 90.3756);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newMedInput, setNewMedInput] = useState('');

  // Target medicines to check stock for
  const [activeMeds, setActiveMeds] = useState(
    selectedFilterMeds && selectedFilterMeds.length > 0
      ? selectedFilterMeds
      : ['Napa Extra', 'Seclo 20', 'Monas 10', 'Sergel 20', 'Azith 500']
  );

  // 1. Detect User GPS or fallback
  const detectUserGps = useCallback(() => {
    setIsDetectingGps(true);
    setErrorMessage('');

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setUserCoordinates([lng, lat]);
          setIsDetectingGps(false);
        },
        (err) => {
          console.warn('[GPS Fallback]: Using Dhanmondi, Dhaka coordinates:', err.message);
          // Fallback to Dhanmondi, Dhaka
          setLatitude(23.7461);
          setLongitude(90.3756);
          setUserCoordinates([90.3756, 23.7461]);
          setIsDetectingGps(false);
        },
        { timeout: 7000 }
      );
    } else {
      setIsDetectingGps(false);
    }
  }, [setUserCoordinates]);

  // 2. Fetch Nearby Pharmacies with Live Stock Match
  const fetchNearbyPharmacies = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await api.get('/pharmacies/nearby', {
        params: {
          lat: latitude,
          lng: longitude,
          maxDistance: 25000,
          medicineNames: activeMeds.join(','),
        },
      });

      if (response?.data) {
        setNearbyPharmacies(response.data);
      }
    } catch (err) {
      console.error('[NearbyPharmacies Error]:', err);
      setErrorMessage(err.message || 'Failed to fetch nearby pharmacies.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, activeMeds, setNearbyPharmacies]);

  useEffect(() => {
    detectUserGps();
  }, [detectUserGps]);

  useEffect(() => {
    fetchNearbyPharmacies();
  }, [fetchNearbyPharmacies]);

  // Add / Remove medicine from query
  const handleAddMedicine = (e) => {
    e.preventDefault();
    const clean = newMedInput.trim();
    if (clean && !activeMeds.includes(clean)) {
      const updated = [...activeMeds, clean];
      setActiveMeds(updated);
      setSelectedFilterMeds(updated);
      setNewMedInput('');
    }
  };

  const handleRemoveMedicine = (medName) => {
    const updated = activeMeds.filter((m) => m !== medName);
    setActiveMeds(updated);
    setSelectedFilterMeds(updated);
  };

  const handleSelectPreset = (preset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setUserCoordinates([preset.lng, preset.lat]);
  };

  return (
    <main className="w-full space-y-5">
      {/* Editorial Header */}
      <div className="pb-3 hairline-divider">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Live Proximity Stock Match
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            DGDA Licensed
          </span>
        </div>
        <h1 className="text-xl font-bold text-primaryText tracking-tight mt-1">
          Nearby Registered Pharmacies
        </h1>
        <p className="text-xs text-secondaryText mt-0.5 leading-relaxed">
          Real-time stock availability and distance calculated via MongoDB 2dsphere proximity index.
        </p>
      </div>

      {/* GPS Location & Dhaka Hub Selector Box */}
      <section className="hairline-box rounded-xl p-3.5 bg-surface space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-primaryText font-medium">
            <MapPin className="w-4 h-4 text-brand" />
            <span>Current Search Center:</span>
            <span className="font-mono text-[11px] text-secondaryText">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>

          <button
            onClick={detectUserGps}
            disabled={isDetectingGps}
            className="text-[11px] font-semibold text-brand flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
            {isDetectingGps ? 'Detecting...' : 'Detect GPS'}
          </button>
        </div>

        {/* Quick Hub Presets for testing distance across Dhaka */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 hairline-divider-t text-xs">
          <span className="text-[10px] text-secondaryText uppercase tracking-wider font-semibold mr-1">
            Dhaka Hubs:
          </span>
          {DHAKA_PRESETS.map((hub) => (
            <button
              key={hub.name}
              onClick={() => handleSelectPreset(hub)}
              className={`py-1 px-2.5 rounded-full text-[11px] font-medium border transition-colors ${
                Math.abs(latitude - hub.lat) < 0.01 && Math.abs(longitude - hub.lng) < 0.01
                  ? 'bg-brand text-white border-brand'
                  : 'bg-gray-50 border-divider text-secondaryText hover:text-primaryText'
              }`}
            >
              {hub.name}
            </button>
          ))}
        </div>
      </section>

      {/* Target Medicines Filter Bar */}
      <section className="hairline-box rounded-xl p-3.5 bg-surface space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-primaryText">
            Matching Stock For ({activeMeds.length} Items)
          </label>
          <span className="text-[10px] text-secondaryText">Tap &apos;x&apos; to remove</span>
        </div>

        {/* Active Medicine Badges */}
        <div className="flex flex-wrap gap-1.5">
          {activeMeds.map((med) => (
            <span
              key={med}
              className="text-xs px-2.5 py-1 rounded-full bg-brand-light text-brand font-medium flex items-center gap-1.5 border border-brand/20"
            >
              <span>{med}</span>
              <button
                onClick={() => handleRemoveMedicine(med)}
                className="hover:text-red-700 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add another medicine input */}
        <form onSubmit={handleAddMedicine} className="pt-2 hairline-divider-t flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-secondaryText absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Add another medicine (e.g. Napa, Sergel, Fexo)..."
              value={newMedInput}
              onChange={(e) => setNewMedInput(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-3 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover active:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
      </section>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pharmacies List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-secondaryText">
            Results ({nearbyPharmacies.length})
          </span>
          <span className="text-[11px] text-secondaryText">
            Sorted by Proximity &amp; Stock Match
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-secondaryText flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand animate-spin" />
            <span>Scanning local pharmacy stock catalogs...</span>
          </div>
        ) : nearbyPharmacies.length === 0 ? (
          <div className="hairline-box rounded-xl p-8 text-center text-xs text-secondaryText">
            <p className="font-semibold text-primaryText">No pharmacies found nearby.</p>
            <p className="mt-1">Try expanding search radius or switching to another Dhaka hub.</p>
          </div>
        ) : (
          nearbyPharmacies.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy._id}
              pharmacy={pharmacy}
              targetMedicines={activeMeds}
            />
          ))
        )}
      </section>
    </main>
  );
}
