// Suggested code may be subject to a license. Learn more: ~LicenseLog:3832980065.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2128573500.

"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ChevronRight, MapPin, Check, Navigation, ExternalLink, Heart, HelpCircle, Mail, Phone, Facebook, Twitter, Instagram } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { RiskMap } from '@/components/RiskMap';
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

const HomePage: FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.isProfileComplete) {
        router.replace('/welcome');
      } else {
        router.replace('/profile/edit');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.3, duration: 0.5 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };
  const reportCardVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const scrollRevealVariants = { offscreen: { y: 50, opacity: 0 }, onscreen: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8 } } };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
       <motion.div
         className="fixed top-0 left-0 right-0 h-1 bg-primary z-50"
         style={{ scaleX, transformOrigin: "0%" }}
        />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-secondary">
          <div className="container px-4 md:px-6">
             <motion.div className="flex flex-col items-center justify-center space-y-4 text-center" initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div className="space-y-2" variants={itemVariants}>
                 <Image
                    src="/logo.png"
                    alt="App Logo"
                    width={150}
                    height={150}
                    className="mx-auto mb-6 rounded-full shadow-lg"
                    priority
                    data-ai-hint="app logo safety shield"
                 />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  <span className="text-primary">+Seguro</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                   Tu plataforma  para reportar incidentes y construir un Uruapan más seguro.
                </p>
              </motion.div>
              
               <motion.div className="w-full max-w-xs sm:max-w-sm space-y-2" variants={itemVariants}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => router.push('/auth')} // Navigate to the unified auth page
                        variant="outline"
                        className="w-full transition-all border-2 border-primary text-primary hover:bg-primary/10 h-11 rounded-full"
                        size="lg"
                       >
                        Iniciar Sesión
                      </Button>
                   </motion.div>
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => router.push('/auth')} // Navigate to the unified auth page
                        className="w-full transition-all bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11 rounded-full"
                        size="lg"
                       >
                        Registrarse
                      </Button>
                   </motion.div>
                 </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Report Types Section */}
         <motion.section
            className="w-full py-16 md:py-24 bg-secondary"
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.2 }}
            variants={scrollRevealVariants}
        >
          <div className="container px-4 md:px-6">
             <motion.div className="text-center mb-12 max-w-3xl mx-auto" variants={scrollRevealVariants}>
               <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                 ¿QUÉ HACEMOS?
               </Badge>
               <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Reporta incidentes en Uruapan</h2>
               <p className="text-muted-foreground text-lg">
                 +Seguro te permite contribuir a una comunidad más segura.
               </p>
            </motion.div>

             <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
               {/* Public Servant Card */}
                <motion.div
                    className="group"
                    variants={reportCardVariants}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                 <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary bg-card">
                   <CardContent className="p-8">
                     <div className="flex justify-between items-start mb-6">
                       <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                         <Shield className="h-8 w-8 text-primary" />
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
                              <Button
                                variant="outline"
                                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                                onClick={() => router.push('/auth')}
                              >
                                Reportar Funcionario
                                <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                              </Button>
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
               </motion.div>

               {/* Crime Report Card */}
                <motion.div
                    className="group"
                    variants={reportCardVariants}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                 <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-destructive bg-card">
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
                            <Button
                              variant="outline"
                              className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                              onClick={() => router.push('/auth')}
                            >
                              Reportar Incidente
                              <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                            </Button>
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
               </motion.div>
            </div>
          </div>
        </motion.section>

        {/* How it Works Section */}
        <motion.section
          className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-secondary overflow-hidden"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.1 }}
          variants={scrollRevealVariants}
          id="how-it-works"
        >
          <div className="container px-4 md:px-6">
            <motion.div className="text-center mb-16 max-w-3xl mx-auto" variants={scrollRevealVariants}>
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                PROCESO
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                ¿Cómo funciona?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Nuestra plataforma está diseñada para hacer el reporte de incidentes fácil, seguro y efectivo
              </p>
            </motion.div>

            <div className="relative max-w-5xl mx-auto">
              <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-border rounded-full z-0 hidden md:block"></div>

              {/* Step 1 */}
              <motion.div className="relative mb-16 md:mb-24" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div className="md:text-right mb-8 md:mb-0 md:pr-12" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <div className="flex items-center justify-start md:justify-end mb-4">
                       <motion.div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white text-xl font-bold z-10 shadow-md" whileHover={{ rotate: 5, scale: 1.1 }}>1</motion.div>
                       <div className="absolute left-4 top-6 transform -translate-x-1/2 md:left-auto md:right-0 md:translate-x-1/2 h-4 w-4 bg-card border-4 border-primary rounded-full z-20 hidden md:block"></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-primary mb-3">Crea una cuenta</h3>
                    <p className="text-muted-foreground">
                      Regístrate rápidamente con tu correo electrónico o usa tu cuenta de Google. En pocos minutos podrás añadir tu información y personalizar tu perfil, además de obtener mayor confianza al verificarlo.
                    </p>
                    <motion.div className="mt-5 flex justify-start md:justify-end" whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Crear cuenta
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div className="bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden" whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} transition={{ type: "spring", stiffness: 300 }}>
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                        <CardContent className="p-4 sm:p-6 relative z-10">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-primary">Crear Cuenta</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                               <Check className="h-3 w-3" />
                             </span>
                           </div>
                           <div className="space-y-3">
                             <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-9 w-3/4 bg-muted rounded animate-pulse"></div>
                           </div>
                           <div className="flex justify-end mt-4">
                             <div className="h-8 w-24 bg-primary/20 rounded-full animate-pulse"></div>
                           </div>
                         </CardContent>
                      </Card>
                  </motion.div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div className="relative mb-16 md:mb-24" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div className="order-2 md:order-1 mb-8 md:mb-0 bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden" whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} transition={{ type: "spring", stiffness: 300 }}>
                     <div className="absolute inset-0 bg-gradient-to-br from-destructive/50 to-destructive/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                        <CardContent className="p-4 sm:p-6 relative z-10">
                          <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-destructive">Crear Reporte</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                              </span>
                          </div>
                          <div className="space-y-3">
                             <div className="flex gap-2">
                               <div className="h-9 w-1/3 bg-muted rounded animate-pulse"></div>
                               <div className="h-9 w-1/3 bg-muted rounded animate-pulse"></div>
                               <div className="h-9 w-1/3 bg-muted rounded animate-pulse"></div>
                             </div>
                             <div className="h-16 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                           </div>
                           <div className="h-20 mt-4 w-full bg-muted rounded flex items-center justify-center animate-pulse">
                             <MapPin className="h-6 w-6 text-muted-foreground/50" />
                           </div>
                           <div className="flex justify-end mt-4">
                             <div className="h-8 w-32 bg-destructive/20 rounded-full animate-pulse"></div>
                           </div>
                       </CardContent>
                     </Card>
                  </motion.div>
                  <motion.div className="md:text-left md:pl-12 order-1 md:order-2" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                     <div className="flex items-center justify-start mb-4">
                       <motion.div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive text-white text-xl font-bold z-10 shadow-md" whileHover={{ rotate: -5, scale: 1.1 }}>2</motion.div>
                       <div className="absolute left-4 top-6 transform -translate-x-1/2 md:left-1/2 md:-translate-x-1/2 h-4 w-4 bg-card border-4 border-destructive rounded-full z-20 hidden md:block"></div>
                     </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-destructive mb-3">Crea un reporte detallado</h3>
                    <p className="text-muted-foreground">
                      Describe el incidente con precisión, añade la ubicación exacta en el mapa, adjunta fotografías o videos como evidencia y clasifica correctamente el tipo de incidente. Cuanto más detallado sea tu reporte, más útil será para la comunidad.
                    </p>
                    <motion.div className="mt-5 flex justify-start" whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Crear reporte
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div className="relative" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div className="md:text-right mb-8 md:mb-0 md:pr-12" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                     <div className="flex items-center justify-start md:justify-end mb-4">
                       <motion.div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent text-white text-xl font-bold z-10 shadow-md" whileHover={{ rotate: 5, scale: 1.1 }}>3</motion.div>
                       <div className="absolute left-4 top-6 transform -translate-x-1/2 md:left-auto md:right-0 md:translate-x-1/2 h-4 w-4 bg-card border-4 border-accent rounded-full z-20 hidden md:block"></div>
                     </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-accent mb-3">Visualiza los reportes</h3>
                    <p className="text-muted-foreground">
                      Visualiza los reportes de los demás y observa cómo contribuye tu reporte, visualiza las zonas de riesgo.
                    </p>
                     <motion.div className="mt-5 flex justify-start md:justify-end" whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Visualizar reportes
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div className="bg-card p-4 rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden" whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} transition={{ type: "spring", stiffness: 300 }}>
                     <div className="absolute inset-0 bg-gradient-to-br from-accent/50 to-accent/20 opacity-30 pointer-events-none"></div>
                     <Card className="overflow-hidden bg-transparent shadow-none border-none">
                         <CardContent className="p-4 sm:p-6 relative z-10">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-accent">Ve los reportes de los demás</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/10 text-accent">
                                <Navigation className="h-3 w-3" />
                              </span>
                           </div>
                           <div className="space-y-3">
                             <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
                             <div className="flex justify-between">
                               <div className="h-9 w-1/3 bg-muted rounded animate-pulse"></div>
                               <div className="h-9 w-1/4 bg-muted rounded animate-pulse"></div>
                               </div>
                             <div className="flex gap-2 mt-2">
                               <div className="h-4 w-4 rounded-full bg-red-500"></div>
                               <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                               <div className="h-4 w-4 rounded-full bg-green-500"></div>
                               <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                             </div>
                             <div className="flex justify-end mt-4">
                               <div className="h-8 w-24 bg-accent/20 rounded-full animate-pulse"></div>
                             </div>
                           </div>
                         </CardContent>
                     </Card>
                  </motion.div>
                </div>
              </motion.div>
            </div>

             <motion.div className="text-center mt-16 md:mt-24" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" onClick={() => router.push('/auth')}>
                Comenzar ahora
              </Button>
            </motion.div>
          </div>
        </motion.section>

         {/* Risk Map Section */}
          <motion.section className="w-full py-16 md:py-24 bg-gradient-to-b from-secondary to-white" initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.2 }} variants={scrollRevealVariants}>
            <div className="container px-4 md:px-6">
              <motion.div className="text-center mb-12 max-w-3xl mx-auto" variants={scrollRevealVariants}>
                  <Badge className="mb-4 bg-destructive/10 text-destructive hover:bg-destructive/20">
                      ZONAS DE RIESGO
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                      Mapa de incidencias
                  </h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                      Explora las áreas con mayor número de reportes para mantenerte informado y tomar precauciones
                  </p>
              </motion.div>
              <motion.div className="rounded-2xl overflow-hidden shadow-xl border border-border" variants={scrollRevealVariants} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
                  <div className="relative h-[500px] w-full">
                      <RiskMap />
                  </div>
              </motion.div>
              <motion.div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto" variants={scrollRevealVariants}>
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                      <div className="h-4 w-4 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Alta incidencia</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                      <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Media incidencia</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                      <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Baja incidencia</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                      <div className="h-4 w-4 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Zona segura</span>
                  </div>
              </motion.div>
            </div>
          </motion.section>
      </main>

      {/* Footer */}
       <motion.footer className="bg-[#1C2B41] text-gray-300 py-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
         <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
             <div className="space-y-4">
                 <h3 className="text-xl font-semibold text-white flex items-center">
                   <span className="text-primary">+</span>Seguro
                 </h3>
                 <p className="text-sm leading-relaxed">
                   Plataforma ciudadana para reportar incidentes y crear una ciudad más segura para todos. Tu participación es clave para el cambio y la transformación de nuestra comunidad.
                 </p>
                 <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                   <a href="#" className="hover:text-white transition-colors">Preguntas frecuentes</a>
                   <a href="#" className="hover:text-white transition-colors">Términos</a>
                   <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                   <a href="#" className="hover:text-white transition-colors">Cookies</a>
                 </div>
             </div>

             <div className="space-y-4 md:col-span-1 lg:col-span-2">
                 <h3 className="text-lg font-semibold text-white">Contacto y Redes Sociales</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2 text-sm">
                       <a href="mailto:contacto@masseguro.com" className="flex items-center gap-2 hover:text-white transition-colors">
                         <Mail className="h-4 w-4 text-primary" />
                         contacto@masseguro.com
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

                     <div className="flex items-center justify-start sm:justify-end space-x-3">
                         <motion.a href="#" aria-label="Facebook" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                           <Facebook className="h-5 w-5" />
                         </motion.a>
                         <motion.a href="#" aria-label="Twitter" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                           <Twitter className="h-5 w-5" />
                         </motion.a>
                         <motion.a href="#" aria-label="Instagram" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                           <Instagram className="h-5 w-5" />
                         </motion.a>
                     </div>
                 </div>
             </div>
           </div>

           <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-gray-400">
             <p>
               © {new Date().getFullYear()} +Seguro. Todos los derechos reservados.
             </p>
           </div>
         </div>
       </motion.footer>
    </div>
  );
};

export default HomePage;
