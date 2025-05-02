
"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ArrowLeft, LogIn } from "lucide-react"; // Use LogIn icon
import { useToast } from "@/hooks/use-toast";

// Updated schema to include rememberMe
const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  rememberMe: z.boolean().optional().default(false), // Add rememberMe field
});

type FormData = z.infer<typeof formSchema>;

const LoginPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false, // Default to false
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    try {
       // Set persistence based on rememberMe checkbox
       const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
       await setPersistence(auth, persistence);
       console.log(`Auth persistence set to: ${values.rememberMe ? 'local' : 'session'}`);


      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo...", // Shorter message
      });
      setTimeout(() => {
        router.push("/welcome"); // Redirect to welcome page
      }, 1000); // Slightly shorter delay
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Ocurrió un problema. Verifica tus credenciales e intenta de nuevo."; // More concise default

      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        friendlyError = 'Correo o contraseña incorrectos. Verifica tus datos.'; // More direct message
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo no es válido.';
      } else if (authError.code === 'auth/user-disabled') {
         friendlyError = 'Esta cuenta ha sido deshabilitada.';
      } else if (authError.code === 'auth/too-many-requests') {
          friendlyError = 'Demasiados intentos fallidos. Intenta más tarde.';
      }
      console.error("Firebase Login Error:", authError);
      toast({
        variant: "destructive",
        title: "Error al Iniciar Sesión", // Keep title consistent
        description: friendlyError,
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      {/* Increased shadow, consistent rounded corners */}
      <Card className="w-full max-w-md shadow-xl border-none rounded-xl bg-card">
         <CardHeader className="text-center relative pb-4 pt-8">
           {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
              onClick={() => router.push('/')}
              aria-label="Volver"
              type="button"
              disabled={isLoading}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
           {/* More spacing below title */}
           <CardTitle className="text-2xl font-bold text-primary pt-2 mb-1">Iniciar Sesión</CardTitle>
          <CardDescription className="text-muted-foreground">Ingresa tus credenciales para acceder.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-4 pb-6"> {/* Increased top padding */}
          <Form {...form}>
            {/* Increased spacing between form elements */}
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
                        placeholder="tu@ejemplo.com"
                        {...field}
                        disabled={isLoading}
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.password}
                        className="h-11"
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember Me Checkbox and Forgot Password Link */}
              <div className="flex items-center justify-between space-x-4 pt-1">
                 <FormField
                   control={form.control}
                   name="rememberMe"
                   render={({ field }) => (
                     <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                       <FormControl>
                         <Checkbox
                           checked={field.value}
                           onCheckedChange={field.onChange}
                           disabled={isLoading}
                           id="remember-me" // Add id for label association
                         />
                       </FormControl>
                       {/* Link the label to the checkbox */}
                       <FormLabel
                           htmlFor="remember-me"
                           className="text-sm font-normal text-muted-foreground cursor-pointer" // Style label
                       >
                         Recordar usuario
                       </FormLabel>
                     </FormItem>
                   )}
                 />
                 <Link href="/forgot-password"
                   className="text-sm text-accent hover:text-accent/90 underline whitespace-nowrap">
                     ¿Olvidaste tu contraseña?
                 </Link>
              </div>


              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-8" // Increased margin-top
                disabled={isLoading}
              >
                 <LogIn className="mr-2 h-4 w-4" /> {/* Use LogIn icon */}
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-4 pb-8"> {/* Adjusted padding */}
           <p>¿No tienes cuenta?{' '}
             <Link href="/register" className="text-accent hover:text-accent/90 font-medium underline">
               Regístrate aquí
             </Link>
           </p>
         </CardFooter>
      </Card>
    </main>
  );
};

export default LoginPage;


    