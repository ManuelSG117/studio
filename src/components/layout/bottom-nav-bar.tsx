
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
  const pathname = usePathname();

  // Determine the current page title based on the pathname
  const getPageTitle = (path: string | null): string => {
    if (!path) return '+Seguro';
    if (path.startsWith('/welcome')) return 'Mis Reportes';
    if (path.startsWith('/community-reports')) return 'Comunidad';
    if (path.startsWith('/danger-zones')) return 'Zonas de Peligro';
    if (path.startsWith('/profile')) return 'Perfil';
    if (path.startsWith('/reports/new')) return 'Nuevo Reporte';
    if (path.startsWith('/reports/')) return 'Detalles del Reporte'; // Specific detail view
    return '+Seguro'; // Default title
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <nav className="sticky top-0 left-0 right-0 h-16 bg-card border-b border-border shadow-md flex items-stretch justify-between z-50 px-4 sm:px-6">
       {/* Page Title */}
       <div className="flex items-center">
           <h1 className="text-lg font-semibold text-primary">{pageTitle}</h1>
       </div>

      {/* Navigation Items */}
       <div className="flex items-stretch justify-around flex-grow max-w-xs sm:max-w-sm">
         {/* Changed /welcome to /reports to be more intuitive */}
         <NavItem href="/welcome" label="Mis Reportes" icon={<FileText className="h-5 w-5" />} />
         <NavItem href="/community-reports" label="Comunidad" icon={<Globe className="h-5 w-5" />} /> {/* Added Community Reports */}
         <NavItem href="/danger-zones" label="Zonas" icon={<ShieldAlert className="h-5 w-5" />} />
         <NavItem href="/profile" label="Perfil" icon={<User className="h-5 w-5" />} />
       </div>
       {/* Placeholder to balance the layout if needed, or add another icon like settings */}
       <div className="flex items-center w-10 sm:w-12"> {/* Adjust width as needed */}
           {/* Optionally add settings or notifications icon here */}
       </div>
    </nav>
  );
};

// Export the component with the new name
export { TopNavBar as BottomNavBar };
