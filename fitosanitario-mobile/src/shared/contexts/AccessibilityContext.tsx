import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAccessibilityStore } from '../stores/accessibilityStore';

type AccessibilityContextType = {
  easyMode: boolean;
  loaded: boolean;
  toggleEasyMode: () => Promise<void>;
  speak: (text: string) => void;
  haptic: () => void;
  speakAndHaptic: (text: string) => void;
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  easyMode: false,
  loaded: false,
  toggleEasyMode: async () => {},
  speak: () => {},
  haptic: () => {},
  speakAndHaptic: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const easyMode = useAccessibilityStore((s) => s.easyMode);
  const loaded = useAccessibilityStore((s) => s.loaded);
  const load = useAccessibilityStore((s) => s.load);
  const toggleEasyMode = useAccessibilityStore((s) => s.toggleEasyMode);

  const lastSpeakRef = useRef('');

  useEffect(() => {
    load();
  }, [load]);

  // Detener speech inmediatamente cuando se apaga el modo fácil
  useEffect(() => {
    if (!easyMode) {
      Speech.stop().catch(() => {});
      lastSpeakRef.current = '';
    }
  }, [easyMode]);

  const speak = useCallback((text: string) => {
    if (!easyMode) return;
    if (text === lastSpeakRef.current) return;
    lastSpeakRef.current = text;
    Speech.speak(text, {
      language: 'es-MX',
      rate: 0.85,
      onDone: () => { lastSpeakRef.current = ''; },
      onError: () => { lastSpeakRef.current = ''; },
    });
  }, [easyMode]);

  const haptic = useCallback(() => {
    if (!easyMode) return;
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [easyMode]);

  const speakAndHaptic = useCallback((text: string) => {
    haptic();
    speak(text);
  }, [haptic, speak]);

  return (
    <AccessibilityContext.Provider value={{ easyMode, loaded, toggleEasyMode, speak, haptic, speakAndHaptic }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
