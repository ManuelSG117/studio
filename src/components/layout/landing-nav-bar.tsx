"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { LogIn, Menu} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from "next-themes"; // Import useTheme

const LandingNavBar: FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { resolvedTheme } = useTheme(); // Get the resolved theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Function to calculate section offsets
  const getSectionOffsets = () => {
    // Include 'top' for the +Seguro link
    const sections = ['top', 'what-we-do', 'how-it-works', 'risk-map', 'statistics'];
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
  }, []);

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
  };

  // Helper to determine if a link is active
  const isLinkActive = (id: string) => activeSection === id;

  if (!mounted) { // Prevent rendering until theme is resolved on client
    return null;
  }

  const logoSrc = resolvedTheme === 'dark' ? '/logo_dark.webp' : '/logo.webp';


  return (
    <header
      className={cn(
        // Cambia la clase para igualar el difuminado de la bottom navbar
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center px-4 md:px-8 transition-all duration-500',
        'bg-background/80 backdrop-blur-md shadow-sm border-b border-border/30'
      )}
    >
      {/* Mobile: Logo +Seguro a la izquierda */}
      <div className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
        <Image src={logoSrc} alt="+Seguro Logo" width={28} height={28} className="mr-2" data-ai-hint="app logo small"/>
        <span className="text-xl font-bold text-primary">+Seguro</span>
      </div>

      {/* Desktop Navigation in Pill Container - Centered */}
      <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out hidden md:flex",
        scrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-full pointer-events-none"
      )}>
        <nav className={cn(
          "flex items-center gap-2 text-sm font-medium rounded-full px-3 py-2.5 transition-all duration-300 ease-in-out",
          scrolled
            ? "bg-background/70 backdrop-blur-lg shadow-xl border border-border/50 scale-100"
            : "bg-white/5 backdrop-blur-md scale-95 shadow-lg border border-white/20"
        )}>
          {/* +Seguro Link (Home/Top) */}
          <Link
            href="#top"
            onClick={handleScrollTo('top')}
            className={cn(
              "transition-all duration-300 px-5 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 font-semibold",
              isLinkActive('top')
                ? "bg-primary/20 text-primary shadow-inner ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
            aria-current={isLinkActive('top') ? 'page' : undefined}
          >
            <motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Image src={logoSrc} alt="+Seguro Logo" width={24} height={24} data-ai-hint="app logo"/>
            </motion.div>
            +Seguro
          </Link>

          {/* Navigation Links with enhanced styles */}
          {[
            { href: '#what-we-do', label: '¿Qué hacemos?' },
            { href: '#how-it-works', label: '¿Cómo funciona?' },
            { href: '#risk-map', label: 'Zonas de Riesgo' },
            { href: '#statistics', label: 'Estadísticas' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={handleScrollTo(href.slice(1))}
              className={cn(
                "transition-all duration-300 px-4 py-2 rounded-full flex items-center gap-1.5 hover:scale-105",
                isLinkActive(href.slice(1))
                  ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/20 shadow-inner"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              aria-current={isLinkActive(href.slice(1)) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}

          {/* Sign In Link with enhanced style */}
          <Link
            href="/auth"
            className="transition-all duration-300 px-4 py-2 rounded-full flex items-center gap-1.5 text-primary border border-primary/20 hover:bg-primary/10 hover:scale-105"
          >
            Iniciar Sesión
          </Link>
          <ThemeToggle />
        </nav>
      </div>

      {/* Mobile Menu with enhanced styles */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden pointer-events-auto flex items-center gap-2">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-primary border border-primary/20 hover:bg-primary/10 transition-all duration-300 hover:scale-105 rounded-full p-2.5"
        >
          <Link href="/auth" className="flex items-center justify-center">
            <LogIn className="h-5 w-5" />
            <span className="sr-only">Iniciar Sesión</span>
          </Link>
        </Button>

        <ThemeToggle />

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary border border-primary/20 hover:bg-primary/10 transition-all duration-300 hover:scale-105 rounded-full p-2.5"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[400px] bg-background/90 backdrop-blur-lg border-l border-border/50 shadow-2xl"
          >
            <nav className="flex flex-col space-y-3 mt-8">
              {[
                { href: '#top', label: '+Seguro' },
                { href: '#what-we-do', label: '¿Qué hacemos?' },
                { href: '#how-it-works', label: '¿Cómo funciona?' },
                { href: '#risk-map', label: 'Zonas de Riesgo' },
                { href: '#statistics', label: 'Estadísticas' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={handleScrollTo(href.slice(1))}
                  className={cn(
                    "transition-all duration-300 px-4 py-3 rounded-lg flex items-center gap-2 hover:scale-102",
                    isLinkActive(href.slice(1))
                      ? "bg-primary/15 text-primary font-semibold ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default LandingNavBar;
