import './global.css';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { startAutoSync, syncOnAppStart } from './src/shared/network/networkSync';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityProvider } from './src/shared/contexts/AccessibilityContext';

import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    startAutoSync();
    syncOnAppStart();
    console.log('App initialized v2');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <AccessibilityProvider>
          <RootNavigator />
        </AccessibilityProvider>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}