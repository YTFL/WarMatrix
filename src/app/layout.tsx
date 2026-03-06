import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WarMatrix Console',
  description: 'Strategic Battlefield Command Console',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-body antialiased bg-[#0A0F1C] text-[#E5E7EB] h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
