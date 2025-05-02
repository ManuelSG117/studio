
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS globally
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '+Seguro', // Updated title
  description: 'Plataforma de reportes de seguridad y prevención', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-secondary`}> {/* Use secondary as body background */}
        <AuthProvider> {/* Wrap the entire application with AuthProvider */}
          {children}
          <Toaster /> {/* Add Toaster here */}
        </AuthProvider>
      </body>
    </html>
  );
}
