
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Facebook, ExternalLink } from 'lucide-react'; // Updated icons
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AnimatedTextCycle from "@/components/ui/animated-text-cycle"; 
import GradientText from "@/components/ui/gradient-text"; 

const AboutCreatorPage: FC = () => {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
      <div className="w-full max-w-7xl space-y-8">
        <div className="flex items-center justify-start w-full">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary rounded-full mr-auto"
            onClick={() => router.back()}
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <Card className="w-full shadow-xl border-none rounded-2xl bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 p-4 text-center">
             <h1 className="text-2xl font-bold text-primary">Sobre +Seguro</h1>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Section 1: Motivación */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Motivación detrás de +Seguro</h2>
              <p className="text-muted-foreground leading-relaxed">
                La plataforma +Seguro surge con el propósito de ser una herramienta ciudadana fundamental para Uruapan. Nuestro objetivo es que puedas reportar incidentes, consultar niveles de seguridad en diferentes zonas y estar al tanto de cualquier problemática que afecte a nuestra ciudad. Buscamos fomentar la cooperación entre usuarios para utilizar la plataforma de la manera más efectiva posible.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Mi principal motivación es mejorar la seguridad y el bienestar de nuestra comunidad, facilitando el acceso rápido a información relevante. Es importante destacar que este proyecto es una iniciativa personal y comunitaria,{' '}
                <GradientText
                  from="from-primary"
                  to="to-destructive"
                  size="text-base"
                  className="font-semibold"
                >
                  sin afiliaciones políticas.
                </GradientText>
                {' '}Mi compromiso es con el progreso y la tranquilidad de Uruapan.
              </p>
            </section>

            <Separator />

            {/* Section 2: Contacto */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                <AnimatedTextCycle texts={["Contacto", "Colaboración", "Sugerencia"]} duration={3000} className="inline-block" />
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Si tienes alguna pregunta, sugerencia para mejorar la plataforma, o simplemente quieres charlar sobre cómo podemos hacer de Uruapan un lugar mejor, no dudes en contactarme.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <a href="mailto:masseguro117@gmail.com"> {/* Updated email */}
                    <Mail className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Correo Electrónico</span>
                      <span className="block text-xs text-muted-foreground">masseguro117@gmail.com</span>
                    </div>
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <Link href="#"> {/* Placeholder for a feedback page or external form */}
                    <MessageSquare className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                     <div>
                      <span className="font-medium text-foreground">Buzón de Sugerencias</span>
                      <span className="block text-xs text-muted-foreground">Comparte tus ideas</span>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <a href="https://www.facebook.com/manuel.sandoval.5245" target="_blank" rel="noopener noreferrer"> {/* Updated to Facebook profile */}
                    <Facebook className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" /> {/* Changed icon */}
                     <div>
                      <span className="font-medium text-foreground">Facebook Personal</span> {/* Updated label */}
                      <span className="block text-xs text-muted-foreground">Manuel Sandoval <ExternalLink className="inline h-3 w-3 ml-1"/></span>
                    </div>
                  </a>
                </Button>
                 <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <Link href="#"> {/* Placeholder for +Seguro Facebook page */}
                    <Facebook className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" /> {/* Using Facebook icon */}
                     <div>
                      <span className="font-medium text-foreground">+Seguro en Facebook</span>
                      <span className="block text-xs text-muted-foreground">Actualizaciones (Próximamente) <ExternalLink className="inline h-3 w-3 ml-1"/></span>
                    </div>
                  </Link>
                </Button>
              </div>
            </section>
            
            <Separator />

            {/* Section 3: Sobre Mí */}
            <section>
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-32 h-32 border-4 border-primary mb-4 shadow-lg">
                  <AvatarImage src="https://picsum.photos/seed/manuel/200" alt="Manuel Sandoval" data-ai-hint="creator avatar" />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">MS</AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold text-primary mb-1">Manuel Sandoval</h2>                  <Badge variant="secondary">25 años</Badge>
                <p className="text-base text-muted-foreground mt-1">
                    <AnimatedTextCycle texts={["Ingeniero en Sistemas", "Desarrollador Full-Stack", "Entusiasta Tecnológico"]} duration={4000} className="inline-block" />
                </p>
             
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Soy Manuel Sandoval, un Ingeniero en Sistemas Computacionales y desarrollador apasionado por la tecnología y el impacto positivo que puede tener en la sociedad. He vivido toda mi vida en la hermosa comunidad de Uruapan, Michoacán, y estoy profundamente comprometido con su bienestar.
              </p>
            </section>

            <Separator />

            <div className="text-center text-muted-foreground text-sm">
              <p>¡Gracias por ser parte de +Seguro y por tu compromiso con nuestra comunidad!</p>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} +SEGURO - Una iniciativa ciudadana para Uruapan.
        </footer>
      </div>
    </main>
  );
};

export default AboutCreatorPage;
