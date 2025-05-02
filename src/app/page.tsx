
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { Loader2 } from 'lucide-react'; // Keep Loader2 for loading state

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
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  <span className="text-primary">+Seguro</span>
                  <span className="text-destructive ml-2">Uruapan</span> {/* Adjusted color to match image */}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Tu plataforma para reportar incidentes y contribuir a una comunidad más segura.
                </p>
              </div>
              <div className="space-y-2">
                <p className="mx-auto max-w-[700px] text-muted-foreground">
                  Reporta funcionarios públicos o incidentes delictivos de forma segura y anónima.
                </p>
              </div>
              <div className="w-full max-w-xs sm:max-w-sm space-y-2"> {/* Adjusted max-width */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="w-full transition-all border-2 border-primary text-primary hover:bg-primary/10 h-11 rounded-full"
                    size="lg"
                   >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => router.push('/register')}
                    className="w-full transition-all bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11 rounded-full" // Use destructive color
                    size="lg"
                    variant="default" // Explicitly default, but destructive overrides color
                   >
                    Registrarse
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Report Types Section */}
        <section className="w-full py-16 md:py-24 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary hover:bg-primary/20"> {/* Adjusted badge style */}
                ¿QUÉ HACEMOS?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Reporta incidentes en tu comunidad</h2>
              <p className="text-muted-foreground text-lg">
                +Seguro Uruapan te permite contribuir a una comunidad más segura. Elige el tipo de reporte:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
              {/* Public Servant Card */}
              <Card className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary bg-card">
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
                    onClick={() => router.push('/login')} // Go to login/register first
                   >
                    Reportar Funcionario
                    <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              {/* Crime Report Card */}
              <Card className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-t-destructive bg-card">
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
                    onClick={() => router.push('/login')} // Go to login/register first
                   >
                    Reportar Incidente
                    <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Optional - Can be added later if needed) */}
      <footer className="bg-primary/5 py-6 mt-12">
        <div className="container text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} +Seguro Uruapan. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
