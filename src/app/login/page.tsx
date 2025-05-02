
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
// Import CardFooter along with other Card components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Separator } from "@/components/ui/separator"; // Import Separator
import { GoogleIcon } from '@/components/icons/google-icon'; // Import Google Icon
import { LogIn, Loader2 } from "lucide-react"; // Use LogIn icon, keep Loader2
import { useToast } from "@/hooks/use-toast";
import Image from "next/image"; // Import Image
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { Terminal } from 'lucide-react'; // Use Terminal for alert icon

// Schema remains the same (without rememberMe)
const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  // rememberMe: z.boolean().optional().default(false), // Removed rememberMe
});

type FormData = z.infer<typeof formSchema>;

const LoginPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Specific loading state for Google Sign-In
  const [authError, setAuthError] = useState<string | null>(null); // State for auth errors
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      // rememberMe: false, // Removed default value
    },
  });

  // Google Sign-In Handler
   const handleGoogleSignIn = async () => {
     setIsGoogleLoading(true);
     setAuthError(null); // Clear previous errors
     const provider = new GoogleAuthProvider();
     try {
       await signInWithPopup(auth, provider);
       toast({
         title: "Inicio de Sesión con Google Exitoso",
         description: "Verificando perfil...",
       });
        // AuthProvider will handle redirect based on profile status
        // No immediate redirect here to allow AuthProvider to work
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
       setAuthError(friendlyError); // Display error in the UI
     } finally {
        setIsGoogleLoading(false);
     }
   };


  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setIsGoogleLoading(false);
    setAuthError(null); // Clear previous errors
    try {
       // Set persistence (session only, as "remember me" was removed)
       await setPersistence(auth, browserSessionPersistence);
       console.log(`Auth persistence set to: session`);

      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo...",
      });
      // AuthProvider will handle redirect based on profile status
      // No immediate redirect here to allow AuthProvider to work
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Ocurrió un problema. Verifica tus credenciales e intenta de nuevo.";

      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        // friendlyError = 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e inténtalo de nuevo.';
         friendlyError = 'Credenciales incorrectas. Verifica tu correo y contraseña.'; // Improved message
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo electrónico no es válido.';
      } else if (authError.code === 'auth/user-disabled') {
         friendlyError = 'Esta cuenta ha sido deshabilitada.';
      } else if (authError.code === 'auth/too-many-requests') {
          friendlyError = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
      }
      console.error("Firebase Login Error:", authError);
      setAuthError(friendlyError); // Set the error state to display in the Alert
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl bg-card overflow-hidden"> {/* Added overflow-hidden */}
         <CardHeader className="text-center pb-4 pt-8 bg-card"> {/* Ensure header bg matches card */}
           {/* Use the Image component for the logo */}
            <Image
               src="/icon.png" // Path to your logo in the public folder
               alt="App Logo"
               width={80} // Adjust size as needed
               height={80}
               className="mx-auto mb-3"
               priority
               data-ai-hint="app logo"
             />
           <CardTitle className="text-2xl font-bold text-primary">+Seguro</CardTitle> {/* Updated title */}
           <CardDescription className="text-muted-foreground text-sm">Plataforma para reportes ciudadanos</CardDescription>
        </CardHeader>

        {/* Tabs for Login and Register */}
        <Tabs defaultValue="login" className="w-full">
           <TabsList className="grid w-full grid-cols-2 h-auto rounded-none bg-muted/50 p-1"> {/* Adjusted styling */}
             <TabsTrigger value="login" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none">Iniciar Sesión</TabsTrigger>
             <TabsTrigger value="register" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none" onClick={() => router.push('/register')}>Registrarse</TabsTrigger>
           </TabsList>

           {/* Login Tab Content */}
           <TabsContent value="login">
             <CardContent className="px-6 sm:px-8 pt-6 pb-6">
                {/* Error Alert */}
                {authError && (
                   <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20 text-destructive">
                     <Terminal className="h-4 w-4" />
                     <AlertTitle className="font-semibold">Error de Autenticación</AlertTitle>
                     <AlertDescription className="text-xs">
                       {authError}
                     </AlertDescription>
                   </Alert>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tu@correo.com" // Updated placeholder
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading || isGoogleLoading}
                              aria-required="true"
                              aria-invalid={!!form.formState.errors.email}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                           <div className="flex justify-between items-center">
                               <FormLabel>Contraseña</FormLabel>
                               {/* Forgot Password Link moved here */}
                               <Link href="/forgot-password"
                                    className="text-xs text-accent hover:text-accent/90 underline">
                                    ¿Olvidaste?
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
                              className="h-11"
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                     {/* Removed Checkbox field */}


                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-md text-base font-medium" // Adjusted: removed rounded-full
                      disabled={isLoading || isGoogleLoading}
                    >
                       {isLoading && !isGoogleLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                          <LogIn className="mr-2 h-4 w-4" />
                       )}
                      {isLoading && !isGoogleLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>

                    {/* Separator */}
                    <div className="flex items-center my-6">
                       <Separator className="flex-1" />
                       <span className="mx-4 text-xs text-muted-foreground uppercase">O continúa con</span>
                       <Separator className="flex-1" />
                    </div>

                     {/* Google Sign-In Button */}
                    <Button
                       onClick={handleGoogleSignIn}
                       variant="outline"
                       className="w-full h-12 rounded-md text-base font-medium border-input hover:bg-accent/10" // Adjusted: removed rounded-full
                       size="lg"
                       disabled={isLoading || isGoogleLoading}
                       type="button" // Ensure it's not treated as submit
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
              {/* Terms Footer */}
              <CardFooter className="text-center text-xs text-muted-foreground justify-center pt-0 pb-6 px-6">
                 Al iniciar sesión, aceptas nuestros{' '}
                 <Link href="/terms" className="text-accent hover:text-accent/90 underline ml-1">
                   Términos y Condiciones
                 </Link>
                 .
              </CardFooter>
           </TabsContent>

           {/* Register Tab Content (Empty or could redirect) */}
           <TabsContent value="register">
             {/* No content needed here as onClick redirects */}
           </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
};

export default LoginPage;
