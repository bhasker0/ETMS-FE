import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ConfigProvider } from '@/lib/config-context';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { I18nProvider } from '@/lib/i18n';
import { RoleProvider } from '@/lib/role-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { BroadcastingAlertsBanner } from '@/components/BroadcastingAlertsBanner';
import { AppDrawerProvider } from '@/lib/app-drawer-context';
import { AppDrawer } from '@/components/AppDrawer';
import { SpotlightCommandPalette } from '@/components/organisms/SpotlightCommandPalette';
import { FloatingVoiceTrigger } from '@/components/FloatingVoiceTrigger';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Surat Embroidery Micro-ERP (SAC 9988)',
  description: 'Clean Minimalist Micro-ERP for Surat Embroidery Factory Owners, Karigars & Munims',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ETMS Surat',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F7F6F3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700;800&family=Geist:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-[100dvh] bg-[var(--bg-canvas)] text-[var(--text-main)] antialiased selection:bg-[#111111] selection:text-white font-sans">
        <ErrorBoundary>
          <AuthProvider>
            <ConfigProvider>
              <FeatureFlagsProvider>
                <I18nProvider>
                  <RoleProvider>
                    <AppDrawerProvider>
                      <div className="flex min-h-[100dvh] flex-col bg-[var(--bg-canvas)]">
                        <Navbar />
                        <BroadcastingAlertsBanner />
                        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24">
                          {children}
                        </main>
                        <AppDrawer />
                        <SpotlightCommandPalette />
                        <FloatingVoiceTrigger />
                        <Toaster richColors position="top-right" />
                      </div>
                    </AppDrawerProvider>
                  </RoleProvider>
                </I18nProvider>
              </FeatureFlagsProvider>
            </ConfigProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
