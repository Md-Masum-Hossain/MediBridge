import './globals.css';

export const metadata = {
  title: 'MediBridge - Smart Clinical Prescription & Pharmacy Assistant',
  description:
    'AI-powered clinical prescription digitization, dual-mode medication alarms, and real-time pharmacy proximity matching.',
  manifest: '/manifest.json',
  themeColor: '#0B4F4A',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-primaryText min-h-screen flex flex-col font-sans selection:bg-brand-light selection:text-brand">
        {children}
      </body>
    </html>
  );
}
