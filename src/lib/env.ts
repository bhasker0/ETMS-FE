/**
 * Runtime environment variable validation and type-safe access.
 * Validates required NEXT_PUBLIC_* variables at import time.
 */

interface EnvConfig {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_DEFAULT_LOCALE: 'gu' | 'hi' | 'en';
  NEXT_PUBLIC_API_BASE_URL: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_ENABLE_AUTO_LOGIN: boolean;
  NODE_ENV: 'development' | 'production' | 'test';
}

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    console.warn(`[env] Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

export const env: EnvConfig = {
  NEXT_PUBLIC_APP_NAME: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Surat Embroidery Micro-ERP'),
  NEXT_PUBLIC_APP_VERSION: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  NEXT_PUBLIC_DEFAULT_LOCALE: (getEnvVar('NEXT_PUBLIC_DEFAULT_LOCALE', 'gu') as EnvConfig['NEXT_PUBLIC_DEFAULT_LOCALE']),
  NEXT_PUBLIC_API_BASE_URL: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3002/api'),
  NEXT_PUBLIC_API_URL: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:4000'),
  NEXT_PUBLIC_ENABLE_AUTO_LOGIN: getEnvVar('NEXT_PUBLIC_ENABLE_AUTO_LOGIN', 'false') === 'true',
  NODE_ENV: (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'],
};
