"use client";

import type { FC, ReactElement } from 'react';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, User, FileText, ShieldAlert, Globe, BarChart3, Menu, X, LogOut, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Image from 'next/image';
import { useTheme } from "next-themes"; // Import useTheme

interface NavLinkItem {
  href: string;
  label: string;
  icon: ReactElement;
}

const navLinks: NavLinkItem[] = [
  { href: "/welcome", label: "Mis Reportes", icon: <FileText className="h-5 w-5" /> },
  { href: "/community-reports", label: "Reportes en Uruapan", icon: <Globe className="h-5 w-5" /> },
  { href: "/danger-zones", label: "Zonas de Riesgo", icon: <ShieldAlert className="h-5 w-5" /> },
  { href: "/statistics", label: "Estadísticas", icon: <BarChart3 className="h-5 w-5" /> },
  { href: "/profile", label: "Mi Perfil", icon: <User className="h-5 w-5" /> },
];

const DesktopNavItem: FC<NavLinkItem & { isActive: boolean }> = ({ href, label, icon, isActive }) => {
  return (
    <Link
      href={href}
      className={cn(
        "transition-all duration-300 px-4 py-2 rounded-full flex items-center gap-1.5 hover:scale-105 text-sm font-medium whitespace-nowrap",
        isActive
          ? "bg-primary/15 text-primary ring-1 ring-primary/20 shadow-inner"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {React.cloneElement(icon, { className: "h-4 w-4"})}
      {label}
    </Link>
  );
};

export const TopNavBar: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);
  const { resolvedTheme } = useTheme(); // Get the resolved theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserName(user.displayName || 'Usuario +Seguro');
      setUserEmail(user.email);
      setUserPhotoURL(user.photoURL);
    } else if (!authLoading) {
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
      setIsSheetOpen(false);
      router.push("/");
    } catch (error) {
    //  console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Error al Cerrar Sesión",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      });
    }
  };

  const isLogoActive = pathname === "/about-creator";

  if (!mounted) { // Prevent rendering until theme is resolved on client
    return ( // Render a placeholder or simplified navbar during server-side rendering
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between md:justify-center px-4 md:px-8 bg-background/80 backdrop-blur-md shadow-sm border-b border-border/30 md:bg-transparent md:shadow-none md:border-none md:backdrop-blur-none">
        {/* Placeholder for mobile logo */}
        <div className="md:hidden flex items-center">
          <div className="h-7 w-7 bg-muted rounded-full mr-2 animate-pulse"></div>
          <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        {/* Placeholder for desktop nav */}
        <div className="hidden md:flex">
          <div className="h-10 w-64 bg-muted rounded-full animate-pulse"></div>
        </div>
        {/* Placeholder for mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-9 h-9 bg-muted rounded-full animate-pulse"></div>
          <div className="w-9 h-9 bg-muted rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  const logoSrc = resolvedTheme === 'dark' ? '/logo_dark.webp' : '/logo.webp';

  // Función para obtener el label de la vista actual
  const getCurrentViewLabel = () => {
    // Rutas principales
    const found = navLinks.find((item) =>
      item.href === '/' ? pathname === item.href : pathname?.startsWith(item.href)
    );
    if (found) return found.label;
    // Rutas especiales
    if (pathname === '/about-creator') return '+Seguro';
    if (pathname === '/faq') return 'Preguntas Frecuentes';
    if (pathname === '/privacy-policy') return 'Política de Privacidad';
    if (pathname === '/reports/new') return 'Crear Reporte';
    if (pathname === '/profile/edit') return 'Editar Perfil';
    if (pathname?.startsWith('/reports/')) return 'Detalles de Reporte';
    if (pathname === '/achievements') return 'Logros';
    // Fallback
    return '+Seguro';
  };

  return (
    <header className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between md:justify-center px-4 md:px-8 transition-all duration-300',
      'bg-background/80 backdrop-blur-md shadow-sm border-b border-border/30 md:bg-transparent md:shadow-none md:border-none md:backdrop-blur-none'
    )}>
       <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out hidden md:flex",
         "opacity-100 translate-y-0 pointer-events-auto"
      )}>
        <nav className="flex items-center gap-2 whitespace-nowrap text-sm font-medium rounded-full bg-background/70 px-3 py-2.5 shadow-xl backdrop-blur-lg border border-border/50 transition-all duration-300 ease-in-out scale-100">
            <Link
                href="/about-creator"
                className={cn(
                "transition-all duration-300 px-3 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 font-semibold",
                isLogoActive
                    ? "bg-primary/20 text-primary shadow-inner ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                aria-current={isLogoActive ? 'page' : undefined}
            >
                 <Image src={logoSrc} alt="+Seguro Logo" width={24} height={24} data-ai-hint="app logo"/>
                 +Seguro
            </Link>

          {navLinks.map((item) => {
             const isActive = item.href === '/' ? pathname === item.href : pathname?.startsWith(item.href);
             return <DesktopNavItem key={item.href} {...item} isActive={isActive} />;
          })}
          <ThemeToggle />
        </nav>
      </div>


      {/* Mobile View: Logo on left, Menu button on right */}
      <div className="md:hidden flex items-center justify-between w-full">
         <Link href="/about-creator" className="text-xl font-bold text-primary flex items-center">
            <Image src={logoSrc} alt="+Seguro Logo" width={28} height={28} className="mr-2" data-ai-hint="app logo small"/>
            <span className="truncate max-w-[140px]">{getCurrentViewLabel()}</span>
        </Link>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground rounded-full w-9 h-9 hover:bg-primary/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 flex flex-col bg-background text-foreground border-l border-border/50 shadow-2xl">
                {isAuthenticated && user && (
                <div className="p-4 border-b border-border">
                    <Link href="/profile" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                        <AvatarImage src={userPhotoURL || undefined} alt="Foto de perfil" data-ai-hint="user avatar"/>
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
                 <SheetClose asChild>
                    <Link
                        href="/about-creator"
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-all duration-150 ease-in-out",
                            isLogoActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setIsSheetOpen(false)}
                        >
                        <Info className="h-5 w-5" />
                        <span>Sobre +Seguro</span>
                    </Link>
                  </SheetClose>
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
                 {!isAuthenticated && !authLoading && (
                     <div className="mt-auto p-3 border-t border-border">
                        <SheetClose asChild>
                            <Button variant="default" className="w-full" onClick={() => { router.push('/auth'); setIsSheetOpen(false);}}>
                                Iniciar Sesión / Registrarse
                            </Button>
                        </SheetClose>
                    </div>
                 )}
            </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
};

export { TopNavBar as BottomNavBar };
