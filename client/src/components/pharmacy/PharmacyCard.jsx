'use client';

import { MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';

export default function PharmacyCard({ pharmacy, searchedMedicines = [] }) {
  return (
    <article className="p-4 bg-surface hairline-divider">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-primaryText text-base">{pharmacy.name}</h3>
          <p className="text-xs text-secondaryText flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand" />
            {pharmacy.address?.formattedAddress || pharmacy.address?.street}
          </p>
        </div>
        {pharmacy.distance && (
          <span className="text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">
            {(pharmacy.distance / 1000).toFixed(1)} km
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {pharmacy.inventory?.slice(0, 3).map((item) => (
          <span
            key={item.medicineId}
            className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-medium ${
              item.inStock
                ? 'bg-badge-inStockBg text-badge-inStockText'
                : 'bg-badge-outStockBg text-badge-outStockText'
            }`}
          >
            {item.inStock ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {item.brandName}
          </span>
        ))}
      </div>
    </article>
  );
}
