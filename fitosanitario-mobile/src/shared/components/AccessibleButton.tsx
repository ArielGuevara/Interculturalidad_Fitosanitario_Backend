import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { useAccessibility } from '../contexts/AccessibilityContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface AccessibleButtonProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function AccessibleButton({
  icon,
  label,
  onPress,
  color = '#10b981',
  style,
  disabled,
}: AccessibleButtonProps) {
  const easyMode = useAccessibilityStore((s) => s.easyMode);
  const { speakAndHaptic, haptic } = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptic();
    Animated.spring(scale, { toValue: 0.95, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (easyMode) {
      speakAndHaptic(label);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, disabled && { opacity: 0.45 }]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: color,
            transform: [{ scale }],
            padding: easyMode ? 20 : 14,
            borderRadius: easyMode ? 20 : 14,
          },
          easyMode && styles.buttonEasy,
        ]}
      >
        <Ionicons name={icon} size={easyMode ? 32 : 24} color="#fff" />
        <Text style={[styles.label, easyMode && styles.labelEasy]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 52,
  },
  buttonEasy: {
    minHeight: 72,
    gap: 14,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  labelEasy: {
    fontSize: 18,
  },
});
