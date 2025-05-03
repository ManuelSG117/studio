
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Adjust for fixed navbar height + potential margin
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-center px-4 md:px-8 transition-all duration-300', // Center justify content
        scrolled ? ' ' : ' '
      )}
    >
      {/* Logo and Title Removed */}

      {/* Desktop Navigation in Pill Container - Centered */}
      <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hidden md:flex",
        scrolled ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <nav className="flex items-center gap-1 text-sm font-medium bg-muted/80 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-border">
          <Link
            href="#what-we-do"
            onClick={handleScrollTo('what-we-do')}
            className="text-muted-foreground transition-colors hover:text-primary px-4 py-1.5 rounded-full hover:bg-background/70"
          >
            ¿Qué hacemos?
          </Link>
          <Link
            href="#how-it-works"
            onClick={handleScrollTo('how-it-works')}
            className="text-muted-foreground transition-colors hover:text-primary px-4 py-1.5 rounded-full hover:bg-background/70"
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="#risk-map"
            onClick={handleScrollTo('risk-map')}
            className="text-muted-foreground transition-colors hover:text-primary px-4 py-1.5 rounded-full hover:bg-background/70"
          >
            Zonas de Riesgo
          </Link>
          {/* Sign In Link */}
           <Link
               href="/auth"
               className="text-muted-foreground transition-colors hover:text-primary px-4 py-1.5 rounded-full hover:bg-background/70 flex items-center gap-1.5"
           >
               <LogIn className="h-4 w-4 opacity-80" />
               Iniciar Sesión
           </Link>
        </nav>
      </div>


      {/* Action Buttons Removed */}

      {/* TODO: Add Mobile Menu Trigger if needed, maybe on the right */}
       <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
           {/* Mobile Menu Button Placeholder */}
           <Button size="icon" variant="ghost">
               <LogIn className="h-5 w-5" />
               <span className="sr-only">Iniciar Sesión / Menú</span>
           </Button>
       </div>
    </header>
  );
};

export default LandingNavBar;
