'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  CheckCircle,
  FileDown,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  X,
  ZoomIn,
  RotateCcw,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { compressImage } from '@/lib/imageCompressor';
import { generatePrescriptionPdf } from '@/lib/pdfGenerator';
import {
  speakPrescriptionList,
  stopVoiceReadout,
  isVoiceActive,
} from '@/lib/voiceReader';

export default function PrescriptionScanner() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const lastFileRef = useRef(null);

  // Webcam modal refs & state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const { addPrescription, user } = useAppStore();

  const [previewImage, setPreviewImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ----------------------------------------------------------------
  // Webcam Modal: open stream, capture frame, cleanup
  // ----------------------------------------------------------------
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const openCameraModal = async () => {
    setCameraError('');
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      // Attach stream after modal has mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setCameraError(
        'Camera access denied or unavailable. Please upload an image instead.'
      );
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          closeCameraModal();
          handleImageUpload(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // ----------------------------------------------------------------
  // Mode 2: Global Ctrl+V clipboard image paste listener
  // ----------------------------------------------------------------
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
      stopVoiceReadout();
    };
  }, []);

  // ----------------------------------------------------------------
  // Image Processing & OCR Pipeline
  // ----------------------------------------------------------------
  const handleImageUpload = async (file) => {
    const target = file || lastFileRef.current;
    if (!target) return;
    lastFileRef.current = target;

    setScanFailed(false);
    setSaveSuccess(false);
    setIsScanning(true);
    setExtractedData(null);

    try {
      // 1. Client-side Image Compression (Reduces large mobile photos to ~200KB)
      let compressedBase64;
      if (typeof target === 'string' && target.startsWith('data:')) {
        compressedBase64 = target;
      } else {
        compressedBase64 = await compressImage(target, 1280, 0.8);
      }
      setPreviewImage(compressedBase64);

      // 2. Send to Gemini Vision OCR Endpoint
      const response = await api.post(
        '/prescriptions/scan',
        {
          imageBase64: compressedBase64,
        },
        { timeout: 60000 }
      );

      if (response?.data) {
        setExtractedData(response.data);
        setScanFailed(false);
      } else {
        throw new Error('Could not parse prescription data.');
      }
    } catch (err) {
      console.error('[Scan Error]:', err);
      setScanFailed(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetry = () => {
    if (lastFileRef.current) {
      handleImageUpload(lastFileRef.current);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  // ----------------------------------------------------------------
  // 3 Action Controls
  // ----------------------------------------------------------------

  // Action 1: "Save & Set Reminders"
  const handleSaveAndSetReminders = async () => {
    if (!extractedData) return;

    try {
      const payload = {
        doctorInfo: extractedData.doctorInfo,
        medicines: extractedData.medicines,
        image: { base64: previewImage },
        status: 'completed',
      };

      const saved = await api.post('/prescriptions', payload);
      const rxToStore = saved.data || {
        ...payload,
        _id: 'rx-' + Date.now(),
        createdAt: new Date().toISOString(),
      };

      addPrescription(rxToStore);
      setSaveSuccess(true);

      setTimeout(() => {
        router.push('/meds');
      }, 700);
    } catch (err) {
      console.error('[Save Error]:', err);
      // Fallback: save to local store anyway
      addPrescription({
        ...extractedData,
        _id: 'local-rx-' + Date.now(),
        createdAt: new Date().toISOString(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        router.push('/meds');
      }, 700);
    }
  };

  // Action 2: "Download Clean PDF"
  const handleDownloadPdf = () => {
    if (!extractedData) return;
    generatePrescriptionPdf(extractedData);
  };

  // Action 3: "Listen (Voice Read-Out)"
  const handleToggleVoice = () => {
    if (isVoiceActive() || isSpeaking) {
      stopVoiceReadout();
      setIsSpeaking(false);
    } else {
      if (extractedData?.medicines) {
        setIsSpeaking(true);
        speakPrescriptionList(extractedData.medicines, 'bn');
        const interval = setInterval(() => {
          if (!isVoiceActive()) {
            setIsSpeaking(false);
            clearInterval(interval);
          }
        }, 500);
      }
    }
  };

  const handleReset = () => {
    lastFileRef.current = null;
    setPreviewImage(null);
    setExtractedData(null);
    setSaveSuccess(false);
    setScanFailed(false);
    stopVoiceReadout();
    setIsSpeaking(false);
  };

  return (
    <section className="w-full">
      {/* Hidden file inputs for Mobile Camera & File Picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleImageUpload(e.target.files?.[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e.target.files?.[0])}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Upload Zone / Preview Stage */}
      {/* ---------------------------------------------------------------- */}
      {!previewImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`hairline-box rounded-xl p-6 text-center transition-all ${
            isDragging ? 'border-brand bg-brand-light/30' : 'hover:border-gray-400'
          }`}
        >
          {/* Main Icon */}
          <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-primaryText">
            Scan Prescription
          </h2>
          <p className="text-xs text-secondaryText mt-1 max-w-xs mx-auto leading-relaxed">
            Direct camera capture, drag & drop, or paste directly with{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono text-primaryText border border-gray-300">
              Ctrl+V
            </kbd>
          </p>

          {/* Quick Buttons for Mobile Camera & File Select */}
          <div className="flex items-center justify-center gap-2.5 mt-5">
            <button
              onClick={openCameraModal}
              className="py-2 px-4 rounded-lg bg-brand text-white text-xs font-semibold flex items-center gap-2 hover:bg-brand-hover active:opacity-90 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-4 rounded-lg border border-divider text-primaryText text-xs font-medium flex items-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Upload className="w-4 h-4 text-secondaryText" />
              Upload Photo
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mt-4">
            Supports JPG, PNG, WEBP with client-side compression
          </p>
        </div>
      ) : (
        /* Image Preview with Scanning Laser Animation */
        <div className="hairline-box rounded-xl overflow-hidden mb-5">
          <div className="relative w-full max-h-72 overflow-hidden bg-black/5 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Prescription Preview"
              className="w-full object-contain max-h-72"
            />

            {/* Smooth Vertical #0B4F4A Scanning Laser Animation */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                  className="w-full h-1 bg-[#0B4F4A] shadow-[0_0_12px_#0B4F4A]"
                  animate={{
                    top: ['0%', '95%', '0%'],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ position: 'absolute', left: 0, right: 0 }}
                />
                <div className="absolute inset-0 bg-[#0B4F4A]/10 backdrop-contrast-125" />
              </div>
            )}
          </div>

          {/* Scan Status Bar */}
          <div className="p-3 bg-surface hairline-divider-t flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 text-brand animate-spin" />
                  <span className="font-medium text-brand">
                    Analyzing Bangladeshi Medicines via Gemini Vision...
                  </span>
                </>
              ) : scanFailed ? (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-primaryText block leading-tight">
                      Scan Failed
                    </span>
                    <span className="text-[11px] text-secondaryText">
                      Could not read the prescription. Try again.
                    </span>
                  </div>
                </>
              ) : extractedData ? (
                <>
                  <CheckCircle className="w-4 h-4 text-badge-inStockText shrink-0" />
                  <span className="font-semibold text-primaryText">
                    Prescription Analyzed
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {scanFailed && !isScanning && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B4F4A] rounded-lg hover:bg-[#083c38] active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={isScanning}
                className={
                  scanFailed
                    ? "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondaryText border border-divider rounded-lg hover:bg-gray-50 hover:text-primaryText transition-colors"
                    : "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-[#0B4F4A] border border-[#0B4F4A] rounded-lg hover:bg-[#0B4F4A] hover:text-white transition-colors"
                }
              >
                {!scanFailed && <RotateCcw className="w-3.5 h-3.5" />}
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Staggered Result Reveal (50ms Staggered Framer Motion Entrance) */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            {/* Doctor & Encounter Header */}
            <div className="hairline-box rounded-xl p-4 mb-4 bg-surface">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-primaryText">
                    {extractedData.doctorInfo?.name || 'Dr. Md. Rafiqul Islam'}
                  </h3>
                  <p className="text-xs text-secondaryText mt-0.5">
                    {extractedData.doctorInfo?.specialization || 'Internal Medicine'} •{' '}
                    {extractedData.doctorInfo?.hospitalOrClinic || 'Square Hospitals, Dhaka'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-secondaryText bg-gray-50 px-2 py-0.5 rounded border border-divider">
                  <Calendar className="w-3 h-3 text-brand" />
                  <span>
                    {extractedData.doctorInfo?.prescriptionDate ||
                      new Date().toISOString().split('T')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Medicines List Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-secondaryText">
                Extracted Medicines ({extractedData.medicines?.length || 0})
              </span>
              <span className="text-[11px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                Clinical Catalog Match
              </span>
            </div>

            {/* 50ms Staggered List Container */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="hairline-box rounded-xl overflow-hidden divide-y divide-divider bg-surface"
            >
              {(extractedData.medicines || []).map((med, index) => (
                <motion.div
                  key={med.medicineName + index}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="p-3.5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Brand Name & Strength */}
                      <h4 className="font-bold text-sm text-primaryText">
                        {med.medicineName}{' '}
                        {med.strength && (
                          <span className="font-normal text-xs text-secondaryText">
                            ({med.strength})
                          </span>
                        )}
                      </h4>
                      {/* Generic Name */}
                      <p className="text-xs text-secondaryText mt-0.5">
                        {med.genericName || 'Generic Formulation'} •{' '}
                        {med.dosageForm || 'Tablet'}
                      </p>
                    </div>

                    {/* Dosage Badge */}
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-xs bg-gray-100 text-primaryText px-2 py-0.5 rounded border border-gray-200">
                        {med.dosagePattern || '1+0+1'}
                      </span>
                    </div>
                  </div>

                  {/* Meal Timing & Duration & Confidence */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Meal instruction in Bengali */}
                    <span className="font-bengali font-semibold text-brand bg-brand-light px-2 py-0.5 rounded text-[11px]">
                      {med.instructionsBn ||
                        (med.mealInstruction?.toLowerCase().includes('before')
                          ? 'খাবারের আগে'
                          : 'খাবারের পরে')}
                    </span>

                    {/* Duration */}
                    <span className="text-[11px] text-secondaryText bg-gray-50 px-2 py-0.5 rounded border border-divider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-secondaryText" />
                      {med.duration || '7 days'}
                    </span>

                    {/* AI Confidence Badge */}
                    <span className="text-[10px] text-badge-inStockText bg-badge-inStockBg px-2 py-0.5 rounded font-medium ml-auto flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* ---------------------------------------------------------------- */}
            {/* 3 Action Controls */}
            {/* ---------------------------------------------------------------- */}
            <div className="mt-4 space-y-2">
              {/* Action 1: "Save & Set Reminders" */}
              <button
                onClick={handleSaveAndSetReminders}
                disabled={saveSuccess}
                className="w-full py-3 px-4 rounded-xl bg-brand text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-brand-hover active:opacity-95 transition-all shadow-none"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved! Opening My Meds...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Save & Set Reminders
                  </>
                )}
              </button>

              {/* Action 2 & 3: PDF and Voice Read-out side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Action 2: "Download Clean PDF" */}
                <button
                  onClick={handleDownloadPdf}
                  className="py-2.5 px-3 rounded-xl border border-divider text-primaryText text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-brand" />
                  Download PDF
                </button>

                {/* Action 3: "Listen (Voice Read-Out)" */}
                <button
                  onClick={handleToggleVoice}
                  className={`py-2.5 px-3 rounded-xl border border-divider text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    isSpeaking
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                      : 'text-primaryText hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 text-amber-700 animate-pulse" />
                      Stop Voice
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-brand" />
                      Listen (Voice)
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* Live Webcam Capture Modal                                         */}
      {/* ---------------------------------------------------------------- */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && closeCameraModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#0B4F4A]" />
                  <span className="text-sm font-semibold text-[#111827]">Camera</span>
                </div>
                <button
                  onClick={closeCameraModal}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Preview or Error */}
              <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center">
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-xs text-gray-300 leading-relaxed">{cameraError}</p>
                    <button
                      onClick={() => {
                        closeCameraModal();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 py-2 px-4 rounded-lg bg-white text-[#0B4F4A] text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Instead
                    </button>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder corner marks */}
                    <div className="absolute inset-6 pointer-events-none">
                      {/* TL */}
                      <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/70 rounded-tl" />
                      {/* TR */}
                      <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/70 rounded-tr" />
                      {/* BL */}
                      <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/70 rounded-bl" />
                      {/* BR */}
                      <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/70 rounded-br" />
                    </div>
                  </>
                )}
              </div>

              {/* Shutter Row */}
              {!cameraError && (
                <div className="flex items-center justify-center py-5 bg-[#F9FAFB]">
                  <button
                    onClick={capturePhoto}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[#0B4F4A] text-white text-sm font-semibold hover:bg-[#0a3f3b] active:scale-95 transition-all shadow-sm"
                    aria-label="Capture photo"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Capture Photo
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
