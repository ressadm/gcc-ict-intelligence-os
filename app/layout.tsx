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
      <head>
        {/* Inline FOUC-prevention: read theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{var t=localStorage.getItem('gcc-ict-theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark');d.classList.add('light');}else{d.classList.add('dark');d.classList.remove('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
