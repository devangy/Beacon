import axios from 'axios';
// import * as SecureStore from 'expo-secure-store';
import { getToken } from '@/hooks/authToken';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const res = error.response;
    if (res) {
      if (res.status === 401) {
        console.log('Unauthorized — logging out...');
        // trigger logout, clear SecureStore
      }

      // Show toast, log, or rethrow
      console.log('API Error:', res.data?.message || 'Unknown Error');
    }
    return Promise.reject(error);
  }
);

export default api;
