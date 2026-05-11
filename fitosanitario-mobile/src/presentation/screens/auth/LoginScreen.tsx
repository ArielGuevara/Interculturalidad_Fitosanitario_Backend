import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';

const { width: W } = Dimensions.get('window');

function Blob({ style }: { style: any }) {
  return <View style={[styles.blob, style]} />;
}

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor ingresa tus credenciales');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (e: any) {
      const msg = e?.message || 'Error al conectar con el servidor';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Fondo Decorativo ── */}
      <Blob style={styles.blobTopLeft} />
      <Blob style={styles.blobTopRight} />
      <Blob style={styles.blobBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* ── Logo y Título ── */}
          <View style={styles.hero}>
            <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </Animated.View>
            <Text style={styles.appName}>Gestión Fitosanitaria</Text>
            <Text style={styles.tagline}>Control inteligente para la salud de tus cultivos</Text>
          </View>

          {/* ── Formulario ── */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.textInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nombre@ejemplo.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={[styles.fieldWrap, { marginTop: 20 }]}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <View style={[styles.inputWrap, passFocused && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
              </View>
            </View>

            {/* Botón Ingresar */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 32 }}>
              <Pressable
                style={[styles.btn, loading && styles.btnLoading]}
                onPress={onSubmit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.btnText}>Cargando...</Text>
                ) : (
                  <Text style={styles.btnText}>Ingresar</Text>
                )}
              </Pressable>
            </Animated.View>

        
          </View>

          <Text style={styles.poweredBy}>Powered by Fitosanitario</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#052e16', // Verde muy oscuro como base
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  // Blobs sutiles para dar profundidad
  blob: { position: 'absolute', borderRadius: 999 },
  blobTopLeft: {
    width: W * 0.8,
    height: W * 0.8,
    backgroundColor: '#14532d',
    top: -W * 0.2,
    left: -W * 0.3,
    opacity: 0.4,
  },
  blobTopRight: {
    width: W * 0.6,
    height: W * 0.6,
    backgroundColor: '#065f46',
    top: W * 0.1,
    right: -W * 0.2,
    opacity: 0.3,
  },
  blobBottom: {
    width: W,
    height: W,
    backgroundColor: '#064e3b',
    bottom: -W * 0.4,
    left: -W * 0.2,
    opacity: 0.2,
  },
  // Header
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  logoEmoji: { fontSize: 45 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  // Formulario
  form: {
    width: '100%',
  },
  fieldLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    height: 60,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  textInput: {
    color: '#ffffff',
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#10b981',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnLoading: { opacity: 0.7 },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  linkBold: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  poweredBy: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    letterSpacing: 1,
  }
});