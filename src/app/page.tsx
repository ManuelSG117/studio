"use client";

import type { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon } from '@/components/icons/google-icon'; // Import the new Google Icon
import { Mail } from 'lucide-react';

const AuthScreen: FC = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful!",
        description: "Redirecting you to the welcome page...",
      });
      setTimeout(() => {
        router.push("/welcome");
      }, 1500);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "Could not sign in with Google. Please try again.",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center items-center pt-10 pb-6">
           {/* Using next/image for optimized image loading */}
           {/* Replace with your actual logo path or keep placeholder */}
          <Image
            data-ai-hint="logo security shield"
            src="https://picsum.photos/160/160" // Placeholder, replace with your logo
            alt="+Seguro Logo"
            width={160}
            height={160}
            className="mb-5 rounded-full" // Added rounded-full for circular logo like in RN example
          />
          <CardTitle className="text-4xl font-bold text-primary">+Seguro</CardTitle>
          <CardDescription className="text-md text-muted-foreground px-6 pt-2">
            Tu plataforma de reportes de seguridad y prevención
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 pb-8">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-base font-medium"
            size="lg"
          >
             <GoogleIcon className="mr-2 h-5 w-5" /> {/* Use the SVG icon */}
            Iniciar sesión con Google
          </Button>
          <Button
            asChild
             className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium" // Apply primary color
             size="lg"
          >
            <Link href="/login"> {/* Link to a potential email login page */}
              <Mail className="mr-2 h-5 w-5" />
              Iniciar sesión con correo
            </Link>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-accent hover:text-accent/90 text-base mt-2 p-0 h-auto" // Style as a link using accent color
          >
             <Link href="/register">
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </Button>
        </CardContent>
      </Card>
       <p className="text-xs text-muted-foreground mt-6 mb-4">v1.0.0</p>
    </main>
  );
};

export default AuthScreen;
