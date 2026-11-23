'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Store,
  MapPin,
  TrendingUp,
  AlertCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function PharmacyPortalPage() {
  const { user } = useAppStore();

  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'inStock' | 'outOfStock'
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Load pharmacy data
  useEffect(() => {
    async function loadPharmacy() {
      setIsLoading(true);
      try {
        const response = await api.get('/pharmacies/owner/current', {
          params: { ownerId: user?._id },
        });

        if (response?.data) {
          setPharmacy(response.data);
          setInventory(response.data.inventory || []);
        } else {
          // Fallback: load first pharmacy from nearby
          const nearbyRes = await api.get('/pharmacies/nearby');
          if (nearbyRes?.data?.[0]) {
            setPharmacy(nearbyRes.data[0]);
            setInventory(nearbyRes.data[0].inventory || []);
          }
        }
      } catch (err) {
        console.error('[PharmacyPortal] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPharmacy();
  }, [user]);

  // Optimistic In-Stock Toggle handler (PATCH /api/pharmacies/stock)
  const handleToggleStock = async (item) => {
    const prevStatus = item.inStock;
    const newStatus = !prevStatus;
    const medId = item.medicineId || item._id;

    // 1. Instant Optimistic UI Update
    setInventory((prev) =>
      prev.map((i) =>
        (i.medicineId === medId || i._id === medId)
          ? { ...i, inStock: newStatus, quantity: newStatus ? (i.quantity > 0 ? i.quantity : 50) : 0 }
          : i
      )
    );
    setUpdatingId(medId);
    setStatusMessage('');

    try {
      // 2. Network Request
      await api.patch('/pharmacies/stock', {
        pharmacyId: pharmacy?._id,
        medicineId: medId,
        inStock: newStatus,
        quantity: newStatus ? (item.quantity > 0 ? item.quantity : 50) : 0,
      });

      setStatusMessage(`✓ ${item.brandName} marked as ${newStatus ? 'IN STOCK' : 'OUT OF STOCK'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('[Stock Toggle Error]:', err);
      // Revert optimistic update on failure
      setInventory((prev) =>
        prev.map((i) =>
          (i.medicineId === medId || i._id === medId) ? { ...i, inStock: prevStatus } : i
        )
      );
      setStatusMessage(`Failed to update ${item.brandName}: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter & Search Logic
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.genericName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'inStock') return item.inStock;
    if (filterMode === 'outOfStock') return !item.inStock;
    return true;
  });

  const totalItems = inventory.length;
  const inStockCount = inventory.filter((i) => i.inStock).length;
  const outOfStockCount = totalItems - inStockCount;

  return (
    <div className="min-h-screen bg-background text-primaryText flex flex-col pb-20">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-surface hairline-divider px-4 py-3 max-w-md mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/profile"
            className="p-1.5 rounded-lg border border-divider hover:bg-gray-100 text-secondaryText"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-primaryText leading-none">
              Pharmacy Stock Portal
            </h1>
            <p className="text-[10px] text-secondaryText mt-0.5">
              Instant Live Inventory Management
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-0.5 rounded flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> DGDA Verified
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 space-y-4">
        {/* Pharmacy Meta Card */}
        {pharmacy && (
          <section className="hairline-box rounded-xl p-4 bg-surface space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Active Licensed Branch
                </span>
                <h2 className="text-base font-bold text-primaryText mt-0.5">
                  {pharmacy.name}
                </h2>
                <p className="text-xs text-secondaryText flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  {pharmacy.address?.formattedAddress || 'Dhaka, Bangladesh'}
                </p>
              </div>

              {pharmacy.licenseNumber && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-secondaryText">
                  {pharmacy.licenseNumber}
                </span>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-3 hairline-divider-t grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded border border-divider">
                <span className="text-[10px] text-secondaryText block uppercase font-medium">Total Catalog</span>
                <span className="font-bold text-primaryText mt-0.5 block">{totalItems} Meds</span>
              </div>
              <div className="p-2 bg-badge-inStockBg rounded border border-green-200">
                <span className="text-[10px] text-badge-inStockText block uppercase font-medium">In Stock</span>
                <span className="font-bold text-badge-inStockText mt-0.5 block">{inStockCount} Active</span>
              </div>
              <div className="p-2 bg-badge-outStockBg rounded border border-red-200">
                <span className="text-[10px] text-badge-outStockText block uppercase font-medium">Out of Stock</span>
                <span className="font-bold text-badge-outStockText mt-0.5 block">{outOfStockCount} Items</span>
              </div>
            </div>
          </section>
        )}

        {/* Search & Filter Controls */}
        <section className="hairline-box rounded-xl p-3 bg-surface space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-secondaryText absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search catalog by brand (Napa, Seclo) or generic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-divider bg-gray-50 text-primaryText focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {[
              { key: 'all', label: `All (${totalItems})` },
              { key: 'inStock', label: `In Stock (${inStockCount})` },
              { key: 'outOfStock', label: `Out of Stock (${outOfStockCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterMode(tab.key)}
                className={`flex-1 py-1 px-2 rounded font-medium transition-colors ${
                  filterMode === tab.key
                    ? 'bg-brand text-white font-semibold'
                    : 'bg-gray-100 text-secondaryText hover:text-primaryText'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Live Feedback Toast */}
        {statusMessage && (
          <div className="p-2.5 bg-brand-light border border-brand/20 rounded-lg text-xs font-semibold text-brand text-center">
            {statusMessage}
          </div>
        )}

        {/* Inventory List (Strict Hairline Rows, NO AI-Slop) */}
        <section className="hairline-box rounded-xl bg-surface divide-y divide-divider overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-secondaryText flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand animate-spin" />
              <span>Loading registered pharmacy inventory...</span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondaryText">
              No medicines match your search criteria.
            </div>
          ) : (
            filteredInventory.map((item) => {
              const medId = item.medicineId || item._id;
              const isUpdating = updatingId === medId;

              return (
                <div
                  key={medId}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-primaryText truncate">
                        {item.brandName}
                      </h4>
                      {item.strength && (
                        <span className="text-[10px] text-secondaryText font-mono">
                          {item.strength}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-secondaryText truncate mt-0.5">
                      {item.genericName || 'Active Formulation'} • {item.dosageForm || 'Tablet'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-secondaryText">
                      <span>৳{item.unitPrice || 10}/unit</span>
                      <span>•</span>
                      <span>Qty: {item.quantity || 0}</span>
                    </div>
                  </div>

                  {/* Optimistic Stock Toggle Button */}
                  <button
                    disabled={isUpdating}
                    onClick={() => handleToggleStock(item)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      item.inStock
                        ? 'bg-badge-inStockBg text-badge-inStockText border-green-300 hover:bg-green-100'
                        : 'bg-badge-outStockBg text-badge-outStockText border-red-300 hover:bg-red-100'
                    }`}
                  >
                    {item.inStock ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Out of Stock</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
