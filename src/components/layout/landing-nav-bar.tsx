
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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
        'fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-4 md:px-8 transition-all duration-300', // Increased height and padding
        // Remove background/shadow from header itself when scrolled, let the nav pill handle it
        scrolled ? ' ' : ' ' // Keep structure, but remove conditional background/shadow here
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 z-10"> {/* Ensure logo is above nav pill */}
        <Image
          src="/logo.png"
          alt="+Seguro Logo"
          width={36} // Slightly larger logo
          height={36}
          className="rounded-md"
          data-ai-hint="app logo safety shield"
        />
        <span className="text-xl font-bold text-primary">+Seguro</span>
      </Link>

      {/* Desktop Navigation in Pill Container - Centered */}
      <div className={cn(
        "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hidden md:flex",
        scrolled ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none" // Fade and scale in on scroll
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
          {/* Consider adding Contact link if needed */}
        </nav>
      </div>


      {/* Action Buttons */}
      <div className="flex items-center gap-2 z-10"> {/* Ensure buttons are above nav pill */}
        <Button
          onClick={() => router.push('/auth')}
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex rounded-full border-primary text-primary hover:bg-primary/10"
        >
          Iniciar Sesión
        </Button>
        <Button
          onClick={() => router.push('/auth')}
          size="sm"
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Registrarse
        </Button>
        {/* TODO: Add Mobile Menu Trigger */}
      </div>
    </header>
  );
};

export default LandingNavBar;
