'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import PharmacyCard from '@/components/pharmacy/PharmacyCard';

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

  // Derive initial filter list from active meds or store
  const initialMeds =
    selectedFilterMeds && selectedFilterMeds.length > 0
      ? selectedFilterMeds
      : medications.map((m) => m.medicineName).filter(Boolean).slice(0, 5);

  const [activeMeds, setActiveMeds] = useState(initialMeds);

  const detectUserGps = useCallback(() => {
    setIsDetectingGps(true);
    setErrorMessage('');
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setUserCoordinates([pos.coords.longitude, pos.coords.latitude]);
          setIsDetectingGps(false);
        },
        (err) => {
          console.warn('[GPS Fallback]:', err.message);
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
      if (response?.data) setNearbyPharmacies(response.data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch nearby pharmacies.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, activeMeds, setNearbyPharmacies]);

  useEffect(() => { detectUserGps(); }, [detectUserGps]);
  useEffect(() => { fetchNearbyPharmacies(); }, [fetchNearbyPharmacies]);

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
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 w-full">
      {/* Page editorial kicker */}
      <div className="pb-4 border-b border-divider mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Live Proximity Stock Match
          </span>
          <span className="text-[11px] text-secondaryText flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            DGDA Licensed
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primaryText tracking-tight mt-1">
          Nearby Registered Pharmacies
        </h1>
        <p className="text-xs text-secondaryText mt-1 leading-relaxed max-w-xl">
          Real-time stock availability and distance calculated via MongoDB 2dsphere proximity index.
        </p>
      </div>

      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

        {/* ── Left Sidebar ── Location + Filter controls */}
        <aside className="md:col-span-4 md:pr-8 md:border-r md:border-divider space-y-6 pb-8 md:pb-0">

          {/* GPS Location Panel */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Search Location
            </h2>
            <div className="border border-divider rounded-lg overflow-hidden">
              <div className="p-3 flex items-center justify-between border-b border-divider">
                <div className="flex items-center gap-1.5 text-xs text-primaryText">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span className="font-mono text-[11px] text-secondaryText">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                </div>
                <button
                  onClick={detectUserGps}
                  disabled={isDetectingGps}
                  className="text-[11px] font-semibold text-brand flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <Navigation className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  {isDetectingGps ? 'Detecting...' : 'Detect GPS'}
                </button>
              </div>

              {/* Dhaka Hub Presets */}
              <div className="p-3">
                <span className="text-[10px] text-secondaryText uppercase tracking-wider font-semibold block mb-2">
                  Dhaka Hubs
                </span>
                <div className="flex flex-wrap gap-1.5">
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
              </div>
            </div>
          </section>

          {/* Medicine Filter */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primaryText mb-3">
              Matching Stock For ({activeMeds.length} Items)
            </h2>
            <div className="border border-divider rounded-lg p-3 space-y-3">
              {/* Active medicine badges */}
              {activeMeds.length === 0 ? (
                <p className="text-[11px] text-secondaryText text-center py-2">
                  No medicines selected. Add medicines below.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeMeds.map((med) => (
                    <span
                      key={med}
                      className="text-xs px-2.5 py-1 rounded-full bg-brand-light text-brand font-medium flex items-center gap-1.5 border border-brand/20"
                    >
                      {med}
                      <button onClick={() => handleRemoveMedicine(med)} className="hover:text-red-700 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add medicine form */}
              <form onSubmit={handleAddMedicine} className="border-t border-divider pt-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-secondaryText absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Napa, Sergel, Fexo..."
                    value={newMedInput}
                    onChange={(e) => setNewMedInput(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 rounded bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
            </div>

            {/* Reload button */}
            <button
              onClick={fetchNearbyPharmacies}
              disabled={isLoading}
              className="mt-3 w-full py-2 rounded border border-divider text-xs font-semibold text-brand flex items-center justify-center gap-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Searching...' : 'Search Nearby Pharmacies'}
            </button>
          </section>
        </aside>

        {/* ── Right Column ── Pharmacy List */}
        <main className="md:col-span-8 md:pl-8 pt-6 md:pt-0">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-secondaryText">
              Results ({nearbyPharmacies.length})
            </span>
            <span className="text-[11px] text-secondaryText">Sorted by Proximity &amp; Stock</span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-secondaryText flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-brand animate-spin" />
              <span>Scanning local pharmacy stock catalogs...</span>
            </div>
          ) : nearbyPharmacies.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-divider rounded-lg">
              <MapPin className="w-10 h-10 text-secondaryText mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-primaryText">No pharmacies found nearby.</p>
              <p className="text-xs text-secondaryText mt-1">
                Try switching to another Dhaka hub or expanding the search radius.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-divider border border-divider rounded-lg overflow-hidden">
              {nearbyPharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy._id}
                  pharmacy={pharmacy}
                  targetMedicines={activeMeds}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
