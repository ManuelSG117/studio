
"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, type AuthError, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Ensure CardFooter is imported
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Separator } from "@/components/ui/separator"; // Import Separator
import { GoogleIcon } from '@/components/icons/google-icon';
import { LogIn, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { cn } from "@/lib/utils"; // Import cn for conditional classes

// Schema remains the same
const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

   // Google Sign-In Handler
   const handleGoogleSignIn = async () => {
     setIsGoogleLoading(true);
     setAuthError(null); // Clear previous errors
     const provider = new GoogleAuthProvider();
     try {
       await setPersistence(auth, browserLocalPersistence); // Use local persistence for Google Sign-In
       await signInWithPopup(auth, provider);
       toast({
         title: "Inicio de Sesión con Google Exitoso",
         description: "Verificando perfil...",
       });
        // AuthProvider will handle redirect based on profile status
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
           }
       }
       setAuthError(friendlyError);
     } finally {
        setIsGoogleLoading(false);
     }
   };


  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setIsGoogleLoading(false);
    setAuthError(null);
    try {
       // Set persistence (session only)
       await setPersistence(auth, browserSessionPersistence);
       console.log(`Auth persistence set to: session`);

      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo...",
      });
      // AuthProvider handles redirect
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Credenciales incorrectas. Verifica tu correo y contraseña.";

      if (authError.code === 'auth/invalid-credential') {
          friendlyError = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo electrónico no es válido.';
      } else if (authError.code === 'auth/user-disabled') {
         friendlyError = 'Esta cuenta ha sido deshabilitada.';
      } else if (authError.code === 'auth/too-many-requests') {
          friendlyError = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
      }
      console.error("Firebase Login Error:", authError);
      setAuthError(friendlyError);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl bg-card">
         <CardHeader className="text-center pb-6 pt-8"> {/* Increased padding bottom */}
            {/* Logo and Title */}
            <div className="flex items-center justify-center space-x-2 mb-2">
                <Image
                    src="/icon.png"
                    alt="App Logo"
                    width={32} // Smaller logo inline with text
                    height={32}
                    className="rounded-sm" // Optional: Adjust rounding
                    priority
                    data-ai-hint="app logo"
                 />
                 <CardTitle className="text-3xl font-bold text-primary tracking-tight">
                    <span className="text-primary">Ciudadano</span>
                    <span className="text-destructive">Alerta</span>
                 </CardTitle>
            </div>
           <CardDescription className="text-muted-foreground text-sm">Plataforma para reportes ciudadanos</CardDescription>
        </CardHeader>

        <Tabs defaultValue="login" className="w-full px-6 sm:px-8"> {/* Add padding to Tabs container */}
           <TabsList className="grid w-full grid-cols-2 h-auto mb-6 bg-muted"> {/* Ensure TabsList uses muted background */}
               <TabsTrigger value="login" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"> {/* Use background for active tab */}
                  Iniciar Sesión
               </TabsTrigger>
               <TabsTrigger value="register" onClick={() => router.push('/register')} className="py-2.5 text-muted-foreground">
                  Registrarse
               </TabsTrigger>
           </TabsList>
           <TabsContent value="login">
             <CardContent className="p-0 pb-6 space-y-6"> {/* Remove padding top from CardContent, add spacing */}
                {/* Error Alert */}
                {authError && (
                   <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                     <Terminal className="h-4 w-4" />
                     <AlertTitle className="font-semibold">Error de Inicio de Sesión</AlertTitle>
                     <AlertDescription className="text-xs">
                       {authError}
                     </AlertDescription>
                   </Alert>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5"> {/* Reduced space */}
                    {/* Email Field */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tu@correo.com"
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading || isGoogleLoading}
                              aria-required="true"
                              aria-invalid={!!form.formState.errors.email}
                              className="h-11" // Keep height
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Password Field */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                           <div className="flex justify-between items-center">
                               <FormLabel>Contraseña</FormLabel>
                               {/* Forgot Password Link - moved outside the label */}
                               <Link href="/forgot-password"
                                    className="text-xs text-accent hover:text-accent/90 underline"
                                    tabIndex={-1} // Make it focusable but not in main tab order
                                >
                                    ¿Olvidaste tu contraseña?
                               </Link>
                           </div>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading || isGoogleLoading}
                              aria-required="true"
                              aria-invalid={!!form.formState.errors.password}
                              className="h-11" // Keep height
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-md text-base font-medium" // Use default rounded-md
                      disabled={isLoading || isGoogleLoading}
                    >
                       {isLoading && !isGoogleLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                          null // No icon needed for primary login button
                       )}
                      {isLoading && !isGoogleLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>

                    {/* Divider */}
                    <div className="relative my-6"> {/* Increased margin */}
                       <div className="absolute inset-0 flex items-center">
                          <Separator />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                             O continúa con
                          </span>
                       </div>
                    </div>

                     {/* Google Sign-In Button */}
                    <Button
                       onClick={handleGoogleSignIn}
                       variant="outline"
                       className="w-full h-12 rounded-md text-base font-medium border-input hover:bg-accent/10" // Use default rounded-md
                       size="lg"
                       disabled={isLoading || isGoogleLoading}
                       type="button"
                     >
                       {isGoogleLoading ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                         <GoogleIcon className="mr-2 h-5 w-5" />
                       )}
                       {isGoogleLoading ? 'Iniciando...' : 'Continuar con Google'}
                    </Button>
                  </form>
                </Form>
             </CardContent>
             <CardFooter className="text-center text-xs text-muted-foreground justify-center pt-0 pb-8 px-6">
                 Al iniciar sesión, aceptas nuestros{' '}
                 <Link href="/terms" className="text-accent hover:text-accent/90 underline ml-1">
                   Términos y Condiciones
                 </Link>
              </CardFooter>
            </TabsContent>
            {/* TabsContent for register is not needed as the trigger navigates */}
            {/* <TabsContent value="register"> ... </TabsContent> */}
        </Tabs>

      </Card>
    </main>
  );
};

export default LoginPage;

    