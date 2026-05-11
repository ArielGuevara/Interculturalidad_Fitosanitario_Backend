import './global.css';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { RootNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}