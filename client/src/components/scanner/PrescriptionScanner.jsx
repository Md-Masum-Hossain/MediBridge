'use client';

import { Camera, Upload, Clipboard } from 'lucide-react';

export default function PrescriptionScanner() {
  return (
    <section className="bg-surface rounded-xl p-5 border border-divider">
      <h2 className="text-base font-semibold text-primaryText mb-1">
        Scan Prescription
      </h2>
      <p className="text-xs text-secondaryText mb-4">
        Capture photo, paste from clipboard (Ctrl+V), or drag & drop.
      </p>

      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-brand transition-colors cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-primaryText">
          Tap camera or drop image here
        </p>
        <p className="text-xs text-secondaryText mt-1">
          Supports JPG, PNG, WEBP with client-side compression
        </p>
      </div>
    </section>
  );
}
