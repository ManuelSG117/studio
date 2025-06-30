import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
import { ThemeProvider } from "next-themes"; // Import ThemeProvider
import { Analytics } from "@vercel/analytics/next";
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '+Seguro',
  description: 'Plataforma de reportes de seguridad y prevención de incidentes en Uruapan',
  icons: {
    icon: '/logo.webp'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased bg-secondary`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <Analytics/>
          <AuthProvider> {/* Wrap the entire application with AuthProvider */}
            {children}
            <Toaster /> {/* Add Toaster here */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
