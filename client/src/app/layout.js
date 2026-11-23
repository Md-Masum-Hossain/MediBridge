import { Plus_Jakarta_Sans, Hind_Siliguri } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0B4F4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'MediBridge - Smart Clinical Prescription & Pharmacy Assistant',
  description:
    'AI-powered clinical prescription digitization, dual-mode medication alarms, and real-time pharmacy proximity matching in Bangladesh.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MediBridge',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${hindSiliguri.variable}`}>
      <head>
        <meta name="application-name" content="MediBridge" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediBridge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-background text-primaryText min-h-screen flex flex-col font-sans selection:bg-brand-light selection:text-brand">
        {children}
      </body>
    </html>
  );
}
