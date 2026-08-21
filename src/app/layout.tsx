import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ConfigProvider } from '@/lib/config-context';
import { I18nProvider } from '@/lib/i18n';
import { RoleProvider } from '@/lib/role-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { AppDrawerProvider } from '@/lib/app-drawer-context';
import { AppDrawer } from '@/components/AppDrawer';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
  themeColor: '#0099B8',
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
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased selection:bg-[#0099B8] selection:text-white font-sans">
        <ErrorBoundary>
          <AuthProvider>
            <ConfigProvider>
              <I18nProvider>
                <RoleProvider>
                  <AppDrawerProvider>
                    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
                      <Navbar />
                      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-20">
                        {children}
                      </main>
                      <AppDrawer />
                      <Toaster richColors position="top-right" />
                    </div>
                  </AppDrawerProvider>
                </RoleProvider>
              </I18nProvider>
            </ConfigProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
