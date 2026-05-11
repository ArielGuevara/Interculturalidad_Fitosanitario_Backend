import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Alert } from 'react-native';
import { useAuthStore } from '../../infrastructure/auth/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CatalogosScreen } from '../screens/catalogos/CatalogosScreen';
import { CultivosScreen } from '../screens/catalogos/CultivosScreen';
import { PlagasScreen } from '../screens/catalogos/PlagasScreen';
import { ProductosScreen } from '../screens/catalogos/ProductosScreen';
import { ReportesScreen } from '../screens/reportes/ReportesScreen';
import { ReporteDetailScreen } from '../screens/reportes/ReporteDetailScreen';
import { CreateReporteScreen } from '../screens/reportes/CreateReporteScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type AuthStackParamList = {
  Login: undefined;
};

export type AppTabsParamList = {
  Home: undefined;
  Reportes: undefined;
  Catalogos: undefined;
  Perfil: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  Cultivos: undefined;
  Plagas: undefined;
  Productos: undefined;
  ReporteDetail: { id: number };
  CreateReporte: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Ingresar' }} />
    </AuthStack.Navigator>
  );
}

function TabsNavigator() {
  const usuario = useAuthStore((s) => s.usuario);
  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
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
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <AppStack.Screen name="Cultivos" component={CultivosScreen} options={{ title: 'Cultivos' }} />
      <AppStack.Screen name="Plagas" component={PlagasScreen} options={{ title: 'Plagas' }} />
      <AppStack.Screen name="Productos" component={ProductosScreen} options={{ title: 'Productos' }} />
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
    <NavigationContainer>
      {status === 'authenticated' && isAgricultor ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}


