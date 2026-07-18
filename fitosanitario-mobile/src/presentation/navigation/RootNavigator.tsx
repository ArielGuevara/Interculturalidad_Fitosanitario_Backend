import React, { useEffect, useCallback } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { useNotifications } from '../hooks/useNotifications';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { VerifyCodeScreen } from '../screens/auth/VerifyCodeScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CatalogosScreen } from '../screens/catalogos/CatalogosScreen';
import { CultivosScreen } from '../screens/catalogos/CultivosScreen';
import { PlagasScreen } from '../screens/catalogos/PlagasScreen';
import { ProductosScreen } from '../screens/catalogos/ProductosScreen';
import { TratamientosScreen } from '../screens/catalogos/TratamientosScreen';
import { ReportesScreen } from '../screens/reportes/ReportesScreen';
import { ReporteDetailScreen } from '../screens/reportes/ReporteDetailScreen';
import { CreateReporteScreen } from '../screens/reportes/CreateReporteScreen';
import { TratamientoDetailScreen } from '../screens/reportes/TratamientoDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ForoScreen } from '../screens/comunidad/ForoScreen';
import { RecomendacionFormScreen } from '../screens/comunidad/RecomendacionFormScreen';
import { RecomendacionDetailScreen } from '../screens/comunidad/RecomendacionDetailScreen';
import { AlertasScreen } from '../screens/alertas/AlertasScreen';
import { NotificacionesScreen } from '../screens/alertas/NotificacionesScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: { telefono: string };
  ResetPassword: { telefono: string; codigo: string };
};

export type AppTabsParamList = {
  Home: undefined;
  Reportes: undefined;
  Catalogos: undefined;
  Comunidad: undefined;
  Perfil: undefined;
};

export type EditReporteData = {
  id: number;
  titulo: string;
  descripcion?: string;
  descripcionProblema?: string;
  cultivoId: number;
  plagaId?: number;
  latitud: number;
  longitud: number;
  imagenesUrls?: string[];
  audioUrl?: string | null;
};

export type AppStackParamList = {
  Tabs: undefined;
  Cultivos: undefined;
  Plagas: undefined;
  Productos: undefined;
  Tratamientos: undefined;
  ReporteDetail: { id: number };
  CreateReporte: { edit?: EditReporteData } | undefined;
  TratamientoDetail: { id: number };
  ForoList: undefined;
  RecomendacionForm: { reporteId?: number; cultivoId?: number; plagaId?: number };
  RecomendacionDetail: { id: number };
  Alertas: undefined;
  Notificaciones: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();
const navigationRef = createNavigationContainerRef<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Ingresar', headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar cuenta', headerShown: false }} />
      <AuthStack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar código', headerShown: false }} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Nueva contraseña', headerShown: false }} />
    </AuthStack.Navigator>
  );
}

function TabsNavigator() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Reportes"
        component={ReportesScreen}
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Catalogos"
        component={CatalogosScreen}
        options={{
          title: 'Catálogos',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Comunidad"
        component={ForoScreen}
        options={{
          title: 'Foro',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  const handleNotificationTap = useCallback((data?: { type?: string; reporteId?: number; tratamientoId?: number; recomendacionId?: number }) => {
    if (!navigationRef.isReady()) return;
    if (!data?.type) { navigationRef.navigate('Alertas'); return; }
    switch (data.type) {
      case 'tratamiento_asignado':
      case 'cambio_estado':
      case 'nuevo_reporte':
        if (data.reporteId) navigationRef.navigate('ReporteDetail', { id: data.reporteId });
        else navigationRef.navigate('Alertas');
        break;
      case 'nuevo_comentario':
        if (data.recomendacionId) navigationRef.navigate('RecomendacionDetail', { id: data.recomendacionId });
        else navigationRef.navigate('Alertas');
        break;
      case 'cuenta_suspendida':
        Alert.alert('Cuenta suspendida', 'Tu cuenta ha sido suspendida. Revisa los detalles en tu perfil.');
        break;
      default:
        navigationRef.navigate('Alertas');
    }
  }, []);

  useNotifications(handleNotificationTap);

  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <AppStack.Screen name="Cultivos" component={CultivosScreen} options={{ title: 'Cultivos' }} />
      <AppStack.Screen name="Plagas" component={PlagasScreen} options={{ title: 'Plagas' }} />
      <AppStack.Screen name="Productos" component={ProductosScreen} options={{ title: 'Productos' }} />
      <AppStack.Screen name="Tratamientos" component={TratamientosScreen} options={{ title: 'Tratamientos' }} />
      <AppStack.Screen
        name="ReporteDetail"
        component={ReporteDetailScreen}
        options={{ title: 'Reporte' }}
      />
      <AppStack.Screen
        name="CreateReporte"
        component={CreateReporteScreen}
        options={{ title: 'Nuevo reporte' }}
      />
      <AppStack.Screen
        name="TratamientoDetail"
        component={TratamientoDetailScreen}
        options={{ title: 'Tratamiento' }}
      />
      <AppStack.Screen
        name="ForoList"
        component={ForoScreen}
        options={{ title: 'Foro Comunitario' }}
      />
      <AppStack.Screen
        name="RecomendacionForm"
        component={RecomendacionFormScreen}
        options={{ title: 'Nueva recomendación' }}
      />
      <AppStack.Screen
        name="RecomendacionDetail"
        component={RecomendacionDetailScreen}
        options={{ title: 'Recomendación' }}
      />
      <AppStack.Screen
        name="Alertas"
        component={AlertasScreen}
        options={{ title: 'Alertas' }}
      />
      <AppStack.Screen
        name="Notificaciones"
        component={NotificacionesScreen}
        options={{ title: 'Notificaciones' }}
      />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const usuario = useAuthStore((s) => s.usuario);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);

  const isAgricultor = usuario?.rol === 'AGRICULTOR';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'authenticated' && usuario && !isAgricultor) {
      Alert.alert(
        'Acceso denegado',
        'Esta aplicación solo puede ser utilizada por agricultores',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    }
  }, [status, usuario, isAgricultor, logout]);

  if (status === 'unknown') {
    return <Text style={{ padding: 16 }}>Cargando...</Text>;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {status === 'authenticated' && isAgricultor ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
