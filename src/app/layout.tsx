
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

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
  description: 'Plataforma de reportes de seguridad y prevención de incidentes en Uruapan', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning> {/* Added lang="es" and suppressHydrationWarning */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-secondary`}> {/* Use secondary as body background */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider> {/* Wrap the entire application with AuthProvider */}
            {children}
            <Toaster /> {/* Add Toaster here */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
