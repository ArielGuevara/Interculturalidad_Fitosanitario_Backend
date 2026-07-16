import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import * as authApi from '../../../infrastructure/data/auth/authApi';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  const formatTelefono = (t: string) => {
    const cleaned = t.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('593')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+593${cleaned.slice(1)}`;
    return t.startsWith('+') ? t : `+593${cleaned}`;
  };

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRequest = async () => {
    if (!telefono.trim()) {
      Alert.alert('Error', 'Ingresa tu número de teléfono');
      return;
    }
    const telefonoFinal = formatTelefono(telefono.trim());
    setLoading(true);
    try {
      await authApi.requestReset(telefonoFinal);
      navigation.navigate('VerifyCode', { telefono: telefonoFinal });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="lock-open-outline" size={40} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>Recuperar cuenta</Text>
          <Text style={styles.subtitle}>
            Ingresa tu número de WhatsApp (ej: 0962846565)
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+52 962 846 565"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequest}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.blobTopLeft} />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottom} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F766E' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, zIndex: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#D1FAE5', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  button: {
    backgroundColor: '#10b981', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#D1FAE5', fontSize: 14, textDecorationLine: 'underline' },
  blobTopLeft: {
    position: 'absolute', top: -60, left: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: '#0D9488', opacity: 0.3,
  },
  blobTopRight: {
    position: 'absolute', top: -30, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: '#059669', opacity: 0.25,
  },
  blobBottom: {
    position: 'absolute', bottom: -80, left: -30, width: 250, height: 250,
    borderRadius: 125, backgroundColor: '#047857', opacity: 0.2,
  },
});
