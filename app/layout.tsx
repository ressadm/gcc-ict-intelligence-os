import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GCC ICT Intelligence OS',
  description:
    'Daily strategic intelligence brief for GCC B2B telecom, ICT, cloud, AI, cyber, BPO, GBS, and digital infrastructure executives.',
  applicationName: 'GCC ICT Intelligence OS',
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
