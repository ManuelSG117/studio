
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, FileText, ShieldAlert, Globe, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem: FC<NavItemProps> = ({ href, label, icon }) => {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 p-2 text-xs transition-colors duration-150", // text-xs for mobile icon label
        isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary/80'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      {/* Hide label on xs screens, show on sm and larger */}
      <span className="mt-1 hidden sm:inline">{label}</span>
      {/* Show a more compact label or potentially just icon on very small screens if preferred */}
      {/* <span className="mt-1 sm:hidden text-[10px]">{label.substring(0,3)}</span>  // Example for very short label */}
    </Link>
  );
};

export const TopNavBar: FC = () => {
  return (
    <nav className="sticky top-0 left-0 right-0 h-16 bg-card border-b border-border shadow-sm flex items-stretch justify-around z-50">
      <NavItem href="/welcome" label="Mis Reportes" icon={<FileText className="h-5 w-5" />} />
      <NavItem href="/community-reports" label="Comunidad" icon={<Globe className="h-5 w-5" />} />
      <NavItem href="/danger-zones" label="Zonas" icon={<ShieldAlert className="h-5 w-5" />} />
      <NavItem href="/statistics" label="Estadísticas" icon={<BarChart3 className="h-5 w-5" />} />
      <NavItem href="/profile" label="Perfil" icon={<User className="h-5 w-5" />} />
    </nav>
  );
};

export { TopNavBar as BottomNavBar };

    