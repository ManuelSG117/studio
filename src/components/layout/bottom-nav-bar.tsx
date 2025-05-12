
"use client";

import type { FC, ReactElement } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, FileText, ShieldAlert, Globe, BarChart3, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
          <SheetContent side="right" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2 text-primary">
                <ShieldAlert className="h-5 w-5" /> +Seguro Menú
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-2">
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
