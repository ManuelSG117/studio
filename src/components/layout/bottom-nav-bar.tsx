
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, FileText, ShieldAlert, Globe } from 'lucide-react'; // Added Globe icon
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem: FC<NavItemProps> = ({ href, label, icon }) => {
  const pathname = usePathname();
  // Check if the current path starts with the href.
  // Handles cases like /reports/[id] matching /reports
  // For exact match on /, check specifically
  const isActive = href === '/' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center flex-1 p-2 text-xs sm:text-sm transition-colors duration-150",
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/80'
      )}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
};

// Renamed component to reflect its position
export const TopNavBar: FC = () => {
  return (
    <nav className="sticky top-0 left-0 right-0 h-16 bg-card border-b border-border shadow-md flex items-stretch justify-around z-50">
      {/* Changed /welcome to /reports to be more intuitive */}
      <NavItem href="/welcome" label="Mis Reportes" icon={<FileText className="h-5 w-5" />} />
      <NavItem href="/community-reports" label="Comunidad" icon={<Globe className="h-5 w-5" />} /> {/* Added Community Reports */}
      <NavItem href="/danger-zones" label="Zonas" icon={<ShieldAlert className="h-5 w-5" />} />
      <NavItem href="/profile" label="Perfil" icon={<User className="h-5 w-5" />} />
    </nav>
  );
};

// Export the component with the new name
export { TopNavBar as BottomNavBar };
