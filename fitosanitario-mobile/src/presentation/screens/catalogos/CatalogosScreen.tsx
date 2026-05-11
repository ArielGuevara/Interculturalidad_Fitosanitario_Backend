import React from 'react';
import { Pressable, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Si usas lucide-react-native o heroicons, se vería mucho mejor. 
// Aquí usaré emojis para mantener el código ligero, pero te sugiero iconos vectoriales.

export function CatalogosScreen() {
  const navigation = useNavigation<any>();

  const CatalogItem = ({ title, description, icon, route, color }: any) => (
    <Pressable
      onPress={() => navigation.navigate(route)}
      className="mb-4 flex-row items-center rounded-3xl border border-slate-100 bg-white p-5 shadow-sm active:bg-slate-50"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className={`h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
        <Text className="text-2xl">{icon}</Text>
      </View>
      
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-slate-800">{title}</Text>
        <Text className="text-xs text-slate-500">{description}</Text>
      </View>

      <View className="ml-2">
        <Text className="text-xl text-slate-300">›</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-6 pt-8">
        {/* Header Section */}
        <View className="mb-8">
          
          <View className="mt-2 flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-slate-500 font-medium">Modo offline habilitado</Text>
          </View>
        </View>

        {/* Catalog List */}
        <View className="pb-10">
          <CatalogItem
            title="Cultivos"
            description="Variedades, ciclos y requerimientos"
            icon="🌽"
            route="Cultivos"
            color="bg-amber-100"
          />

          <CatalogItem
            title="Plagas y Enfermedades"
            description="Identificación y umbrales de daño"
            icon="🐛"
            route="Plagas"
            color="bg-rose-100"
          />

          <CatalogItem
            title="Productos"
            description="Fitosanitarios y fichas técnicas"
            icon="🧪"
            route="Productos"
            color="bg-emerald-100"
          />

          {/* Tarjeta Informativa Extra */}
          <View className="mt-6 rounded-3xl bg-emerald-900 p-6 shadow-xl shadow-emerald-900/20">
            <Text className="text-white font-bold text-lg">Tip de Campo</Text>
            <Text className="text-emerald-100 text-sm mt-2 leading-5">
              Recuerda sincronizar tus datos antes de salir a zonas sin cobertura para tener la información actualizada.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}