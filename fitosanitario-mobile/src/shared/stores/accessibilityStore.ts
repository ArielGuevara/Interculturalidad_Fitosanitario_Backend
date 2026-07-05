import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'fitosanitario.easyMode';

type AccessibilityState = {
  easyMode: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  toggleEasyMode: () => Promise<void>;
};

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  easyMode: false,
  loaded: false,

  load: async () => {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      set({ easyMode: val === 'true', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggleEasyMode: async () => {
    const next = !get().easyMode;
    await AsyncStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    set({ easyMode: next });
  },
}));
