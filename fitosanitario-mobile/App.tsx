import './global.css';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { startAutoSync, syncOnAppStart } from './src/shared/network/networkSync';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    startAutoSync();      // escucha internet
    syncOnAppStart();     // sync al abrir app
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}