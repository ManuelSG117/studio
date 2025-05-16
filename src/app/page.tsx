
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight, MapPin, Check, Mail, Phone, Facebook , Instagram, Loader2, ImageIcon, UserCog, FileText, ThumbsUp, CheckCircle, ArrowUp, ArrowDown, Navigation, Heart, HelpCircle, ExternalLink } from 'lucide-react';
import { useScroll, motion } from 'framer-motion';
import Image from 'next/image';
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import LandingNavBar from '@/components/layout/landing-nav-bar';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTheme } from "next-themes"; // Import useTheme

const HomePage: FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const { resolvedTheme } = useTheme(); // Get the resolved theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensure component is mounted before using theme
    if (!loading && isAuthenticated) {
      if (user?.isProfileComplete) {
        router.replace('/welcome');
      } else {
        router.replace('/profile/edit');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading || !mounted) { // Also wait for mounted to avoid hydration issues with theme
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  const logoSrc = resolvedTheme === 'dark' ? '/logo_dark.webp' : '/logo.webp';

  return (
    <div className="min-h-screen flex flex-col bg-background">
       <LandingNavBar />


      <main className="flex-1 pt-0">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-secondary dark:from-background dark:to-secondary pt-24 md:pt-32 lg:pt-40">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-8 text-center">
               {/* Left Side - Text Content */}
               <div className="flex-1 space-y-4 text-center">
                  <div className="space-y-2">
                     <Image
                        src={logoSrc} // Use dynamic logoSrc
                        alt="App Logo"
                        width={200}
                        height={200}
                        className="mx-auto mb-4"
                        priority
                        data-ai-hint="app logo safety shield"
                        style={{
                          maskImage: 'radial-gradient(circle at center, black 70%, transparent 100%)',
                          WebkitMaskImage: 'radial-gradient(circle at center, black 70%, transparent 100%)',
                        }}
                     />
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                      <span className="text-primary">+Seguro</span>
                    </h1>
                    <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                       Tu plataforma para reportar incidentes y construir un Uruapan más seguro.
                    </p>
                  </div>
                  

                   <div className="w-full max-w-xs sm:max-w-sm mx-auto space-y-2">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                          <Button
                            onClick={() => router.push('/auth')}
                            variant="outline"
                            className="w-full transition-all border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground h-11 rounded-full"
                            size="lg"
                           >
                            Iniciar Sesión
                          </Button>
                       </div>
                       <div>
                          <Button
                            onClick={() => router.push('/auth')}
                            className="w-full transition-all bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-full"
                            size="lg"
                           >
                            Registrarse
                          </Button>
                       </div>
                     </div>
                  </div>

               </div>

            </div>
          </div>
        </section>


        {/* Report Types Section */}
         <section
            id="what-we-do"
            className="w-full py-16 md:py-24 bg-gradient-to-b from-secondary to-white dark:from-secondary dark:to-background"
        >
          <div className="container px-4 md:px-6">
             <div className="text-center mb-12 max-w-3xl mx-auto">
               <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                 ¿QUÉ HACEMOS?
               </Badge>
               <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Reporta incidentes en Uruapan</h2>
               <p className="text-muted-foreground text-lg">
                 +Seguro te permite contribuir a una comunidad más segura.
               </p>
            </div>

             <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
               {/* Public Servant Card */}
                <div
                    className="group"
                >
                 <Card className="h-full overflow-hidden shadow-lg transition-all duration-300 border-t-4 border-t-primary bg-card">
                   <CardContent className="p-8">
                     <div className="flex justify-between items-start mb-6">
                       <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                         <UserCog className="h-8 w-8 text-primary" />
                       </div>
                       <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                         Funcionarios
                       </Badge>
                     </div>
                     <h3 className="text-2xl font-semibold text-primary mb-4">
                       Funcionarios Públicos
                     </h3>
                     <p className="text-muted-foreground mb-8">
                       Reporta conductas inapropiadas, corrupción o abuso de poder por parte de funcionarios públicos. Tu denuncia puede ser el catalizador para un cambio positivo.
                     </p>
                      <HoverCard>
                          <HoverCardTrigger asChild>

                            <div>
                              <Button
                                variant="outline"
                                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                                onClick={() => router.push('/auth')}
                              >
                                Reportar Funcionario
                                <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                              </Button>
                             </div>
                          </HoverCardTrigger>
                         <HoverCardContent className="w-80 bg-card p-4 shadow-lg rounded-lg border border-primary/20">
                            <div className="flex justify-between space-x-4">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold text-primary">Para reportar necesitas:</h4>
                                  <ul className="text-xs mt-2 space-y-2 list-disc list-inside text-muted-foreground">
                                    <li>Información del funcionario</li>
                                    <li>Descripción del incidente</li>
                                    <li>Fecha y lugar</li>
                                    <li>Evidencia (opcional)</li>
                                  </ul>
                                </div>
                            </div>
                         </HoverCardContent>
                      </HoverCard>
                   </CardContent>
                 </Card>
               </div>

               {/* Crime Report Card */}
                <div
                    className="group"
                >
                 <Card className="h-full overflow-hidden shadow-lg transition-all duration-300 border-t-4 border-t-destructive bg-card">
                   <CardContent className="p-8">
                     <div className="flex justify-between items-start mb-6">
                       <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-300">
                         <AlertTriangle className="h-8 w-8 text-destructive" />
                       </div>
                       <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                         Delitos
                       </Badge>
                     </div>
                     <h3 className="text-2xl font-semibold text-destructive mb-4">
                       Delitos e Incidentes
                     </h3>
                     <p className="text-muted-foreground mb-8">
                       Informa sobre robos, asaltos u otros delitos en tu comunidad. Contribuye a crear zonas más seguras y ayuda a prevenir futuros incidentes.
                     </p>
                      <HoverCard>
                        <HoverCardTrigger asChild>

                           <div>
                            <Button
                              variant="outline"
                              className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                              onClick={() => router.push('/auth')}
                            >
                              Reportar Incidente
                              <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                            </Button>
                           </div>
                        </HoverCardTrigger>
                         <HoverCardContent className="w-80 bg-card p-4 shadow-lg rounded-lg border border-destructive/20">
                            <div className="flex justify-between space-x-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-destructive">Para reportar necesitas:</h4>
                                <ul className="text-xs mt-2 space-y-2 list-disc list-inside text-muted-foreground">
                                  <li>Tipo de incidente</li>
                                  <li>Ubicación exacta</li>
                                  <li>Hora del suceso</li>
                                  <li>Descripción detallada</li>
                                </ul>
                              </div>
                            </div>
                         </HoverCardContent>
                      </HoverCard>
                   </CardContent>
                 </Card>
               </div>
            </div>
          </div>
        </section>

        {/* Enhanced How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-secondary dark:from-background dark:to-secondary overflow-hidden"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                PROCESO
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                ¿Cómo funciona?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Nuestra plataforma está diseñada para hacer el reporte de incidentes fácil, seguro y efectivo
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-border rounded-full z-0 hidden md:block"></div>

              {/* Step 1 */}
              <div className="relative mb-16 md:mb-24">
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="md:text-right mb-8 md:mb-0 md:pr-12">
                    <div className="flex items-center justify-start md:justify-end mb-4">
                       <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white text-xl font-bold z-10 shadow-md" >1</div>
                       <div className="absolute left-4 md:left-1/2 top-1/2 transform -translate-y-1/2 md:-translate-x-1/2 h-4 w-4 bg-card border-4 border-primary rounded-full z-20 hidden md:block"></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-primary mb-3">Crea una cuenta</h3>
                    <p className="text-muted-foreground">
                      Regístrate rápidamente con tu correo electrónico o usa tu cuenta de Google. En pocos minutos podrás añadir tu información y personalizar tu perfil, además de obtener mayor confianza al verificarlo.
                    </p>
                    <div className="mt-5 flex justify-start md:justify-end">
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Crear cuenta
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden" >
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                        <CardContent className="p-4 sm:p-6 relative z-10">
                           <div className="flex justify-between items-center mb-2">
                             <h4 className="text-base font-medium text-primary">Crear Cuenta</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                               <Check className="h-3 w-3" />
                             </span>
                           </div>
                            {/* Simulated form content */}
                            <div className="space-y-3 mb-4">
                                <div className="space-y-1">
                                   <label className="text-xs text-muted-foreground/80 block mb-0.5">Correo</label>
                                   <div className="h-9 w-full bg-muted/70 rounded border border-input flex items-center px-2">
                                      <span className="text-sm text-muted-foreground/70">usuario@ejemplo.com</span>
                                   </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground/80 block mb-0.5">Contraseña</label>
                                  <div className="h-9 w-full bg-muted/70 rounded border border-input flex items-center px-2">
                                      <span className="text-sm text-muted-foreground/70">••••••••</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground/80 block mb-0.5">Confirmar Contraseña</label>
                                  <div className="h-9 w-full bg-muted/70 rounded border border-input flex items-center px-2">
                                      <span className="text-sm text-muted-foreground/70">••••••••</span>
                                  </div>
                                </div>
                           </div>
                           <div className="flex justify-end">
                             <div className="h-9 w-24 bg-primary/80 rounded-full flex items-center justify-center text-sm text-primary-foreground">Registrar</div>
                           </div>
                         </CardContent>
                      </Card>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative mb-16 md:mb-24">
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="order-2 md:order-1 mb-8 md:mb-0 bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-destructive/50 to-destructive/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                        <CardContent className="p-4 sm:p-6 relative z-10">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-destructive">Crear Reporte</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive/10 text-destructive">
                               <AlertTriangle className="h-3 w-3" />
                             </span>
                           </div>
                            {/* Simulated report form content */}
                           <div className="space-y-3 mb-4">
                              <div className="flex justify-between gap-2">
                                  <div className="p-2 w-1/2 border-2 border-destructive/50 rounded-md bg-destructive/10 text-center ring-1 ring-destructive/30">
                                       <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
                                       <span className="text-xs text-destructive font-medium">Incidente</span>
                                  </div>
                                   <div className="p-2 w-1/2 border border-input rounded-md bg-muted/50 text-center opacity-60">
                                       <UserCog className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                       <span className="text-xs text-muted-foreground">Funcionario</span>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-xs text-muted-foreground/80 block mb-0.5">Título</label>
                                 <div className="h-9 w-full bg-muted/70 rounded border border-input flex items-center px-2">
                                     <span className="text-sm text-muted-foreground/70">Robo en Calle Principal</span>
                                 </div>
                              </div>
                               <div className="space-y-1">
                                 <label className="text-xs text-muted-foreground/80 block mb-0.5">Descripción</label>
                                 <div className="h-16 w-full bg-muted/70 rounded border border-input p-2">
                                     <p className="text-xs text-muted-foreground/70 leading-snug">Ocurrió un asalto a mano armada cerca de la esquina...</p>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground/80 block mb-0.5">Ubicación</label>
                                 <div className="h-9 w-full bg-muted/70 rounded border border-input flex items-center px-2 gap-1">
                                     <MapPin className="h-3 w-3 text-muted-foreground/50"/>
                                     <span className="text-sm text-muted-foreground/70">Calle Principal #123, Col. Centro</span>
                                 </div>
                              </div>
                               <div className="flex items-center gap-2">
                                   <div className="h-9 w-9 bg-muted/70 rounded border border-input flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground/50"/>
                                   </div>
                                   <span className="text-xs text-muted-foreground">Adjuntar evidencia (opcional)</span>
                               </div>
                           </div>
                           <div className="flex justify-end">
                             <div className="h-9 w-28 bg-destructive/80 rounded-full flex items-center justify-center text-sm text-destructive-foreground">Enviar</div>
                           </div>
                       </CardContent>
                     </Card>
                  </div>
                  <div className="md:text-left md:pl-12 order-1 md:order-2">
                     <div className="flex items-center justify-start mb-4">
                       <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive text-white text-xl font-bold z-10 shadow-md" >2</div>
                       <div className="absolute left-4 md:left-1/2 top-1/2 transform -translate-y-1/2 md:-translate-x-1/2 h-4 w-4 bg-card border-4  border-destructive rounded-full z-20 hidden md:block"></div>
                     </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-destructive mb-3">Crea un reporte detallado</h3>
                    <p className="text-muted-foreground">
                      Describe el incidente con precisión, añade la ubicación exacta en el mapa, adjunta fotografías o videos como evidencia y clasifica correctamente el tipo de incidente. Cuanto más detallado sea tu reporte, más útil será para la comunidad.
                    </p>
                    <div className="mt-5 flex justify-start">
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Crear reporte
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative mb-16 md:mb-24">
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <div className="md:text-right mb-8 md:mb-0 md:pr-12" >
                     <div className="flex items-center justify-start md:justify-end mb-4">
                       <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent text-white text-xl font-bold z-10 shadow-md">3</div>
                       <div className="absolute left-4 md:left-1/2 top-1/2 transform -translate-y-1/2 md:-translate-x-1/2 h-4 w-4 bg-card border-4  border-accent rounded-full z-20 hidden md:block"></div>
                     </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-accent mb-3">Ve los reportes de la comunidad</h3>
                    <p className="text-muted-foreground">
                      Visualiza los reportes de otros usuarios en el mapa comunitario. Revisa la información y valida los reportes que consideres precisos para ayudar a otros a mantenerse informados.
                    </p>
                     <div className="mt-5 flex justify-start md:justify-end">
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Explorar Reportes
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden" >
                     <div className="absolute inset-0 bg-gradient-to-br from-accent/50 to-accent/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                         <CardContent className="p-4 sm:p-6 relative z-10">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-accent">Reportes Comunitarios</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/10 text-accent">
                                <FileText className="h-3 w-3" />
                              </span>
                           </div>
                           {/* Simulated list of reports */}
                           <div className="space-y-3">
                             {/* Simulated Report 1 */}
                             <div className="p-3 bg-muted/50 rounded-lg border border-input flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <AlertTriangle className="h-4 w-4 text-destructive" />
                                   <span className="text-sm text-foreground truncate w-32">Asalto en Col. Morelos</span>
                               </div>
                                <span className="text-xs text-muted-foreground">Hace 2h</span>
                             </div>
                              {/* Simulated Report 2 */}
                             <div className="p-3 bg-muted/50 rounded-lg border border-input flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <UserCog className="h-4 w-4 text-primary" />
                                   <span className="text-sm text-foreground truncate w-32">Funcionario grosero</span>
                               </div>
                               <span className="text-xs text-muted-foreground">Ayer</span>
                             </div>
                              {/* Simulated Report 3 */}
                             <div className="p-3 bg-muted/50 rounded-lg border border-input flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <AlertTriangle className="h-4 w-4 text-destructive" />
                                   <span className="text-sm text-foreground truncate w-32">Robo de autopartes</span>
                               </div>
                               <span className="text-xs text-muted-foreground">Hace 3d</span>
                             </div>
                           </div>
                           <div className="flex justify-end mt-4">
                             <div className="h-9 w-32 bg-accent/80 rounded-full flex items-center justify-center text-sm text-accent-foreground">Cargar más</div>
                           </div>
                         </CardContent>
                     </Card>
                  </div>
                </div>
              </div>


               {/* Step 4 - Voting */}
               <div className="relative">
                 <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                   <div className="order-2 md:order-1 mb-8 md:mb-0 bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-green-500/10 opacity-30 pointer-events-none"></div>
                      <Card className="overflow-hidden bg-transparent shadow-none border-none">
                         <CardContent className="p-4 sm:p-6 relative z-10">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-base font-medium text-green-700 dark:text-green-400">Vota y Ayuda</h4>
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                <ThumbsUp className="h-3 w-3" />
                               </span>
                            </div>
                             {/* Simulated voting interaction */}
                             <div className="space-y-3">
                                {/* Simulated Report Card with Voting */}
                               <div className="p-3 bg-muted/50 rounded-lg border border-input">
                                 <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                        <span className="text-sm font-medium text-foreground">Intento de Robo</span>
                                     </div>
                                      <span className="text-xs text-muted-foreground">Hace 5h</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 mb-2 line-clamp-2">
                                     Dos sujetos en motocicleta intentaron arrebatar un bolso en la esquina...
                                  </p>
                                   <div className="flex justify-end items-center space-x-1 bg-muted p-1 rounded-full">
                                       <div className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer bg-red-600/20 text-red-600 hover:bg-red-600/30">
                                          <ArrowDown className="h-3.5 w-3.5" />
                                       </div>
                                       <span className="text-sm font-medium text-foreground tabular-nums w-6 text-center">
                                          12
                                       </span>
                                       <div className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer bg-green-600/20 text-green-600 hover:bg-green-600/30">
                                          <ArrowUp className="h-3.5 w-3.5" />
                                       </div>
                                   </div>
                                </div>
                                <p className="text-xs text-center text-muted-foreground pt-1">
                                  Tu voto ayuda a destacar los reportes más relevantes.
                                </p>
                             </div>
                            <div className="flex justify-end mt-4">
                              <div className="h-9 w-36 bg-green-600/80 rounded-full flex items-center justify-center text-sm text-white">Votar Ahora</div>
                            </div>
                        </CardContent>
                      </Card>
                   </div>
                   <div className="md:text-left md:pl-12 order-1 md:order-2">
                      <div className="flex items-center justify-start mb-4">
                        <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-600 text-white text-xl font-bold z-10 shadow-md" >4</div>
                        <div className="absolute left-4 md:left-1/2 top-1/2 transform -translate-y-1/2 md:-translate-x-1/2 h-4 w-4 bg-card border-4 border-green-600 rounded-full z-20 hidden md:block"></div>
                      </div>
                     <h3 className="text-2xl md:text-3xl font-semibold text-green-700 dark:text-green-400 mb-3">Vota por los reportes</h3>
                     <p className="text-muted-foreground">
                       Ayuda a la comunidad votando en los reportes. Tus votos aumentan la credibilidad y visibilidad de los incidentes, permitiendo que la información más relevante llegue a más personas y a las autoridades correspondientes.
                     </p>
                     <div className="mt-5 flex justify-start">
                       <Button variant="outline" className="border-green-600 text-green-700 dark:border-green-500 dark:text-green-400 hover:bg-green-600 hover:text-white flex items-center rounded-full" onClick={() => router.push('/auth')}>
                         Ver Reportes de la Comunidad
                         <ChevronRight className="ml-1 h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>


            </div>

             <div className="text-center mt-16 md:mt-24">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" onClick={() => router.push('/auth')}>
                Únete y Reporta Ahora
              </Button>
            </div>
          </div>
        </section>


         {/* Risk Map Section */}
          <section
            id="risk-map"
            className="w-full py-16 md:py-24 bg-gradient-to-b from-secondary to-white dark:from-secondary dark:to-background"
          >
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12 max-w-3xl mx-auto">
                  <Badge className="mb-4 bg-destructive/10 text-destructive hover:bg-destructive/20">
                      ZONAS DE RIESGO
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                      Mapa de incidencias
                  </h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                      Explora las áreas con mayor número de reportes para mantenerte informado y tomar precauciones
                  </p>
              </div>
              <div className="rounded-2xl overflow-hidden">
                       {/* Lottie Animation for Risk Map */}
                       <div className="relative h-96 w-full flex items-center justify-center">
                          <DotLottieReact
                             src="https://lottie.host/e575a174-b6c9-45e1-86bf-f712aad9cf22/yWmVrRdEOm.lottie"
                             loop
                             autoplay
                             className="w-full max-w-3xl h-auto object-contain"
                             data-ai-hint="map location risk animation"
                          />
                       </div>
              </div>
            </div>
          </section>

           {/* Statistics Section */}
        <section
            id="statistics"
            className="w-full py-16 md:py-24 bg-gradient-to-b from-white to-secondary dark:from-background dark:to-secondary"
          >
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12 max-w-3xl mx-auto">
                  <Badge className="mb-4 bg-accent/20 text-accent hover:bg-accent/30">
                      ESTADÍSTICAS
                  </Badge>
                  <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                      Tendencias de Reportes
                  </h3>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                      Visualiza las tendencias de reportes para entender mejor la seguridad en tu localidad y tomar decisiones informadas.
                  </p>
              </div>



               {/* Increase the size of the lottie animation by making the container full width */}
               <div className="relative p-0 rounded-2xl overflow-hidden w-full">
                  {/* Lottie Animation */}
                  <div className="relative h-96 w-full flex items-center justify-center">
                     <DotLottieReact
                        src="https://lottie.host/17494221-1efe-4d0d-ab48-bed230af095d/zJNz64aYIu.lottie"
                        loop={true}
                        autoplay
                        className="w-full max-w-4xl h-auto object-contain"
                        data-ai-hint="data graph animation" />
                  </div>
               </div>
              <div className="text-center mt-10">
                  <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center mx-auto rounded-full" onClick={() => router.push('/auth')}>
                      Explorar Estadísticas 
                      <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
              </div>
            </div>
          </section>

      </main>

      {/* Footer */}
       <footer className="bg-[#1C2B41] dark:bg-slate-900 text-gray-300 dark:text-slate-300 py-12">
         <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
             <div className="space-y-4">
                 <h3 className="text-xl font-semibold text-white flex items-center">
                   <span className="text-primary">+</span>Seguro
                 </h3>
                 <p className="text-sm leading-relaxed">
                 Tu plataforma ciudadana para reportar incidentes y crear un Uruapan más seguro para todos. Tu participación es clave para el cambio y la transformación de nuestro Uruapan.
                 </p>
                 <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                   <Link href="#" className="hover:text-white transition-colors">Preguntas frecuentes</Link>
                   <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
                 </div>
             </div>

             <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-white">Contacto</h3>
                 <div className="space-y-2 text-sm">
                   <a href="mailto:contacto@masseguro.com" className="flex items-center gap-2 hover:text-white transition-colors">
                     <Mail className="h-4 w-4 text-primary" />
                     masseguro117@gmail.com
                   </a>
                   <a href="tel:+524521234567" className="flex items-center gap-2 hover:text-white transition-colors">
                     <Phone className="h-4 w-4 text-primary" />
                     +52 (452) 123-4567
                   </a>
                   <p className="flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-primary" />
                     Uruapan, Michoacán, México
                   </p>
                 </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Nuestras Redes</h3>
                <div className="flex items-center space-x-3">
                    <a href="#" aria-label="Facebook" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a href="#" aria-label="Instagram" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                      <Instagram className="h-5 w-5" />
                    </a>
                </div>
             </div>
           </div>

           <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-gray-400">
             <p>
               © {new Date().getFullYear()} +Seguro. Casi todos los derechos reservados.
             </p>
           </div>
         </div>
       </footer>
    </div>
  );
};

export default HomePage;
