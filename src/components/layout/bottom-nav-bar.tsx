"use client";

import type { FC, ReactElement } from 'react';
import React from 'react'; // Import React
import { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, FileText, ShieldAlert, Globe, BarChart3, Menu, X, LogOut, Settings } from 'lucide-react'; // Added LogOut, Settings
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { signOut } from 'firebase/auth'; // Import signOut
import { auth } from '@/lib/firebase/client'; // Import auth
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useRouter } from 'next/navigation'; // Import useRouter

interface NavLinkItem {
  href: string;
  label: string;
  icon: ReactElement; // Expect a ReactElement for icon
}

const navLinks: NavLinkItem[] = [
  { href: "/welcome", label: "Mis Reportes", icon: <FileText className="h-5 w-5" /> },
  { href: "/community-reports", label: "Comunidad", icon: <Globe className="h-5 w-5" /> },
  { href: "/danger-zones", label: "Zonas", icon: <ShieldAlert className="h-5 w-5" /> },
  { href: "/statistics", label: "Estadísticas", icon: <BarChart3 className="h-5 w-5" /> },
  { href: "/profile", label: "Perfil", icon: <User className="h-5 w-5" /> },
];

const DesktopNavItem: FC<NavLinkItem> = ({ href, label, icon }) => {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 p-2 text-xs transition-colors duration-150",
        isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary/80'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <span className="mt-1 sm:inline">{label}</span>
    </Link>
  );
};

export const TopNavBar: FC = () => {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router
  const { toast } = useToast(); // Initialize toast
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get user from AuthContext
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.displayName || 'Usuario +Seguro');
      setUserEmail(user.email);
      setUserPhotoURL(user.photoURL);
    } else if (!authLoading) {
      // If not authenticated and not loading, clear user info
      setUserName(null);
      setUserEmail(null);
      setUserPhotoURL(null);
    }
  }, [user, isAuthenticated, authLoading]);


  const getInitials = (name?: string | null): string => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
    return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      setIsSheetOpen(false); // Close sheet after logout
      router.push("/"); // Redirect to home or login page
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Error al Cerrar Sesión",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      });
    }
  };


  return (
    <nav className="sticky top-0 left-0 right-0 h-16 bg-card border-b border-border shadow-sm flex items-center z-50">
      {/* Mobile View: Logo on left, Menu button on right */}
      <div className="sm:hidden flex items-center justify-between w-full px-4">
        <Link href="/welcome" className="text-xl font-bold text-primary flex items-center">
          <ShieldAlert className="h-6 w-6 mr-2 text-primary" /> {/* App logo/icon */}
          +Seguro
        </Link>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-0 flex flex-col bg-background text-foreground">
            {/* User Profile Section */}
            {isAuthenticated && user && (
              <div className="p-4 border-b border-border">
                <Link href="/profile" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={userPhotoURL || undefined} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
                    <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </Link>
                 <p className="text-xs text-muted-foreground mt-2">
                  Miembro activo de la comunidad +Seguro.
                </p>
              </div>
            )}

            <nav className="flex-1 mt-4 flex flex-col gap-1 px-2 overflow-y-auto">
              {navLinks.map(({ href, label, icon }) => {
                const isActive = href === '/' ? pathname === href : pathname?.startsWith(href);
                return (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-all duration-150 ease-in-out",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {React.cloneElement(icon, { className: "h-5 w-5" })}
                      <span>{label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
            {/* Footer with Settings and Logout */}
             {isAuthenticated && (
                <div className="mt-auto p-3 border-t border-border">
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground mb-1" onClick={() => { router.push('/profile/edit'); setIsSheetOpen(false); }}>
                            <Settings className="h-5 w-5 mr-3" />
                            Configuración
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                            <LogOut className="h-5 w-5 mr-3" />
                            Cerrar Sesión
                        </Button>
                    </SheetClose>
                </div>
             )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View: Horizontal navigation items */}
      <div className="hidden sm:flex items-stretch justify-around w-full">
        {navLinks.map((item) => (
          <DesktopNavItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
};

// Exporting with the old name for compatibility if it was used elsewhere,
// though direct usage of TopNavBar is preferred.
export { TopNavBar as BottomNavBar };
