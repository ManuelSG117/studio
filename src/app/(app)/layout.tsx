
import type { ReactNode } from 'react';
import { TopNavBar } from '@/components/layout/bottom-nav-bar'; // Import the renamed TopNavBar
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // Wrap the layout content with AuthProvider
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <TopNavBar /> {/* Use TopNavBar instead of BottomNavBar */}
        <main className="flex-grow pt-0 sm:pt-0"> {/* Remove bottom padding, adjust top padding if needed */}
          {children}
        </main>
        {/* BottomNavBar removed from here */}
      </div>
    </AuthProvider>
  );
}

    