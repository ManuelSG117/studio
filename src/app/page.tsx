
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ChevronRight, MapPin, Check, Navigation } from 'lucide-react';
import { Loader2 } from 'lucide-react'; // Keep Loader2 for loading state
import { motion } from 'framer-motion'; // Import motion
import Image from 'next/image';

const HomePage: FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth(); // Get auth state

  useEffect(() => {
    // Redirect logged-in users away from the landing page
    if (!loading && isAuthenticated) {
      // Redirect based on profile completeness
      if (user?.isProfileComplete) {
        router.replace('/welcome'); // Redirect to welcome if logged in and profile complete
      } else {
        router.replace('/profile/edit'); // Redirect to edit profile if logged in but profile incomplete
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3,
        duration: 0.5
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  const reportCardVariants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };
  const scrollRevealVariants = {
    offscreen: {
      y: 50,
      opacity: 0
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  // Render landing page if not loading and not authenticated
  return (
    <div className="min-h-screen flex flex-col bg-background"> {/* Use theme background */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-secondary">
          <div className="container px-4 md:px-6">
             <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
              <motion.div className="space-y-2" variants={itemVariants}>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  <span className="text-primary">+Seguro</span>
                  <span className="text-destructive ml-2">Uruapan</span> {/* Adjusted color to match image */}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                   Tu plataforma ciudadana para reportar incidentes y construir un entorno más seguro.
                </p>
              </motion.div>
               <motion.div className="space-y-2" variants={itemVariants}>
                <p className="mx-auto max-w-[700px] text-muted-foreground">
                  Reporta funcionarios públicos o incidentes delictivos de forma segura y anónima.
                </p>
              </motion.div>
               <motion.div className="w-full max-w-xs sm:max-w-sm space-y-2" variants={itemVariants}> {/* Adjusted max-width */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => router.push('/login')}
                        variant="outline"
                        className="w-full transition-all border-2 border-primary text-primary hover:bg-primary/10 h-11 rounded-full"
                        size="lg"
                       >
                        Iniciar Sesión
                      </Button>
                   </motion.div>
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => router.push('/register')}
                        className="w-full transition-all bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11 rounded-full" // Use destructive color
                        size="lg"
                        variant="default" // Explicitly default, but destructive overrides color
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
               <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20"> {/* Adjusted badge style */}
                 ¿QUÉ HACEMOS?
               </Badge>
               <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Reporta incidentes en tu comunidad</h2>
               <p className="text-muted-foreground text-lg">
                 +Seguro Uruapan te permite contribuir a una comunidad más segura. Elige el tipo de reporte:
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
                      <Button
                        variant="outline"
                        className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                        onClick={() => router.push('/auth')} // Go to login/register first
                      >
                        Reportar Funcionario
                        <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </Button>
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
                      <Button
                        variant="outline"
                        className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-300 group-hover:shadow-md flex items-center justify-center gap-2 h-11 rounded-full"
                        onClick={() => router.push('/auth')} // Go to login/register first
                      >
                        Reportar Incidente
                        <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </Button>
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

            {/* Steps with timeline */}
            <div className="relative max-w-5xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary/30 via-primary/60 to-primary/30 rounded-full z-0"></div>

              {/* Step 1 */}
              <motion.div
                className="relative mb-16 md:mb-24"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div
                    className="md:text-right mb-8 md:mb-0 md:pr-12"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center justify-start md:justify-end mb-4">
                       <motion.div
                        className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white text-xl font-bold z-10 shadow-md"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        1
                      </motion.div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-primary mb-3">Crea una cuenta</h3>
                    <p className="text-muted-foreground">
                      Regístrate rápidamente con tu correo o usa tu cuenta de Google. Tu información permanecerá privada y segura en todo momento. Toma solo unos minutos y te da acceso a todas las funcionalidades de la plataforma.
                    </p>
                    <motion.div className="mt-5 flex justify-start md:justify-end" whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Crear cuenta
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="bg-card p-4 rounded-xl shadow-lg border border-border relative z-10"
                    whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                      <Card className="overflow-hidden bg-background shadow-sm border-none">
                         <CardContent className="p-4 sm:p-6">
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
              <motion.div
                className="relative mb-16 md:mb-24"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div
                    className="order-2 md:order-1 mb-8 md:mb-0 bg-card p-4 rounded-xl shadow-lg border border-border relative z-10"
                    whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                     <Card className="overflow-hidden bg-background shadow-sm border-none">
                       <CardContent className="p-4 sm:p-6">
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

                  <motion.div
                    className="md:text-left md:pl-12 order-1 md:order-2"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                     <div className="flex items-center justify-start mb-4">
                       <motion.div
                        className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive text-white text-xl font-bold z-10 shadow-md"
                        whileHover={{ rotate: -5, scale: 1.1 }}
                      >
                        2
                      </motion.div>
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
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                  <motion.div
                    className="md:text-right mb-8 md:mb-0 md:pr-12"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                     <div className="flex items-center justify-start md:justify-end mb-4">
                       <motion.div
                        className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent text-white text-xl font-bold z-10 shadow-md"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        3
                      </motion.div>
                     </div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-accent mb-3">Da seguimiento</h3>
                    <p className="text-muted-foreground">
                      Monitorea el estado de tu reporte y recibe notificaciones sobre actualizaciones. Observa cómo tu contribución ayuda a crear conciencia y a mejorar la seguridad en las áreas afectadas. Tu participación es clave para generar cambio.
                    </p>
                     <motion.div className="mt-5 flex justify-start md:justify-end" whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 flex items-center rounded-full" onClick={() => router.push('/auth')}>
                        Ver seguimiento
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="bg-card p-4 rounded-xl shadow-lg border border-border relative z-10"
                    whileHover={{ y: -8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                     <Card className="overflow-hidden bg-background shadow-sm border-none">
                         <CardContent className="p-4 sm:p-6">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="text-base font-medium text-accent">Seguimiento de Reporte</h4>
                             <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/10 text-accent">
                                <Navigation className="h-3 w-3" />
                              </span>
                           </div>
                           <div className="space-y-3">
                             <div className="rounded-lg bg-muted p-3 border border-border/50">
                               <div className="flex justify-between items-center mb-1.5">
                                 <span className="text-xs font-medium text-foreground">Reporte #12345</span>
                                 <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full border border-green-200">Activo</Badge>
                               </div>
                               <div className="h-2 w-full bg-muted-foreground/10 rounded-full overflow-hidden">
                                 <motion.div
                                    className="h-full bg-green-500 rounded-full"
                                    initial={{ width: "0%" }}
                                    whileInView={{ width: "75%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                               </div>
                               <div className="mt-1 text-[10px] text-right text-muted-foreground">75% completado</div>
                             </div>
                             <div className="h-16 w-full rounded bg-muted border border-border/50 p-2 flex flex-col justify-between animate-pulse">
                               <div className="h-2.5 w-3/4 bg-muted-foreground/10 rounded"></div>
                               <div className="h-2.5 w-full bg-muted-foreground/10 rounded"></div>
                               <div className="h-2.5 w-2/3 bg-muted-foreground/10 rounded"></div>
                             </div>
                           </div>
                         </CardContent>
                     </Card>
                  </motion.div>
                </div>
              </motion.div>
            </div>

             <motion.div
                className="text-center mt-16 md:mt-24"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" onClick={() => router.push('/auth')}>
                Comenzar ahora
              </Button>
            </motion.div>
          </div>
        </motion.section>

         {/* Risk Map Section (Optional - Can be added later) */}
         {/* <section> ... </section> */}

      </main>

       {/* Footer */}
       <footer className="bg-primary/5 py-6 mt-12">
         <div className="container text-center text-muted-foreground text-sm">
           © {new Date().getFullYear()} +Seguro Uruapan. Todos los derechos reservados.
         </div>
       </footer>
    </div>
  );
};

export default HomePage;
