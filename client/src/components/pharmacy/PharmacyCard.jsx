'use client';

import { MapPin, Phone, Navigation, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function PharmacyCard({ pharmacy, targetMedicines = [] }) {
  const {
    name,
    licenseNumber,
    address,
    location,
    contactPhone,
    distance,
    matchPercentage,
    matchedItems = [],
    inventory = [],
    operatingHours,
  } = pharmacy;

  // Format distance
  const distanceKm =
    typeof distance === 'number'
      ? (distance / 1000).toFixed(1) + ' km'
      : distance
      ? String(distance)
      : 'Nearby';

  // Display inventory items (either matched items or first 4 from inventory)
  const displayItems =
    matchedItems.length > 0 ? matchedItems : inventory.slice(0, 4);

  const inStockCount = displayItems.filter((item) => item.inStock).length;
  const totalCount = displayItems.length;

  const lat = location?.coordinates?.[1] || 23.7461;
  const lng = location?.coordinates?.[0] || 90.3756;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <article className="hairline-box rounded-xl p-4 bg-surface hover:border-gray-300 transition-colors">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm text-primaryText">{name}</h3>
            {licenseNumber && (
              <span className="text-[10px] text-secondaryText px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">
                {licenseNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-secondaryText flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            <span className="line-clamp-1">{address?.formattedAddress || address?.street || 'Dhaka, Bangladesh'}</span>
          </p>
        </div>

        {/* Distance Badge */}
        <span className="text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
          {distanceKm}
        </span>
      </div>

      {/* Stock Availability Ratio Bar */}
      <div className="mt-3 pt-3 hairline-divider-t flex items-center justify-between text-xs">
        <span className="text-secondaryText text-[11px] font-medium">Prescription Stock Match</span>
        <span
          className={`font-semibold text-xs px-2 py-0.5 rounded ${
            inStockCount === totalCount && totalCount > 0
              ? 'bg-badge-inStockBg text-badge-inStockText'
              : inStockCount > 0
              ? 'bg-amber-50 text-amber-700'
              : 'bg-badge-outStockBg text-badge-outStockText'
          }`}
        >
          {inStockCount}/{totalCount} Available
        </span>
      </div>

      {/* Itemized Medicine Badges (In-Stock vs Out-of-Stock) */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {displayItems.map((item) => (
          <span
            key={item.medicineId || item.brandName}
            className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 font-medium border ${
              item.inStock
                ? 'bg-badge-inStockBg text-badge-inStockText border-green-200'
                : 'bg-badge-outStockBg text-badge-outStockText border-red-200'
            }`}
          >
            {item.inStock ? (
              <CheckCircle2 className="w-3 h-3 text-badge-inStockText" />
            ) : (
              <XCircle className="w-3 h-3 text-badge-outStockText" />
            )}
            <span>{item.brandName}</span>
            {item.unitPrice ? (
              <span className="text-[10px] opacity-75">৳{item.unitPrice}</span>
            ) : null}
          </span>
        ))}
      </div>

      {/* Operating Hours & Action Controls */}
      <div className="mt-3.5 pt-3 hairline-divider-t flex items-center justify-between gap-2">
        <div className="text-[11px] text-secondaryText flex items-center gap-1">
          <Clock className="w-3 h-3 text-secondaryText" />
          <span>
            {operatingHours?.isOpen24Hours
              ? 'Open 24 Hours'
              : `${operatingHours?.open || '08:00'} - ${operatingHours?.close || '23:00'}`}
          </span>
        </div>

        {/* 1-Tap "Call / Directions" Actions */}
        <div className="flex items-center gap-1.5">
          {contactPhone && (
            <a
              href={`tel:${contactPhone.replace(/\s+/g, '')}`}
              className="py-1.5 px-2.5 rounded-lg border border-divider text-primaryText text-xs font-medium flex items-center gap-1 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-brand" />
              Call
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-2.5 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-1 hover:bg-brand-hover active:opacity-90 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
        </div>
      </div>
    </article>
  );
}
