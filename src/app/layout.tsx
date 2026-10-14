import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getMetadataBase, SITE_NAME, SITE_DESCRIPTION } from '@/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${SITE_NAME} — Transfer Speed & Time Calculators`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
  },
  verification: {
    google: 'YyXUgilzA2nvONMtj1Ve520bHHcxxQ3hyt5bS-WDd6Q',
  },
  other: {
    'google-adsense-account': 'ca-pub-5994028801063205',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
