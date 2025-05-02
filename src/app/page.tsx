
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation
import { motion, useScroll, useTransform } from "framer-motion";
import Link from 'next/link'; // Use next/link

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"; // Assuming carousel is added
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ChevronRight, Heart, Shield, AlertTriangle, HelpCircle, MapPin, Navigation, Check } from 'lucide-react';

// Custom Components and Context
import { useAuth } from '@/context/AuthContext'; // Import AuthContext
import { RiskMap } from '@/components/RiskMap'; // Import RiskMap

const HomePage: FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const { isAuthenticated, user, loading } = useAuth(); // Get loading state from context
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to load
    if (!loading) {
        // If user is logged in but profile is not complete, redirect to profile edit page
        if (isAuthenticated && user && !user.isProfileComplete) {
          router.push('/profile/edit'); // Go to profile editing first
        }
        // If user is logged in and profile is complete, redirect to reports page
        else if (isAuthenticated && user && user.isProfileComplete) {
          router.push('/welcome'); // Go to main app page
        }
        // If not authenticated, stay on the landing page
    }
  }, [isAuthenticated, user, loading, router]);

  // Animation variants (remain mostly the same)
   const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.3, duration: 0.5 }
    }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };
  const reportSectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3, duration: 0.8 }
    }
  };
  const reportCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };
  const scrollRevealVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background"> {/* Use theme background */}
      {/* Progress Bar */}
      <motion.div
        style={{
            scaleX: scrollYProgress,
            position: "fixed", // Added position fixed
            top: 0,
            left: 0,
            right: 0,
            height: "4px", // Use string for pixels
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--destructive)))", // Use theme colors
            transformOrigin: "0%",
            zIndex: 50 // Ensure it's on top
        }}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-card to-secondary/10" // Use theme colors
          style={{ opacity, scale }}
        >
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
                  <span className="text-secondary-foreground"> Uruapan</span> {/* Changed color for better contrast */}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                   Tu plataforma ciudadana para reportar incidentes y construir un entorno más seguro.
                </p>
              </motion.div>
              <motion.div className="space-y-2" variants={itemVariants}>
                <p className="mx-auto max-w-[700px] text-muted-foreground">
                   Reporta funcionarios públicos o incidentes delictivos de forma segura. {/* Simplified message */}
                </p>
              </motion.div>
              <motion.div className="w-full max-w-sm space-y-2" variants={itemVariants}>
                <div className="grid grid-cols-2 gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                     <Button asChild variant="outline" className="w-full transition-all border-2 border-primary hover:bg-primary/10">
                       <Link href="/login" className="w-full">
                         Iniciar Sesión
                       </Link>
                     </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                     <Button asChild className="w-full transition-all" variant="secondary">
                       <Link href="/register" className="w-full">
                         Registrarse
                       </Link>
                     </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Enhanced Report Types Section */}
        <motion.section
          className="w-full py-16 md:py-24 bg-gradient-to-br from-secondary/5 to-secondary/10 my-8 mx-auto max-w-7xl px-4 rounded-lg" // Added rounded-lg
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={scrollRevealVariants}
        >
          <motion.div className="text-center mb-12 max-w-3xl mx-auto" variants={scrollRevealVariants}>
            <Badge className="mb-4 bg-secondary/70 hover:bg-secondary text-secondary-foreground">¿QUÉ HACEMOS?</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Reporta incidentes en tu comunidad</h2>
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
              <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary bg-card"> {/* Mapped authority to primary */}
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Funcionarios
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-primary mb-4 group-hover:translate-x-1 transition-transform">
                    Funcionarios Públicos
                  </h3>

                  <p className="text-muted-foreground mb-8">
                    Reporta conductas inapropiadas, corrupción o abuso de poder por parte de funcionarios públicos. Tu denuncia puede ser el catalizador para un cambio positivo.
                  </p>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <motion.div whileTap={{ scale: 0.95 }}>
                         <Button asChild variant="outline" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 group-hover:shadow-md">
                           <Link href="/login" className="flex items-center justify-center gap-2">
                             Reportar Funcionario
                             <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                           </Link>
                         </Button>
                      </motion.div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-popover text-popover-foreground p-4 shadow-lg rounded-lg border border-primary/20">
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
              <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-destructive bg-card"> {/* Mapped alert to destructive */}
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-300">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Delitos
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-destructive mb-4 group-hover:translate-x-1 transition-transform">
                    Delitos e Incidentes
                  </h3>

                  <p className="text-muted-foreground mb-8">
                    Informa sobre robos, asaltos u otros delitos en tu comunidad. Contribuye a crear zonas más seguras y ayuda a prevenir futuros incidentes.
                  </p>

                   <HoverCard>
                    <HoverCardTrigger asChild>
                      <motion.div whileTap={{ scale: 0.95 }}>
                         <Button asChild variant="outline" className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-300 group-hover:shadow-md">
                           <Link href="/login" className="flex items-center justify-center gap-2">
                             Reportar Incidente
                             <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                           </Link>
                         </Button>
                      </motion.div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-popover text-popover-foreground p-4 shadow-lg rounded-lg border border-destructive/20">
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
        </motion.section>

        {/* Enhanced How It Works Section */}
        <motion.section
          className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-card to-secondary/10 overflow-hidden"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={scrollRevealVariants}
          id="how-it-works"
        >
          <div className="container px-4 md:px-6">
            <motion.div className="text-center mb-16" variants={scrollRevealVariants}>
              <Badge className="mb-4 bg-primary/70 hover:bg-primary text-primary-foreground">PROCESO</Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-primary">
                ¿Cómo funciona?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Nuestra plataforma está diseñada para hacer el reporte de incidentes fácil, seguro y efectivo
              </p>
            </motion.div>

            {/* Steps with timeline */}
            <div className="relative max-w-5xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary/60 via-secondary to-destructive/60 rounded-full hidden md:block"></div>

              {/* Step 1 */}
              <motion.div
                className="relative mb-24 md:mb-32"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="md:grid md:grid-cols-2 gap-12 items-center">
                  <motion.div
                    className="md:text-right mb-8 md:mb-0 md:pr-12"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4 md:ml-auto"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      1
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">Crea una cuenta</h3>
                    <p className="text-muted-foreground">
                      Regístrate rápidamente con tu correo o usa tu cuenta de Google. Tu información permanecerá privada y segura.
                    </p>
                    <motion.div className="mt-6" whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 flex items-center">
                         <Link href="/register" className="flex items-center">
                           Crear cuenta
                           <ChevronRight className="ml-1 h-4 w-4" />
                         </Link>
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="bg-card p-6 rounded-xl shadow-lg border border-border"
                    whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="overflow-hidden bg-gradient-to-br from-card to-secondary/5 shadow-md">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <h4 className="text-lg font-medium">Crear Cuenta</h4>
                            <p className="text-sm text-muted-foreground">Rápido y seguro</p>
                          </div>
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                            <div className="h-10 w-3/4 bg-muted rounded animate-pulse"></div>
                          </div>
                          <div className="flex justify-end">
                            <div className="h-9 w-24 bg-primary/20 rounded animate-pulse"></div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 top-12 transform md:-translate-x-1/2 h-6 w-6 bg-background border-4 border-primary rounded-full hidden md:block"></div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                 className="relative mb-24 md:mb-32"
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, amount: 0.2 }}
                 transition={{ duration: 0.6, delay: 0.2 }}
              >
                 <div className="md:grid md:grid-cols-2 gap-12 items-center">
                   <motion.div
                     className="order-2 md:order-1 mb-8 md:mb-0"
                     whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                     transition={{ type: "spring", stiffness: 300 }}
                   >
                     <Card className="overflow-hidden bg-gradient-to-br from-card to-secondary/5 shadow-md">
                       <CardContent className="p-6">
                         <div className="flex justify-between items-start mb-6">
                           <div className="space-y-1">
                             <h4 className="text-lg font-medium">Crear Reporte</h4>
                             <p className="text-sm text-muted-foreground">Detallado y preciso</p>
                           </div>
                           <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary/10 text-secondary-foreground"> {/* Adjusted secondary color */}
                             <AlertTriangle className="h-4 w-4" />
                           </span>
                         </div>
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <div className="flex gap-2">
                               <div className="h-10 w-1/3 bg-muted rounded animate-pulse"></div>
                               <div className="h-10 w-1/3 bg-muted rounded animate-pulse"></div>
                               <div className="h-10 w-1/3 bg-muted rounded animate-pulse"></div>
                             </div>
                             <div className="h-20 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                           </div>
                           <div className="h-24 w-full bg-muted/50 rounded flex items-center justify-center border border-dashed border-border">
                             <MapPin className="h-8 w-8 text-muted-foreground" />
                           </div>
                           <div className="flex justify-end">
                             <div className="h-9 w-32 bg-secondary/20 rounded animate-pulse"></div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>

                   <motion.div
                     className="md:text-left md:pl-12 order-1 md:order-2"
                     whileHover={{ scale: 1.03 }}
                     transition={{ type: "spring", stiffness: 300 }}
                   >
                     <motion.div
                       className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-secondary-foreground text-xl font-bold mb-4"
                       whileHover={{ rotate: -5, scale: 1.1 }}
                     >
                       2
                     </motion.div>
                     <h3 className="text-2xl md:text-3xl font-bold mb-4">Crea un reporte detallado</h3>
                     <p className="text-muted-foreground">
                       Describe el incidente, añade la ubicación, adjunta evidencia y clasifica el tipo. Más detalles, mejor ayuda.
                     </p>
                     <motion.div className="mt-6" whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
                       <Button asChild variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center"> {/* Adjusted secondary color */}
                          <Link href="/login" className="flex items-center">
                             Crear reporte
                             <ChevronRight className="ml-1 h-4 w-4" />
                           </Link>
                       </Button>
                     </motion.div>
                   </motion.div>
                 </div>
                 {/* Timeline dot */}
                 <div className="absolute left-0 md:left-1/2 top-12 transform md:-translate-x-1/2 h-6 w-6 bg-background border-4 border-secondary rounded-full hidden md:block"></div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                 className="relative"
                 initial={{ opacity: 0, y: 50 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, amount: 0.2 }}
                 transition={{ duration: 0.6, delay: 0.3 }}
              >
                 <div className="md:grid md:grid-cols-2 gap-12 items-center">
                   <motion.div
                     className="md:text-right mb-8 md:mb-0 md:pr-12"
                     whileHover={{ scale: 1.03 }}
                     transition={{ type: "spring", stiffness: 300 }}
                   >
                     <motion.div
                       className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive text-destructive-foreground text-xl font-bold mb-4 md:ml-auto"
                       whileHover={{ rotate: 5, scale: 1.1 }}
                     >
                       3
                     </motion.div>
                     <h3 className="text-2xl md:text-3xl font-bold mb-4">Da seguimiento</h3>
                     <p className="text-muted-foreground">
                       Monitorea el estado de tu reporte y recibe notificaciones. Observa cómo tu contribución ayuda a mejorar la seguridad.
                     </p>
                     <motion.div className="mt-6" whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                       <Button asChild variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 flex items-center">
                          <Link href="/login" className="flex items-center">
                             Ver seguimiento
                             <ChevronRight className="ml-1 h-4 w-4" />
                           </Link>
                       </Button>
                     </motion.div>
                   </motion.div>

                   <motion.div
                     className="bg-card p-6 rounded-xl shadow-lg border border-border"
                     whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                     transition={{ type: "spring", stiffness: 300 }}
                   >
                     <Card className="overflow-hidden bg-gradient-to-br from-card to-secondary/5 shadow-md">
                       <CardContent className="p-6">
                         <div className="flex justify-between items-start mb-6">
                           <div className="space-y-1">
                             <h4 className="text-lg font-medium">Seguimiento de Reporte</h4>
                             <p className="text-sm text-muted-foreground">Estado actualizado</p>
                           </div>
                           <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive">
                             <Navigation className="h-4 w-4" />
                           </span>
                         </div>
                         <div className="space-y-4">
                           <div className="rounded-lg bg-muted/50 p-4 border border-border">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-sm font-medium">Reporte #12345</span>
                               <Badge className="bg-green-500 text-white">Activo</Badge> {/* Example status */}
                             </div>
                             <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                               <motion.div
                                 className="h-full bg-green-500"
                                 initial={{ width: "0%" }}
                                 whileInView={{ width: "75%" }}
                                 transition={{ duration: 1.5, delay: 0.5 }}
                               />
                             </div>
                             <div className="mt-2 text-xs text-right text-muted-foreground">75% completado</div>
                           </div>
                           <div className="h-24 w-full rounded bg-muted/50 border border-border p-2 flex flex-col justify-between">
                             <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
                             <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                             <div className="h-3 w-2/3 bg-muted rounded animate-pulse"></div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>
                 </div>
                 {/* Timeline dot */}
                 <div className="absolute left-0 md:left-1/2 top-12 transform md:-translate-x-1/2 h-6 w-6 bg-background border-4 border-destructive rounded-full hidden md:block"></div>
              </motion.div>
            </div>

            <motion.div
              className="text-center mt-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                 <Link href="/register" className="px-8 py-6 text-lg">
                    Comenzar ahora
                 </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Risk Map Section */}
        <motion.section
          className="w-full py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-card"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={scrollRevealVariants}
        >
          <div className="container px-4 md:px-6">
            <motion.div className="text-center mb-12" variants={scrollRevealVariants}>
              <Badge className="mb-4 bg-destructive/70 hover:bg-destructive text-destructive-foreground">ZONAS DE RIESGO</Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-primary">
                Mapa de incidencias
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Explora las áreas con mayor número de reportes para mantenerte informado y tomar precauciones
              </p>
            </motion.div>

            <motion.div
              className="rounded-2xl overflow-hidden shadow-xl border border-border"
              variants={scrollRevealVariants}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative h-[500px] w-full bg-muted"> {/* Added background */}
                {/* Placeholder or Loading state for the map */}
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Cargando mapa...
                 </div>
                {/* <RiskMap /> */} {/* Uncomment when RiskMap is implemented */}
              </div>
            </motion.div>

            {/* Legend */}
            <motion.div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto" variants={scrollRevealVariants}>
               {/* Mapped colors to theme */}
              <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                <div className="h-4 w-4 rounded-full bg-red-500"></div> {/* Keep specific colors for legend */}
                <span className="text-sm font-medium">Alta incidencia</span>
              </div>
              <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                <div className="h-4 w-4 rounded-full bg-orange-400"></div>
                <span className="text-sm font-medium">Media incidencia</span>
              </div>
              <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                <div className="h-4 w-4 rounded-full bg-yellow-300"></div>
                <span className="text-sm font-medium">Baja incidencia</span>
              </div>
              <div className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card shadow-sm border border-border">
                <div className="h-4 w-4 rounded-full bg-green-400"></div>
                <span className="text-sm font-medium">Zona segura</span>
              </div>
            </motion.div>
          </div>
        </motion.section>

      </main>

      {/* Enhanced Footer */}
       <motion.footer
         className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16" // Use gray for footer
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ duration: 0.6 }}
       >
         <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {/* About Section */}
             <div className="space-y-6">
               <motion.div
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2, duration: 0.6 }}
               >
                 <h3 className="text-2xl font-bold text-white flex items-center">
                   <span className="text-primary">+</span>Seguro
                   <span className="text-secondary-foreground ml-1">Uruapan</span> {/* Adjusted color */}
                 </h3>
                 <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                   Plataforma ciudadana para reportar incidentes y crear una ciudad más segura.
                 </p>
               </motion.div>
                <motion.div
                    className="flex space-x-4 mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    {/* Social/Link Icons */}
                    <motion.a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                        <Heart className="h-5 w-5" />
                    </motion.a>
                    <motion.a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                        <HelpCircle className="h-5 w-5" />
                    </motion.a>
                    <motion.a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                        <ExternalLink className="h-5 w-5" />
                    </motion.a>
                </motion.div>
             </div>

             {/* Links Section */}
             <div className="space-y-6">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3, duration: 0.6 }}
               >
                 <h3 className="text-2xl font-bold text-white">Enlaces útiles</h3>
                 <ul className="space-y-4 mt-5">
                    {['Preguntas frecuentes', 'Términos y condiciones', 'Política de privacidad', 'Contacto'].map((linkText, index) => (
                         <motion.li key={index} whileHover={{ x: 5 }} className="transition-all border-b border-white/10 pb-2">
                           <Link href="#" className="text-slate-300 hover:text-white text-sm flex items-center">
                              <ChevronRight className="h-4 w-4 mr-2 text-primary" />
                              {linkText}
                            </Link>
                         </motion.li>
                    ))}
                 </ul>
               </motion.div>
             </div>

             {/* Contact Section */}
             <div className="space-y-6">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4, duration: 0.6 }}
               >
                 <h3 className="text-2xl font-bold text-white">Contáctanos</h3>
                 <p className="text-slate-300 text-sm mt-3">
                   ¿Preguntas o sugerencias? Escríbenos.
                 </p>
                 <motion.div className="mt-6 space-y-3" whileHover={{ scale: 1.02 }}>
                    {/* Simplified Contact Form Placeholder */}
                   <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                     <input type="email" placeholder="Tu correo electrónico" className="w-full bg-transparent border-b border-white/20 pb-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-primary" />
                     <Button asChild className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                       <Link href="mailto:contacto@masseguro.com">Enviar mensaje</Link> {/* Example mailto link */}
                     </Button>
                   </div>
                   <div className="flex justify-center mt-4">
                       <motion.a href="tel:1234567890" className="text-xs text-slate-400 hover:text-white underline" whileHover={{ y: -2 }}>
                         Llámanos al (123) 456-7890
                       </motion.a>
                   </div>
                 </motion.div>
               </motion.div>
             </div>
           </div>

           {/* Footer Bottom */}
           <motion.div
             className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             transition={{ delay: 0.5, duration: 0.8 }}
           >
             <p className="text-sm text-slate-400">
               © {new Date().getFullYear()} +Seguro Uruapan. Todos los derechos reservados.
             </p>
             <div className="flex gap-6 mt-4 md:mt-0">
               {['Términos', 'Privacidad', 'Cookies'].map((linkText, index) => (
                  <motion.a key={index} href="#" className="text-xs text-slate-400 hover:text-white transition-colors" whileHover={{ y: -2 }}>
                    {linkText}
                 </motion.a>
               ))}
             </div>
           </motion.div>
         </div>
       </motion.footer>
    </div>
  );
};

export default HomePage;
