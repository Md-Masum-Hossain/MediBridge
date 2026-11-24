import { create } from 'zustand';
import { updateMedicineStatus as apiUpdateMedicineStatus, deleteMedicine as apiDeleteMedicine } from '@/lib/api';

// Helper to get today's date string YYYY-MM-DD
export const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useAppStore = create((set, get) => ({
  // ----------------------------------------------------
  // User & Auth State
  // ----------------------------------------------------
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('medibridge_token', token);
      if (user) localStorage.setItem('medibridge_user', JSON.stringify(user));
    }
    set({ user, token: token || get().token, isAuthenticated: !!user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medibridge_token');
      localStorage.removeItem('medibridge_user');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrateAuth: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('medibridge_token');
      const userStr = localStorage.getItem('medibridge_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (token && user) {
        set({ token, user, isAuthenticated: true, isHydrated: true });
        return;
      }
    } catch {
      // ignore parsing errors
    }
    set({ isHydrated: true });
  },

  // ----------------------------------------------------
  // Prescriptions State
  // ----------------------------------------------------
  prescriptions: [],
  activePrescription: null,

  setPrescriptions: (prescriptions) => {
    set({ prescriptions });
    // Also sync active medications if present
    const allMeds = (prescriptions || []).flatMap((rx) => rx.medicines || []);
    if (allMeds.length > 0) {
      set({ medications: allMeds });
    }
  },

  setActivePrescription: (activePrescription) => {
    set({ activePrescription });
    if (activePrescription?.medicines?.length) {
      // Add or update active medications
      const current = get().medications;
      const combined = [...activePrescription.medicines];
      current.forEach((m) => {
        if (!combined.some((c) => c.medicineName === m.medicineName)) {
          combined.push(m);
        }
      });
      set({ medications: combined });
    }
  },

  addPrescription: (prescription) => {
    const list = [prescription, ...get().prescriptions];
    set({ prescriptions: list, activePrescription: prescription });
    if (prescription?.medicines?.length) {
      const current = get().medications;
      const combined = [...prescription.medicines];
      current.forEach((m) => {
        if (!combined.some((c) => c.medicineName === m.medicineName)) {
          combined.push(m);
        }
      });
      set({ medications: combined });
    }
  },

  // ----------------------------------------------------
  // Active Medications & Daily Dose Adherence Tracking
  // ----------------------------------------------------
  // Starts empty — medications are populated after scanning a real prescription
  medications: [],

  setMedications: (medications) => set({ medications }),

  /**
   * Stop or resume a medication. Persists to the backend and updates local state.
   * Returns the updated medication object on success, throws on failure.
   * @param {string} prescriptionId
   * @param {number} medicineIndex - index within prescription.medicines[]
   * @param {string|undefined} status - 'active' | 'stopped'. Omit to toggle.
   */
  stopOrResumeMedication: async (prescriptionId, medicineIndex, status) => {
    const result = await apiUpdateMedicineStatus(prescriptionId, medicineIndex, status);
    // result.prescription contains the full updated prescription
    const updatedPrescription = result?.data?.prescription || result?.prescription;
    if (updatedPrescription) {
      const { prescriptions } = get();
      const updated = prescriptions.map((rx) =>
        String(rx._id) === String(prescriptionId) ? updatedPrescription : rx
      );
      set({ prescriptions: updated });
      // Rebuild flat medications list from updated prescriptions
      const allMeds = updated.flatMap((rx) => rx.medicines || []);
      set({ medications: allMeds });
    }
    return result;
  },

  /**
   * Permanently remove a medication from a prescription. Persists and updates local state.
   * @param {string} prescriptionId
   * @param {number} medicineIndex
   */
  removeMedication: async (prescriptionId, medicineIndex) => {
    const result = await apiDeleteMedicine(prescriptionId, medicineIndex);
    const updatedPrescription = result?.data?.prescription || result?.prescription;
    if (updatedPrescription) {
      const { prescriptions } = get();
      const updated = prescriptions.map((rx) =>
        String(rx._id) === String(prescriptionId) ? updatedPrescription : rx
      );
      set({ prescriptions: updated });
      const allMeds = updated.flatMap((rx) => rx.medicines || []);
      set({ medications: allMeds });
    }
    return result;
  },

  // Dose logs for today: { [medName]: { morning: true, noon: false, night: false } }
  doseLogs: {},

  toggleDoseTaken: (medName, slot) => {
    const today = getTodayKey();
    const currentLogs = { ...(get().doseLogs[today] || {}) };
    const medLog = { ...(currentLogs[medName] || {}) };
    medLog[slot] = !medLog[slot];
    currentLogs[medName] = medLog;

    set({
      doseLogs: {
        ...get().doseLogs,
        [today]: currentLogs,
      },
    });
  },

  // ----------------------------------------------------
  // Dual-Mode Alarm & Scheduler State
  // ----------------------------------------------------
  activeAlarm: null, // holds medicine object when an alarm is actively ringing
  isAlarmSheetOpen: false,
  alarmTimes: {
    morning: '08:00',
    noon: '13:30',
    night: '20:30',
  },
  pushSubscribed: false,
  setPushSubscribed: (val) => set({ pushSubscribed: val }),

  setAlarmTime: (slot, time) => {
    set((state) => ({
      alarmTimes: { ...state.alarmTimes, [slot]: time },
    }));
  },

  triggerAlarm: (reminderData) => {
    set({
      activeAlarm: reminderData,
      isAlarmSheetOpen: true,
    });
  },

  dismissAlarm: () => {
    set({
      activeAlarm: null,
      isAlarmSheetOpen: false,
    });
  },

  snoozeAlarm: (minutes = 10) => {
    const active = get().activeAlarm;
    set({
      activeAlarm: null,
      isAlarmSheetOpen: false,
    });
    // Schedule re-trigger after `minutes`
    if (active && typeof window !== 'undefined') {
      setTimeout(() => {
        get().triggerAlarm({ ...active, isSnoozed: true });
      }, minutes * 60 * 1000);
    }
  },

  // ----------------------------------------------------
  // Pharmacy Proximity & Live Stock State
  // ----------------------------------------------------
  // Coordinates format: [longitude, latitude]. Default: Dhanmondi, Dhaka
  userCoordinates: [90.3756, 23.7461],
  nearbyPharmacies: [],
  selectedFilterMeds: [],

  setUserCoordinates: (coords) => set({ userCoordinates: coords }),
  setNearbyPharmacies: (nearbyPharmacies) => set({ nearbyPharmacies }),
  setSelectedFilterMeds: (selectedFilterMeds) => set({ selectedFilterMeds }),

  // ----------------------------------------------------
  // App Preferences
  // ----------------------------------------------------
  language: 'en', // 'en' | 'bn'
  soundEnabled: true,
  setLanguage: (language) => set({ language }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));
