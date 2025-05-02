
import type { ReactNode } from 'react';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar'; // Import the new nav bar

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-16 sm:pb-0"> {/* Add padding-bottom to prevent content overlap with fixed nav bar on mobile */}
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
