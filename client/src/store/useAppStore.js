import { create } from 'zustand';

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
  // Initial default medications from Bangladeshi clinical guidelines
  medications: [
    {
      _id: 'default-med-1',
      medicineName: 'Napa Extra',
      genericName: 'Paracetamol + Caffeine',
      strength: '500 mg + 65 mg',
      dosageForm: 'Tablet',
      dosagePattern: '1+0+1',
      mealInstruction: 'After Meal',
      duration: '5 days',
      instructionsBn: 'খাওয়ার পর ভরা পেটে দিনে ২ বার (সকাল ও রাত)',
      timings: ['08:00', '20:30'],
      isActive: true,
    },
    {
      _id: 'default-med-2',
      medicineName: 'Seclo 20',
      genericName: 'Omeprazole',
      strength: '20 mg',
      dosageForm: 'Capsule',
      dosagePattern: '1+0+0',
      mealInstruction: 'Before Meal',
      duration: '14 days',
      instructionsBn: 'সকালে খাওয়ার ২০ মিনিট পূর্বে খালি পেটে খাবেন',
      timings: ['08:00'],
      isActive: true,
    },
    {
      _id: 'default-med-3',
      medicineName: 'Monas 10',
      genericName: 'Montelukast Sodium',
      strength: '10 mg',
      dosageForm: 'Tablet',
      dosagePattern: '0+0+1',
      mealInstruction: 'At Bedtime',
      duration: '30 days',
      instructionsBn: 'প্রতিদিন রাতে ঘুমানোর পূর্বে ১ টি খাবেন',
      timings: ['20:30'],
      isActive: true,
    },
  ],

  setMedications: (medications) => set({ medications }),

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
  selectedFilterMeds: ['Napa Extra', 'Seclo 20', 'Monas 10'],

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
