type ApiConfig = {
  apiBaseUrl: string;
};

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Expo Go en un dispositivo físico NO puede usar localhost.
// - Android emulator: http://10.0.2.2:3000/api
// - iOS simulator: http://localhost:3000/api
const fallbackApiBaseUrl = 'http://10.0.2.2:3000/api';

export const env: ApiConfig = {
  apiBaseUrl: (rawApiUrl && rawApiUrl.trim()) || fallbackApiBaseUrl,
};