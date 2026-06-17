import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../../infrastructure/auth/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      console.log('[REGISTER] Enviando registro...', { nombre: nombre.trim(), email: email.trim() });
      await register({ nombre: nombre.trim(), email: email.trim(), password });
      console.log('[REGISTER] Registro exitoso');
    } catch (e: any) {
      console.log('[REGISTER] Error completo:', JSON.stringify(e));
      console.log('[REGISTER] Response:', e?.response?.data);
      console.log('[REGISTER] Status:', e?.response?.status);
      console.log('[REGISTER] Message:', e?.message);
      const msg = e?.response?.data?.message?.[0] || e?.response?.data?.message || e?.message || 'No se pudo registrar';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-semibold text-slate-900">Crear cuenta de agricultor</Text>

      <Text className="mt-6 text-slate-700">Nombre</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Tu nombre"
      />

      <Text className="mt-4 text-slate-700">Email</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="correo@ejemplo.com"
      />

      <Text className="mt-4 text-slate-700">Contraseña</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-200 px-3 py-3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="mínimo 8 caracteres"
      />

      <Pressable
        className={`mt-6 rounded-xl bg-emerald-600 px-4 py-4 ${loading ? 'opacity-70' : ''}`}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text className="text-center font-semibold text-white">
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Text>
      </Pressable>

      <Pressable className="mt-4" onPress={() => navigation.navigate('Login')}>
        <Text className="text-center text-emerald-700">Ya tengo cuenta</Text>
      </Pressable>
    </View>
  );
}
