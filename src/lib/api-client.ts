import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:4000`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:4000';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Inject JWT token & active Company ID header, and adapt baseURL dynamically
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      config.baseURL = getApiBaseUrl();

      const token = localStorage.getItem('etms_access_token');
      const activeCompanyId = localStorage.getItem('etms_active_company_id');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (activeCompanyId && activeCompanyId !== 'undefined' && activeCompanyId !== 'null') {
        config.headers['x-company-id'] = activeCompanyId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data payload or handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns standard envelope { success: true, data: ..., meta: ... }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // Token expired or invalid
        localStorage.removeItem('etms_access_token');
        // Do not force harsh redirect during dev, allow smooth login
      }
    }
    const errorData = error.response?.data as { message?: string; error?: string } | undefined;
    const message =
      errorData?.message ||
      errorData?.error ||
      error.message ||
      'API Request failed';
    return Promise.reject(new Error(message));
  }
);
