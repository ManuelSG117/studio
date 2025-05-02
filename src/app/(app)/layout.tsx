
import type { ReactNode } from 'react';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // Wrap the layout content with AuthProvider
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow pb-16 sm:pb-0"> {/* Add padding-bottom to prevent content overlap with fixed nav bar on mobile */}
          {children}
        </main>
        <BottomNavBar />
      </div>
    </AuthProvider>
  );
}
