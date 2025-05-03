
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
        top: element.offsetTop - 60, // Adjust for fixed navbar height
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 md:px-6 transition-all duration-300',
        scrolled ? 'bg-background/90 shadow-md backdrop-blur-sm border-b border-border' : 'bg-transparent'
      )}
    >
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="+Seguro Logo"
          width={32}
          height={32}
          className="rounded-md"
          data-ai-hint="app logo safety shield"
        />
        <span className="text-xl font-bold text-primary">+Seguro</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link
          href="#what-we-do"
          onClick={handleScrollTo('what-we-do')}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          ¿Qué hacemos?
        </Link>
        <Link
          href="#how-it-works"
          onClick={handleScrollTo('how-it-works')}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          ¿Cómo funciona?
        </Link>
        <Link
          href="#risk-map"
          onClick={handleScrollTo('risk-map')}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          Zonas de Riesgo
        </Link>
      </nav>

      <div className="flex items-center gap-2">
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
