import React, { useRef, useState } from 'react';
import { 
  Pressable, 
  Text, 
  View, 
  SafeAreaView, 
  StyleSheet, 
  Animated, 
  ScrollView, 
  useWindowDimensions,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibilityStore } from '../../../shared/stores/accessibilityStore';
import { apiClient } from '../../../infrastructure/http/apiClient';

export function ProfileScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const easyMode = useAccessibilityStore((s) => s.easyMode);
  const toggleEasyMode = useAccessibilityStore((s) => s.toggleEasyMode);
  
  const { width } = useWindowDimensions();

  const btnScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  const avatarSize = Math.min(width * 0.25, 120);
  const dynamicPadding = width * 0.06;

  // Editar perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState(usuario?.nombre ?? '');
  const [editEmail, setEditEmail] = useState(usuario?.email ?? '');
  const [editLoading, setEditLoading] = useState(false);

  // Cambiar contraseña (dentro del modal editar)
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!editNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    if (!editEmail.trim()) {
      Alert.alert('Error', 'El correo es obligatorio.');
      return;
    }
    setEditLoading(true);
    try {
      await apiClient.patch('/auth/me', { nombre: editNombre.trim(), email: editEmail.trim() });
      useAuthStore.getState().updateProfile({ nombre: editNombre.trim(), email: editEmail.trim() });
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      setShowEditModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Ingresa tu contraseña actual.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }
    setPasswordLoading(true);
    try {
      await apiClient.patch('/usuarios/me/password', { currentPassword, newPassword });
      Alert.alert('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const InfoRow = ({ iconName, label, value }: { iconName: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={iconName as any} size={22} color="#64748b" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
            ]}
          >
            <Text style={[styles.avatarInitial, { fontSize: avatarSize * 0.4 }]}>
              {usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'M'}
            </Text>
          </LinearGradient>
          <Text style={styles.greeting}>
            Hola, {usuario?.nombre?.split(' ')[0] ?? 'Usuario'}
          </Text>
        </View>

        {/* Tarjeta de Datos del Usuario con lápiz de editar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mis datos</Text>
            <Pressable onPress={() => setShowEditModal(true)} style={styles.editBtn}>
              <Ionicons name="pencil" size={18} color="#fff" />
            </Pressable>
          </View>
          <InfoRow 
            iconName="person-outline" 
            label="Nombre completo" 
            value={usuario?.nombre ?? 'No especificado'} 
          />
          <View style={styles.divider} />
          <InfoRow 
            iconName="mail-outline" 
            label="Correo electrónico" 
            value={usuario?.email ?? 'correo@ejemplo.com'} 
          />
        </View>

        {/* Tarjeta Modo Fácil — más llamativa */}
        <Pressable onPress={toggleEasyMode}>
          <LinearGradient
            colors={easyMode ? ['#047857', '#10b981', '#34d399'] : ['#f0fdf4', '#d1fae5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.accessCard, easyMode ? styles.accessCardActive : styles.accessCardInactive]}
          >
            <View style={styles.accessRow}>
              <View style={[styles.accessIconBox, easyMode && styles.accessIconBoxActive]}>
                <Ionicons 
                  name={easyMode ? "accessibility" : "accessibility-outline"} 
                  size={28} 
                  color={easyMode ? '#fff' : '#10b981'} 
                />
              </View>
              <View style={styles.accessTextWrap}>
                <Text style={[styles.accessTitle, easyMode && styles.accessTitleActive]}>
                  Modo fácil
                </Text>
                <Text style={[styles.accessDesc, easyMode && styles.accessDescActive]}>
                  Botones grandes, guía por voz e instrucciones paso a paso
                </Text>
              </View>
              <View style={[styles.switchWrap, easyMode && styles.switchWrapActive]}>
                <Switch
                  value={easyMode}
                  onValueChange={toggleEasyMode}
                  trackColor={{ false: '#e2e8f0', true: '#6ee7b7' }}
                  thumbColor={easyMode ? '#fff' : '#94a3b8'}
                />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.spacer} />

        {/* Botón de Cerrar Sesión */}
        <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
          <Pressable
            onPress={logout}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color="#e11d48" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Modal Editar Perfil + Cambiar Contraseña */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
            <Text style={styles.modalTitle}>Editar perfil</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                value={editNombre}
                onChangeText={setEditNombre}
                placeholder="Tu nombre"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Cambiar contraseña — expandible */}
            <Pressable style={styles.passwordToggle} onPress={() => setShowPasswordSection(!showPasswordSection)}>
              <Ionicons name={showPasswordSection ? "lock-open" : "lock-closed"} size={20} color="#059669" />
              <Text style={styles.passwordToggleText}>Cambiar contraseña</Text>
              <Ionicons name={showPasswordSection ? "chevron-up" : "chevron-down"} size={18} color="#94a3b8" />
            </Pressable>

            {showPasswordSection && (
              <View style={styles.passwordSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contraseña actual</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Ingresa tu contraseña actual"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repite la nueva contraseña"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <Pressable
                  style={[styles.passwordSaveBtn, passwordLoading && styles.btnDisabled]}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  <Text style={styles.passwordSaveText}>
                    {passwordLoading ? 'Guardando...' : 'Actualizar contraseña'}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, editLoading && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                <Text style={styles.saveBtnText}>{editLoading ? 'Guardando...' : 'Guardar cambios'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, paddingTop: 20, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginBottom: 28 },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitial: { fontWeight: 'bold', color: '#ffffff' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1, justifyContent: 'center' },
  labelText: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  valueText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8, marginLeft: 62 },

  // Modo fácil
  accessCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
  },
  accessCardActive: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  accessCardInactive: {
    borderColor: '#6ee7b7',
    backgroundColor: '#f0fdf4',
  },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accessIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  accessIconBoxActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  accessTextWrap: { flex: 1 },
  accessTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  accessTitleActive: { color: '#fff' },
  accessDesc: { fontSize: 12, color: '#047857', lineHeight: 16, fontWeight: '500' },
  accessDescActive: { color: '#d1fae5' },
  switchWrap: { marginLeft: 4 },
  switchWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
  },

  spacer: { flex: 1, minHeight: 40 },

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
  logoutText: { color: '#e11d48', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '80%',
    marginTop: 40,
  },
  modalContentInner: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
  },

  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 8,
  },
  passwordToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  passwordSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  passwordSaveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: '#64748b' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: '#fff' },
});
