
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Github, Linkedin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AnimatedTextCycle from "@/components/ui/animated-text-cycle"; // Import AnimatedTextCycle

const AboutCreatorPage: FC = () => {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
      <div className="w-full max-w-3xl space-y-8">
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
          <CardHeader className="bg-muted/30 p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center">
              <div>
                <Avatar className="w-32 h-32 border-4 border-primary mb-4 shadow-lg">
                  <AvatarImage src="https://picsum.photos/seed/manuel/200" alt="Manuel Sandoval" data-ai-hint="creator avatar" />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">MS</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-3xl font-bold text-primary">Manuel Sandoval</CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                Ingeniero en Sistemas Computacionales | Desarrollador
              </CardDescription>
              <div className="mt-3 flex gap-2">
                <Badge variant="secondary">Uruapan, Michoacán</Badge>
                <Badge variant="secondary">25 años</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Sobre Mí</h2>
              <p className="text-muted-foreground leading-relaxed">
                Soy Manuel Sandoval, un Ingeniero en Sistemas Computacionales y desarrollador apasionado por la tecnología y el impacto positivo que puede tener en la sociedad. He vivido toda mi vida en la hermosa comunidad de Uruapan, Michoacán, y estoy profundamente comprometido con su bienestar.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Motivación detrás de +Seguro</h2>
              <p className="text-muted-foreground leading-relaxed">
                La plataforma +Seguro nace de un deseo genuino de contribuir a mejorar la seguridad y la calidad de vida en Uruapan. Mi objetivo es proporcionar una herramienta útil y accesible para que los ciudadanos puedan reportar incidentes, compartir información relevante y, juntos, construir un entorno más seguro para todos.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Es importante destacar que este proyecto es una iniciativa personal y comunitaria, sin fines de lucro ni afiliaciones políticas. Mi única motivación es el bienestar de nuestra comunidad.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                <AnimatedTextCycle texts={["Contacto", "Colaboración"]} duration={3000} className="inline-block" />
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Si tienes alguna pregunta, sugerencia para mejorar la plataforma, o simplemente quieres charlar sobre cómo podemos hacer de Uruapan un lugar mejor, no dudes en contactarme.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <a href="mailto:manuel.sandoval.dev@example.com">
                    <Mail className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Correo Electrónico</span>
                      <span className="block text-xs text-muted-foreground">manuel.sandoval.dev@example.com</span>
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
                  <a href="https://github.com/manuelsandovaldev" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5 mr-3 text-foreground flex-shrink-0" />
                     <div>
                      <span className="font-medium text-foreground">GitHub</span>
                      <span className="block text-xs text-muted-foreground">manuelsandovaldev <ExternalLink className="inline h-3 w-3 ml-1"/></span>
                    </div>
                  </a>
                </Button>
                 <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                  <a href="https://linkedin.com/in/manuelsandovaldev" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-5 w-5 mr-3 text-blue-700 flex-shrink-0" />
                     <div>
                      <span className="font-medium text-foreground">LinkedIn</span>
                      <span className="block text-xs text-muted-foreground">/in/manuelsandovaldev <ExternalLink className="inline h-3 w-3 ml-1"/></span>
                    </div>
                  </a>
                </Button>
              </div>
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
