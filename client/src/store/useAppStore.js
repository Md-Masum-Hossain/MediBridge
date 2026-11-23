import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // User & Auth State
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),

  // Prescriptions & Medicines State
  prescriptions: [],
  activePrescription: null,
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  setActivePrescription: (activePrescription) => set({ activePrescription }),

  // Active Alarm & Reminder Drawer State
  activeAlarm: null, // Holds the medicine due data if alarm is currently ringing
  isAlarmSheetOpen: false,
  isAudioPlaying: false,
  triggerAlarm: (reminderData) =>
    set({
      activeAlarm: reminderData,
      isAlarmSheetOpen: true,
      isAudioPlaying: true,
    }),
  dismissAlarm: () =>
    set({
      activeAlarm: null,
      isAlarmSheetOpen: false,
      isAudioPlaying: false,
    }),

  // Pharmacy State
  nearbyPharmacies: [],
  userCoordinates: null, // [longitude, latitude]
  setNearbyPharmacies: (nearbyPharmacies) => set({ nearbyPharmacies }),
  setUserCoordinates: (coords) => set({ userCoordinates: coords }),

  // Application Settings
  language: 'en', // 'en' | 'bn'
  setLanguage: (lang) => set({ language: lang }),
  soundEnabled: true,
  setSoundEnabled: (val) => set({ soundEnabled: val }),
}));
