import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from '@/components/Providers';
import { AppBootstrap } from '@/components/AppBootstrap';

export const metadata: Metadata = {
  title: 'Pattern Typing',
  description: 'Pattern Typing — learn and type with smart control',
  icons: {
    icon: [
      { url: '/icon/web/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon/web/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon/web/favicon.ico' }
    ],
    apple: [
      { url: '/icon/web/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6TLYE95JN5"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} 
  gtag('js', new Date());

  gtag('config', 'G-6TLYE95JN5');
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <AppBootstrap>
            <main>{children}</main>
          </AppBootstrap>
        </Providers>
      </body>
    </html>
  );
}
