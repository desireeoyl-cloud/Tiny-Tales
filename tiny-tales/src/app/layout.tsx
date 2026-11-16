import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/nunito/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tiny Tales',
  description: 'Turn a real moment from your child’s day into a calm bedtime story you read together.',
  applicationName: 'Tiny Tales',
  appleWebApp: { capable: true, title: 'Tiny Tales', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#241b3b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body data-mode="day">{children}</body>
    </html>
  );
}
