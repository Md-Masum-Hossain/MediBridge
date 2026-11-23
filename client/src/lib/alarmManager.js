import api from './api';
import { useAppStore } from '@/store/useAppStore';

/**
 * Dual-Mode Alarm Engine
 * Mode 1: In-App Active Web Audio API clinical chime
 * Mode 2: Background / Closed Browser Web Push Notifications via VAPID
 */

let audioContext = null;
let activeOscillators = [];

/**
 * Web Audio API synthesized clinical chime.
 * Generates an elegant, warm dual-tone clinical bell chime (C5 523.25Hz -> E5 659.25Hz)
 * Works reliably across all browsers without external asset loading issues.
 */
export function playClinicalChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext || audioContext.state === 'suspended') {
      audioContext = new AudioContextClass();
    }

    const now = audioContext.currentTime;

    // Stop any previously playing tones
    stopClinicalChime();

    // Primary Tone: C5 (523.25 Hz)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);

    // Harmonic Tone: E5 (659.25 Hz)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);

    // Master Envelope
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    masterGain.connect(audioContext.destination);

    osc1.start(now);
    osc2.start(now + 0.12);

    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);

    activeOscillators = [osc1, osc2];

    // Also attempt to play the local mp3 alarm chime as reinforcement if enabled
    try {
      const audio = new Audio('/sounds/alarm.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Audio element fallback is optional
    }
  } catch (err) {
    console.warn('[WebAudio] Chime playback warning:', err);
  }
}

export function stopClinicalChime() {
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore already stopped oscillators
    }
  });
  activeOscillators = [];
}

/**
 * Mode 2: Web Push Notification Subscription
 * Subscribes user to backend Web Push via Service Worker registration and VAPID key
 */
export async function subscribeToWebPush(userId = null) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push is not supported on this browser or device.');
  }

  // 1. Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted by user.');
  }

  // 2. Ensure Service Worker is registered
  const registration = await navigator.serviceWorker.ready;

  // 3. Fetch VAPID public key from backend
  const { publicKey } = await api.get('/notifications/vapid-key');
  if (!publicKey) {
    throw new Error('Server did not return a valid VAPID public key.');
  }

  // Convert VAPID key to Uint8Array
  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  // 4. Subscribe with pushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  // 5. Send subscription to backend
  await api.post('/notifications/subscribe', {
    subscription,
    userId,
  });

  useAppStore.getState().setPushSubscribed(true);
  return subscription;
}

// Helper to convert base64 VAPID key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
