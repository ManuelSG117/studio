"use client";

import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react'; // Import LogIn icon

const LandingNavBar: FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null); // State for active section

  // Function to calculate section offsets
  const getSectionOffsets = () => {
    const sections = ['what-we-do', 'how-it-works', 'risk-map'];
    const offsets: { [key: string]: number } = {};
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        offsets[id] = element.offsetTop;
      }
    });
    return offsets;
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 10);

      // Determine active section based on scroll position
      const offsets = getSectionOffsets();
      let currentSection: string | null = null;
      const buffer = 150; // Adjust buffer as needed for better detection

      // Check sections in reverse order to prioritize lower sections
      const sortedSections = Object.entries(offsets).sort(([, a], [, b]) => b - a);

      for (const [id, offset] of sortedSections) {
        if (scrollPosition >= offset - buffer) {
          currentSection = id;
          break; // Found the lowest section in view
        }
      }
       setActiveSection(currentSection);
    };

     // Set initial active section based on hash or scroll position
     handleScroll(); // Run once on mount

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const handleScrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveSection(id); // Immediately set active section on click
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Adjust for fixed navbar height + potential margin
        behavior: 'smooth',
      });
       // Update hash in URL without triggering full navigation (optional)
       // history.pushState(null, '', `#${id}`);
    }
  };

  // Helper to determine if a link is active
  const isLinkActive = (id: string) => activeSection === id;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center px-4 md:px-8 transition-all duration-300',
        // Apply background/blur only when scrolled for the container
        scrolled ? 'bg-muted/80 backdrop-blur-sm shadow-sm border-b border-border' : 'bg-transparent'
      )}
    >
      {/* Desktop Navigation in Pill Container - Centered */}
      {/* Always visible, styling changes on scroll handled by parent */}
      <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 hidden md:flex",
        scrolled ? "opacity-100" : "opacity-100" // Keep nav visible, parent handles background
      )}>
        <nav className={cn(
             "flex items-center gap-1 text-sm font-medium rounded-full p-1.5 transition-all duration-300",
             // Apply background/shadow only when scrolled for the inner nav
             scrolled ? "bg-background/80 shadow-md border border-border" : "bg-transparent"
         )}>
          {/* What We Do Link */}
          <Link
            href="#what-we-do"
            onClick={handleScrollTo('what-we-do')}
            className={cn(
              "transition-colors px-4 py-1.5 rounded-full",
              isLinkActive('what-we-do')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
          >
            ¿Qué hacemos?
          </Link>

          {/* How It Works Link */}
          <Link
            href="#how-it-works"
            onClick={handleScrollTo('how-it-works')}
             className={cn(
              "transition-colors px-4 py-1.5 rounded-full",
              isLinkActive('how-it-works')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
          >
            ¿Cómo funciona?
          </Link>

          {/* Risk Map Link */}
          <Link
            href="#risk-map"
            onClick={handleScrollTo('risk-map')}
             className={cn(
              "transition-colors px-4 py-1.5 rounded-full",
              isLinkActive('risk-map')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
          >
            Zonas de Riesgo
          </Link>

          {/* Sign In Link */}
          <Link
            href="/auth"
             className={cn(
                 "transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5",
                 "text-muted-foreground hover:text-primary hover:bg-primary/5" // Consistent inactive style
             )}
          >
            <LogIn className="h-4 w-4 opacity-80" />
            Iniciar Sesión
          </Link>
        </nav>
      </div>

      {/* Mobile Menu Trigger */}
       <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
            {/* Use Link to navigate to auth page on mobile */}
            <Button asChild size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                 <Link href="/auth">
                     <LogIn className="h-5 w-5" />
                     <span className="sr-only">Iniciar Sesión / Registrarse</span>
                 </Link>
            </Button>
            {/* If a full mobile menu is needed later, replace Button with a SheetTrigger */}
       </div>
    </header>
  );
};

export default LandingNavBar;
