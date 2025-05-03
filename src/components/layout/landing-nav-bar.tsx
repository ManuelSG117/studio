
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
// Import icons for the navbar links
import { LogIn, Home, HelpCircle, Workflow, MapPin, Shield } from 'lucide-react';

const LandingNavBar: FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null); // State for active section

  // Function to calculate section offsets
  const getSectionOffsets = () => {
    // Include 'top' for the +Seguro link
    const sections = ['top', 'what-we-do', 'how-it-works', 'risk-map'];
    const offsets: { [key: string]: number } = {};
    sections.forEach(id => {
      if (id === 'top') {
        offsets[id] = 0; // Top of the page
      } else {
        const element = document.getElementById(id);
        if (element) {
            // Adjust offset slightly to account for navbar height if needed
            offsets[id] = element.offsetTop - 80; // 80px is navbar height + buffer
        }
      }
    });
    return offsets;
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Navbar becomes visible after scrolling down more than 10px
      setScrolled(scrollPosition > 10);

      // Determine active section based on scroll position
      const offsets = getSectionOffsets();
      let currentSection: string | null = 'top'; // Default to top
      const buffer = 100; // Adjust buffer as needed

      // Check sections in reverse order to prioritize lower sections
      const sortedSections = Object.entries(offsets).sort(([, a], [, b]) => a - b); // Sort by offset ascending

       for (const [id, offset] of sortedSections) {
         if (scrollPosition >= offset - buffer) {
           currentSection = id;
         } else {
             break; // Stop checking once we are above a section
         }
       }

       // Handle edge case where scroll is exactly 0 or near top
        if (scrollPosition < buffer / 2) { // Use smaller buffer for top detection
           currentSection = 'top';
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
    if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 80, // Adjust for fixed navbar height + potential margin
            behavior: 'smooth',
          });
        }
    }
     // Update hash in URL without triggering full navigation (optional)
     // history.pushState(null, '', `#${id}`);
  };

  // Helper to determine if a link is active
  const isLinkActive = (id: string) => activeSection === id;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center px-4 md:px-8 transition-all duration-300 pointer-events-none', // Add pointer-events-none to header
        // Apply background/blur only when scrolled for the container
        scrolled ? 'bg-muted/80 backdrop-blur-sm shadow-sm border-b border-border pointer-events-auto' : 'bg-transparent' // Re-enable pointer-events when scrolled
      )}
    >
      {/* Desktop Navigation in Pill Container - Centered */}
      {/* Visibility controlled by opacity and pointer-events based on scroll */}
      <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 hidden md:flex",
        scrolled ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none" // Control visibility of inner nav
      )}>
        <nav className={cn(
             "flex items-center gap-1 text-sm font-medium rounded-full p-1.5 transition-all duration-300",
             // Apply background/shadow only when scrolled for the inner nav
             scrolled ? "bg-background/80 shadow-md border border-border" : "bg-transparent"
         )}>

            {/* +Seguro Link (Home/Top) */}
             <Link
               href="#top" // Link to top of the page
               onClick={handleScrollTo('top')}
               className={cn(
                 "transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5",
                 isLinkActive('top')
                   ? "bg-primary/10 text-primary font-medium" // Active state style
                   : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
               )}
               aria-current={isLinkActive('top') ? 'page' : undefined}
             >
                <Shield className="h-4 w-4 opacity-80" /> {/* Changed Icon */}
                +Seguro
             </Link>


          {/* What We Do Link */}
          <Link
            href="#what-we-do"
            onClick={handleScrollTo('what-we-do')}
            className={cn(
              "transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5",
              isLinkActive('what-we-do')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
            aria-current={isLinkActive('what-we-do') ? 'page' : undefined}
          >
             <HelpCircle className="h-4 w-4 opacity-80" /> {/* Added Icon */}
            ¿Qué hacemos?
          </Link>

          {/* How It Works Link */}
          <Link
            href="#how-it-works"
            onClick={handleScrollTo('how-it-works')}
             className={cn(
              "transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5",
              isLinkActive('how-it-works')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
            aria-current={isLinkActive('how-it-works') ? 'page' : undefined}
          >
             <Workflow className="h-4 w-4 opacity-80" /> {/* Added Icon */}
            ¿Cómo funciona?
          </Link>

          {/* Risk Map Link */}
          <Link
            href="#risk-map"
            onClick={handleScrollTo('risk-map')}
             className={cn(
              "transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5",
              isLinkActive('risk-map')
                ? "bg-primary/10 text-primary font-medium" // Active state style
                : "text-muted-foreground hover:text-primary hover:bg-primary/5" // Inactive state style
            )}
            aria-current={isLinkActive('risk-map') ? 'page' : undefined}
          >
             <MapPin className="h-4 w-4 opacity-80" /> {/* Added Icon */}
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

      {/* Mobile Menu Trigger - Always visible if needed */}
       <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden pointer-events-auto"> {/* Ensure this can always be clicked */}
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
