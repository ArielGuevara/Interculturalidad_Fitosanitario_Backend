import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../../shared/config/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

// Request interceptor to attach token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('fitosanitario.token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (like 401)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Optionally, you could try to refresh the token here
      // For now, we'll just log out the user
      // Note: We are not implementing token refresh in this example
      // You would need to implement a refresh token endpoint and logic
      // For simplicity, we log out and redirect to login
      // However, we cannot directly navigate from here, so we'll emit an event or use a store
      // For now, we'll just reject the error and let the components handle 401
      // Alternatively, we can clear the storage and redirect via a global state
      // Let's clear the storage and then the authStore will update
      await AsyncStorage.removeItem('fitosanitario.token');
      await AsyncStorage.removeItem('fitosanitario.user');
      // Note: We are not redirecting here because we are in an interceptor.
      // The component that made the request will receive a 401 error and can handle it.
      // We'll just clear the storage and let the app's auth state handle the rest.
    }
    return Promise.reject(error);
  }
);