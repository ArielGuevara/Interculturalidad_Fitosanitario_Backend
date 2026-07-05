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
import { useAccessibility } from '../contexts/AccessibilityContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface AccessibleButtonProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: 'large' | 'xl';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function AccessibleButton({
  icon,
  label,
  onPress,
  color = '#10b981',
  size = 'large',
  style,
  disabled,
}: AccessibleButtonProps) {
  const { easyMode, speakAndHaptic, haptic } = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;

  const isLarge = easyMode || size === 'xl';

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

  const iconSize = isLarge ? 32 : 24;

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
            padding: isLarge ? 20 : 14,
            borderRadius: isLarge ? 20 : 14,
          },
          isLarge && styles.buttonLarge,
        ]}
      >
        <Ionicons name={icon} size={iconSize} color="#fff" />
        <Text style={[styles.label, isLarge && styles.labelLarge]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface IconCardProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  color?: string;
}

export function IconCard({ icon, label, onPress, color = '#14532d' }: IconCardProps) {
  const { easyMode, haptic } = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={() => { haptic(); onPress(); }}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, tension: 300, friction: 10, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start()}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.iconCard,
          { backgroundColor: color, transform: [{ scale }] },
          easyMode && styles.iconCardEasy,
        ]}
      >
        <Ionicons name={icon} size={easyMode ? 40 : 28} color="#fff" />
        <Text style={[styles.cardLabel, easyMode && styles.cardLabelEasy]}>{label}</Text>
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
  buttonLarge: {
    minHeight: 72,
    gap: 14,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  labelLarge: {
    fontSize: 18,
  },
  iconCard: {
    borderRadius: 18,
    padding: 18,
    minHeight: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconCardEasy: {
    minHeight: 150,
    padding: 24,
    borderRadius: 24,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  cardLabelEasy: {
    fontSize: 18,
    marginTop: 12,
  },
});
