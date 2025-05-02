
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import necessary Firebase auth functions
import { auth } from '@/lib/firebase/client'; // Import the initialized auth instance
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast'; // Import useToast hook
import { GoogleIcon } from '@/components/icons/google-icon';
import { Mail } from 'lucide-react';

const AuthScreen: FC = () => {
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Ensure the domain is authorized in Firebase Console -> Authentication -> Settings -> Authorized domains
      await signInWithPopup(auth, provider);
      // User signed in successfully
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo a la página de bienvenida...",
      });
      // Add a slight delay for the toast message
      setTimeout(() => {
        router.push("/welcome");
      }, 1500);
    } catch (error: any) {
      // Handle Errors here.
      console.error("Google Sign-In Error:", error);
      let description = "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "El proceso de inicio de sesión fue cancelado.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        description = "Se canceló la solicitud de inicio de sesión.";
      } else if (error.code === 'auth/unauthorized-domain') {
         description = "Este dominio no está autorizado para iniciar sesión con Google. Contacta al administrador.";
      }
      toast({
        variant: "destructive",
        title: "Fallo al Iniciar con Google",
        description: description,
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-secondary"> {/* Use secondary background */}
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl"> {/* Rounded Card */}
        <CardHeader className="text-center items-center pt-10 pb-6"> {/* Added padding */}
           {/* Using next/image for optimized image loading */}
          <Image
            data-ai-hint="logo security shield"
            src="https://picsum.photos/160/160" // Placeholder logo
            alt="+Seguro Logo"
            width={160}
            height={160}
            className="mb-5 rounded-full" // Rounded logo
            priority // Prioritize loading the logo
          />
          <CardTitle className="text-4xl font-bold text-primary">+Seguro</CardTitle>
          <CardDescription className="text-md text-muted-foreground px-6 pt-2">
            Reporta incidentes y mantente informado sobre la seguridad en tu zona.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 pb-8"> {/* Added padding */}
          <Button
            onClick={handleGoogleSignIn} // Attach the Google Sign-In handler
            className="w-full h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-base font-medium"
            size="lg"
          >
             <GoogleIcon className="mr-2 h-5 w-5" />
            Iniciar sesión con Google
          </Button>
          <Button
            asChild
             className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium" // Apply primary color
             size="lg"
          >
            <Link href="/login">
              <Mail className="mr-2 h-5 w-5" />
              Iniciar sesión con correo
            </Link>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-accent hover:text-accent/90 text-base mt-2 p-0 h-auto font-medium" // Style as a link using accent color
          >
             <Link href="/register">
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </Button>
        </CardContent>
      </Card>
       <p className="text-xs text-muted-foreground mt-6 mb-4">v1.0.0</p> {/* Version number */}
    </main>
  );
};

export default AuthScreen;
