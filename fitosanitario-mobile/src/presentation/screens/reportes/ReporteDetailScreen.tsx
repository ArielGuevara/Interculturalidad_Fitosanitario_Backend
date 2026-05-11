import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../../infrastructure/auth/authStore';
import { getReporteById } from '../../../infrastructure/data/reportes/reportesApi';

type Props = NativeStackScreenProps<AppStackParamList, 'ReporteDetail'>;

export function ReporteDetailScreen({ route }: Props) {
  const { id } = route.params as { id: number };
  const usuario = useAuthStore((s) => s.usuario);
  const [reporte, setReporte] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadReporte = async () => {
      try {
        const data = await getReporteById(id);
        setReporte(data);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    };

    loadReporte();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white p-4">
        <Text className="text-center">Cargando...</Text>
      </View>
    );
  }

  if (!reporte) {
    return (
      <View className="flex-1 bg-white p-4">
        <Text className="text-center">Reporte no encontrado</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-semibold text-slate-900">{reporte.titulo}</Text>
      <Text className="mt-2 text-slate-600">Fecha: {new Date(reporte.fecha).toLocaleDateString()}</Text>
      <Text className="mt-1 text-slate-600">Cultivo: {reporte.cultivoId}</Text>
      <Text className="mt-1 text-slate-600">Usuario: {reporte.usuarioId}</Text>
      {!!reporte.descripcion && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-slate-900">Descripción</Text>
          <Text className="mt-1 text-slate-600">{reporte.descripcion}</Text>
        </View>
      )}
      {!!reporte.observaciones && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-slate-900">Observaciones</Text>
          <Text className="mt-1 text-slate-600">{reporte.observaciones}</Text>
        </View>
      )}
      {!!reporte.fotoUrl && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-slate-900">Foto</Text>
          {/* Image component would go here */}
          <Text className="text-slate-500">[Foto disponible]</Text>
        </View>
      )}
      {!!reporte.audioUrl && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-slate-900">Audio</Text>
          {/* Audio component would go here */}
          <Text className="text-slate-500">[Audio disponible]</Text>
        </View>
      )}

      {usuario?.id === reporte.usuarioId && (
        <Pressable
          className="mt-6 rounded-xl bg-emerald-600 px-4 py-4"
          onPress={() => Alert.alert('En desarrollo', 'Funcionalidad de edición pendiente')}
        >
          <Text className="text-center font-semibold text-white">Editar</Text>
        </Pressable>
      )}
    </View>
  );
}