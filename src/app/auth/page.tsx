
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import AuthContext
import { signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, type AuthError } from "firebase/auth"; // Import Google Auth provider and persistence
import { auth } from '@/lib/firebase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from '@/components/icons/google-icon'; // Import Google Icon
import { Mail, Loader2, Terminal } from 'lucide-react'; // Icons for email login/signup, Loader, Terminal
import { useToast } from '@/hooks/use-toast'; // Import toast
import Image from 'next/image'; // Import Next Image
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

const AuthScreen: FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth(); // Get auth state and loading status
  const [isLoading, setIsLoading] = useState(true); // For initial loading and potentially Google Sign-In loading
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Specific loading state for Google Sign-In
  const [authError, setAuthError] = useState<string | null>(null); // State for displaying errors
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    // Only proceed once auth state is confirmed (loading is false)
    if (!loading) {
      if (isAuthenticated && user?.isProfileComplete) {
        router.replace('/welcome'); // Redirect to welcome if logged in and profile complete
      } else if (isAuthenticated && !user?.isProfileComplete) {
        router.replace('/profile/edit'); // Redirect to edit profile if logged in but profile incomplete
      } else {
        setIsLoading(false); // If not authenticated, stop loading and show the auth screen
      }
    }
    // Keep isLoading true while auth context is loading
    // Or if we are already authenticated and waiting for redirect
  }, [isAuthenticated, user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true); // Start Google loading indicator
    setAuthError(null); // Clear previous errors
    const provider = new GoogleAuthProvider();
    try {
       // Persist locally for Google Sign-in
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      // On successful sign-in, the useEffect hook will handle redirection based on profile completeness
      toast({
        title: "Inicio de Sesión con Google Exitoso",
        description: "Verificando perfil...",
      });
      // Let the useEffect handle the redirect logic based on profile status
    } catch (error) {
       console.error("Google Sign-In Error:", error);
       let friendlyError = "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.";
       if (error instanceof Error) {
           const firebaseError = error as AuthError;
           if (firebaseError.code === 'auth/popup-closed-by-user') {
               friendlyError = "Se cerró la ventana de inicio de sesión antes de completar.";
           } else if (firebaseError.code === 'auth/cancelled-popup-request') {
                friendlyError = "Se canceló la solicitud de inicio de sesión.";
           } else if (firebaseError.code === 'auth/unauthorized-domain') {
                friendlyError = "Este dominio no está autorizado para iniciar sesión con Google.";
                 toast({ // Use toast for this specific error
                    variant: "destructive",
                    title: "Dominio no Autorizado",
                    description: "Este dominio no está autorizado para usar Google Sign-In. Contacta al administrador.",
                 });
                 friendlyError = null; // Don't show in alert if shown in toast
           } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
                friendlyError = 'Ya existe una cuenta con este correo, pero con diferente método de inicio de sesión (ej. correo/contraseña).';
           }
       }
       if(friendlyError) setAuthError(friendlyError); // Set the error state if not handled by toast
       setIsGoogleLoading(false); // Stop Google loading on error
    }
    // Don't set isLoading(false) here, let the useEffect handle it
  };


  // Show loading state while checking auth or redirecting
  if (loading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </main>
    );
  }


  // If not loading and not authenticated, show the Auth Screen
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-sm shadow-xl border-none rounded-xl bg-card">
        <CardHeader className="text-center pt-10 pb-6"> {/* Increased top padding */}
          <Image
            src="/logo.png" // Assuming your logo is in the public folder
            alt="App Logo"
            width={100} // Increased size
            height={100} // Increased size
            className="mx-auto mb-5 rounded-lg shadow-sm" // Added shadow, increased margin bottom
            priority // Load logo quickly
            data-ai-hint="app logo safety shield"
          />
          <CardTitle className="text-3xl font-bold text-primary">+Seguro</CardTitle> {/* Kept size, but adjusted spacing */}
          <CardDescription className="text-muted-foreground px-4 pt-1"> {/* Added padding top */}
            Tu plataforma ciudadana para reportar incidentes y construir un entorno más seguro.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 pt-2 space-y-4"> {/* Adjusted padding */}
           {/* Error Alert */}
           {authError && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle className="font-semibold">Error de Autenticación</AlertTitle>
                <AlertDescription className="text-xs">
                  {authError}
                </AlertDescription>
              </Alert>
           )}

           {/* Google Sign-In Button */}
          <Button
             onClick={handleGoogleSignIn}
             className="w-full h-12 rounded-md bg-[#4285F4] hover:bg-[#4285F4]/90 text-white text-base font-medium border border-transparent" // Adjusted style, ensure border for consistency
             size="lg"
             disabled={isGoogleLoading} // Disable while Google loading
          >
             {isGoogleLoading ? (
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : (
               <GoogleIcon className="mr-2 h-5 w-5" />
             )}
             {isGoogleLoading ? 'Iniciando...' : 'Continuar con Google'}
          </Button>

          {/* Email Login Button */}
          <Button
            onClick={() => router.push('/login')}
            variant="outline" // Use outline style for contrast
            className="w-full h-12 rounded-md border-input hover:bg-accent/10 text-base font-medium" // Adjusted style
            size="lg"
            disabled={isGoogleLoading} // Also disable if Google is loading
          >
            <Mail className="mr-2 h-5 w-5" />
            Iniciar sesión con correo
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8 flex-col gap-2"> {/* Use flex-col and gap */}
           <p>¿No tienes cuenta?{' '}
             <button
               onClick={() => router.push('/register')}
               className="text-accent hover:text-accent/90 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={isGoogleLoading} // Disable if Google is loading
             >
               Regístrate aquí
             </button>
           </p>
           <p className="text-xs text-muted-foreground mt-4">v1.0.0</p> {/* Moved version here */}
         </CardFooter>
      </Card>
       {/* Removed version from bottom of main */}
    </main>
  );
};

export default AuthScreen;
