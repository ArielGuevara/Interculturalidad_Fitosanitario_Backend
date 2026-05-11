import React, { useRef } from 'react';
import { 
  Pressable, 
  Text, 
  View, 
  SafeAreaView, 
  StyleSheet, 
  Animated, 
  ScrollView, 
  useWindowDimensions 
} from 'react-native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export function ProfileScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  
  // Hook de React Native para obtener medidas reales del dispositivo
  const { width } = useWindowDimensions();

  // Animación suave para el botón
  const btnScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  // Cálculos responsivos
  const avatarSize = width * 0.25; // El avatar ocupará el 25% del ancho de la pantalla (máximo 120px)
  const finalAvatarSize = Math.min(avatarSize, 120); 
  const dynamicPadding = width * 0.06; // Padding lateral del 6%

  // Componente reutilizable
  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Usamos ScrollView para que en pantallas pequeñas no se corte el contenido */}
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: dynamicPadding }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Encabezado y Avatar */}
        <View style={styles.header}>
          
          
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={[
              styles.avatarContainer, 
              { width: finalAvatarSize, height: finalAvatarSize, borderRadius: finalAvatarSize / 2 }
            ]}
          >
            <Text style={[styles.avatarInitial, { fontSize: finalAvatarSize * 0.4 }]}>
              {usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'M'}
            </Text>
          </LinearGradient>

          <Text style={styles.greeting}>
            Hola, {usuario?.nombre?.split(' ')[0] ?? 'Mika'}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{usuario?.rol ?? 'Usuario de Campo'}</Text>
          </View>
        </View>

        {/* Tarjeta de Datos del Usuario */}
        <View style={styles.card}>
          <InfoRow 
            icon="👤" 
            label="Nombre completo" 
            value={usuario?.nombre ?? 'No especificado'} 
          />
          <View style={styles.divider} />
          
          <InfoRow 
            icon="✉️" 
            label="Correo electrónico" 
            value={usuario?.email ?? 'correo@ejemplo.com'} 
          />
          <View style={styles.divider} />
          
          <InfoRow 
            icon="🛡️" 
            label="Nivel de acceso" 
            value={usuario?.rol ?? 'Estándar'} 
          />
        </View>

        {/* Espaciador flexible: empuja el botón hacia abajo si sobra pantalla */}
        <View style={styles.spacer} />

        {/* Botón de Cerrar Sesión */}
        <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
          <Pressable
            onPress={logout}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1, // Fundamental: permite que el espaciador (flex: 1) funcione dentro del ScrollView
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 35,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitial: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  badgeContainer: {
    marginTop: 8,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
    marginLeft: 62,
  },

  spacer: {
    flex: 1,
    minHeight: 40, // Asegura que siempre haya al menos un pequeño margen antes del botón
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 16,
    borderRadius: 20,
    width: '100%',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: 'bold',
  },
});