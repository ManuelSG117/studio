
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Facebook, ExternalLink, Briefcase, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AnimatedTextCycle from "@/components/ui/animated-text-cycle";
import GradientText from "@/components/ui/gradient-text";
import { SuggestionDialog } from '@/components/suggestion-dialog';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AboutCreatorPage: FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);

  const handleOpenSuggestionDialog = () => {
    // TODO: Implement user level check here. (e.g., if user.level >= 3)
    // For now, we'll always open it for demonstration purposes.
    setIsSuggestionDialogOpen(true);
  };

  return (
    <>
      <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
        <div className="w-full max-w-7xl space-y-8">
          <div
            className="flex items-center justify-start w-full"
          >
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
              <h1
                className="text-2xl font-bold text-primary"
              >
                Sobre +Seguro
              </h1>
            </CardHeader>

           

            <CardContent className="p-6 sm:p-8 space-y-12">
              {/* Section 1: Motivación */}
              <section
                className="pb-16 md:pb-24"
              >
                <h2 className="text-xl font-semibold text-foreground mb-3">Motivación detrás de +Seguro</h2>
                <p className="text-muted-foreground leading-relaxed">
                  La plataforma +Seguro nace con la convicción de que una comunidad unida es una comunidad más fuerte. Surge como una herramienta fundamental para Uruapan, con el objetivo de que todos podamos contribuir a un entorno más seguro. Aquí puedes reportar incidentes, consultar niveles de seguridad en diferentes zonas y estar al tanto de cualquier problemática que afecte a nuestra ciudad. Cada reporte, cada voto, es un granito de arena esencial. Es crucial la participación activa y responsable de todos: al utilizar la plataforma correctamente, garantizamos que los reportes sean legítimos y la información sea verídica, logrando juntos un Uruapan mejor y más seguro para todos.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Mi principal motivación es mejorar la seguridad y el bienestar de nuestra comunidad, facilitando el acceso rápido a información relevante. Es importante destacar que este proyecto es una iniciativa personal,{' '}
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
                 {/* Aviso de app móvil en desarrollo */}
                 <div className="px-6 pt-4 pb-0 text-center">
                    <p className="text-base font-semibold text-primary bg-primary/10 dark:bg-primary/20 rounded-lg py-2 px-4 mb-2">
                        ¡Estamos trabajando en la aplicación móvil de la plataforma para mejorar la comodidad y experiencia de todos los usuarios! Próximamente disponible.
                    </p>
                </div>
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
                    <a href="mailto:masseguro117@gmail.com">
                      <Mail className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Correo Electrónico</span>
                        <span className="block text-xs text-muted-foreground">masseguro117@gmail.com</span>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg" onClick={handleOpenSuggestionDialog} disabled>
                    <MessageSquare className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className="font-medium text-muted-foreground">Buzón de Sugerencias</span>
                      <span className="block text-xs text-muted-foreground">Disponible Próximamente</span>
                    </div>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                    <a href="https://www.facebook.com/manuel.sandoval.5245" target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Facebook Personal</span>
                        <span className="block text-xs text-muted-foreground">Manuel Sandoval <ExternalLink className="inline h-3 w-3 ml-1" /></span>
                      </div>
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start text-left h-auto py-3 rounded-lg">
                    <a href="https://www.facebook.com/profile.php?id=61576643662120" target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">+Seguro en Facebook</span>
                        <span className="block text-xs text-muted-foreground">Actualizaciones o Contacto <ExternalLink className="inline h-3 w-3 ml-1" /></span>
                      </div>
                    </a>
                  </Button>
                </div>
              </section>

              <Separator />

              {/* Section: Apoya +Seguro */}
              <section className="py-8 bg-primary/5 dark:bg-primary/10 rounded-xl px-6">
                <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
                  <Gift className="h-6 w-6 mr-3 text-primary" />
                  ¡Apoya el Futuro de +Seguro!
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  +Seguro es una iniciativa personal dedicada a mejorar nuestra comunidad. Si crees en esta misión y te gustaría contribuir al mantenimiento, desarrollo de nuevas funcionalidades y costos operativos de la plataforma, ¡tu apoyo es invaluable!
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3 text-base">
                  Cada contribución, grande o pequeña, nos ayuda a seguir adelante y a construir un Uruapan más seguro para todos. Los patrocinadores y colaboradores podrán ser destacados en esta sección como agradecimiento a su compromiso.
                </p>
                <p className="text-foreground leading-relaxed mt-4 font-medium">
                  Para más información sobre cómo puedes convertirte en un pilar de +Seguro, no dudes en <a href="mailto:masseguro117@gmail.com" className="text-primary hover:underline font-semibold">contactarme por correo electrónico</a>.
                </p>
                <div className="mt-6 text-center text-muted-foreground/70 italic">
                  (Próximamente: Descubre cómo ser patrocinador y quiénes nos apoyan)
                </div>
              </section>

              <Separator />

              {/* Section 3: Sobre Mí */}
              <section>
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="w-32 h-32 border-4 border-primary mb-4 shadow-lg">
                    <AvatarImage src="/me.webp" alt="Manuel Sandoval" data-ai-hint="creator avatar"/>
                    <AvatarFallback className="text-4xl bg-primary text-primary-foreground">MS</AvatarFallback>
                  </Avatar>
                  <h2 className="text-3xl font-bold text-primary mb-1">Manuel Sandoval González</h2>
                  <p className="text-base text-muted-foreground mt-1">
                    <AnimatedTextCycle texts={["Ingeniero en Sistemas", "Desarrollador Full-Stack"]} duration={2500} className="inline-block whitespace-nowrap" />
                  </p>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  Soy Manuel Sandoval, un Ingeniero en Sistemas Computacionales originario y residente de Uruapan, Michoacán. Esta ciudad es el lugar que llamo hogar y por el cual siento un profundo cariño y compromiso. Desde siempre, me ha apasionado la tecnología, no solo como una herramienta, sino como un medio para generar un impacto positivo real en la sociedad.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Mi trayectoria como desarrollador full-stack me ha permitido explorar cómo las soluciones digitales pueden abordar problemáticas cotidianas. Fue esta pasión, combinada con mi deseo de ver a Uruapan prosperar en un ambiente de mayor tranquilidad, lo que me impulsó a crear +Seguro. Esta plataforma es mi contribución personal para fortalecer el tejido social, ofreciendo un espacio donde la información y la colaboración ciudadana se unen para fomentar un entorno más seguro y protegido para todos los que vivimos aquí.
                </p>
                 <p className="text-muted-foreground leading-relaxed mt-3">
                  Estoy convencido de que, trabajando juntos y utilizando la tecnología de manera responsable, podemos marcar una diferencia significativa en el bienestar de nuestra comunidad.
                </p>
                <div className="mt-6 text-center">
                  <Button asChild variant="outline" className="rounded-full">
                    <a href="https://portfolio-manuel-two.vercel.app/" target="_blank" rel="noopener noreferrer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Ver mi Portafolio
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </section>

              <Separator />

              <div
                className="text-center text-muted-foreground text-sm"
              >
                <p>¡Gracias por ser parte de +Seguro y por tu compromiso con nuestra comunidad!</p>
              </div>
            </CardContent>
          </Card>

          <footer
            className="mt-8 text-center text-xs text-muted-foreground"
          >
            © {new Date().getFullYear()} +SEGURO - Una iniciativa de Manuel Sandoval para Uruapan.
          </footer>
        </div>
      </main>
      <SuggestionDialog
        open={isSuggestionDialogOpen}
        onOpenChange={setIsSuggestionDialogOpen}
        recipientEmail="masseguro117@gmail.com"
      />
    </>
  );
};

export default AboutCreatorPage;
