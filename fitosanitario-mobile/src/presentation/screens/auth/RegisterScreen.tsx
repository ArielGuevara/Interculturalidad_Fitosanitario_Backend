import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import type { Rol } from '../../../domain/auth/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('AGRICULTOR');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      await register({ nombre: nombre.trim(), email: email.trim(), password, rol });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-semibold text-slate-900">Crear cuenta</Text>

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

      <Text className="mt-4 text-slate-700">Rol</Text>
      <View className="mt-2 flex-row gap-2">
        <Pressable
          className={`flex-1 rounded-xl border px-3 py-3 ${
            rol === 'AGRICULTOR' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'
          }`}
          onPress={() => setRol('AGRICULTOR')}
        >
          <Text className="text-center text-slate-800">AGRICULTOR</Text>
        </Pressable>
        <Pressable
          className={`flex-1 rounded-xl border px-3 py-3 ${
            rol === 'MODERADOR' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'
          }`}
          onPress={() => setRol('MODERADOR')}
        >
          <Text className="text-center text-slate-800">MODERADOR</Text>
        </Pressable>
      </View>

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
