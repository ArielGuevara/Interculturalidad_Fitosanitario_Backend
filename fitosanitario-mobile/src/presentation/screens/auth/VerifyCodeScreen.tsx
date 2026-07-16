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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import * as authApi from '../../../infrastructure/data/auth/authApi';

export function VerifyCodeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'VerifyCode'>>();
  const telefono = route.params?.telefono || '';
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleVerify = async () => {
    if (codigo.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyReset(telefono, codigo);
      navigation.navigate('ResetPassword', { telefono, codigo });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="keypad-outline" size={40} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Código de verificación</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a tu WhatsApp
          </Text>

          <View style={styles.codeRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.codeBox, codigo.length > i && styles.codeBoxFilled]}>
                <Text style={styles.codeDigit}>{codigo[i] || ''}</Text>
              </View>
            ))}
          </View>

          <TextInput
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={6}
            value={codigo}
            onChangeText={setCodigo}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, (loading || codigo.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || codigo.length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verificar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Volver</Text>
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
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  codeBox: {
    width: 45, height: 52, borderRadius: 10, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
  },
  codeBoxFilled: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.3)' },
  codeDigit: { fontSize: 24, fontWeight: '700', color: '#fff' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
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
