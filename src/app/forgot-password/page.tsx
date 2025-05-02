
"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendPasswordResetEmail, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ArrowLeft, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPasswordPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setIsEmailSent(false); // Reset email sent state
    try {
      await sendPasswordResetEmail(auth, values.email);
      setIsEmailSent(true); // Set state to show success message
      toast({
        title: "Correo Enviado",
        description: "Revisa tu bandeja de entrada para el enlace de restablecimiento.",
      });
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Ocurrió un problema al enviar el correo. Por favor, inténtalo de nuevo.";

      if (authError.code === 'auth/user-not-found') {
        // Avoid confirming if an email exists for security, but be slightly more helpful
        friendlyError = 'No se pudo enviar el correo. Verifica la dirección e intenta de nuevo.';
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo electrónico no es válido.';
      }
      console.error("Firebase Password Reset Error:", authError);
      toast({
        variant: "destructive",
        title: "Error al Enviar Correo",
        description: friendlyError,
      });
    } finally {
       // Keep loading false after success or error, but don't reset email sent state here
       // Let the user see the success message or error toast
       setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl">
        <CardHeader className="text-center relative pb-4 pt-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
            onClick={() => router.push('/login')} // Navigate back to login
            aria-label="Volver a Inicio de Sesión"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-bold text-primary pt-2">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isEmailSent
              ? "Hemos enviado un enlace a tu correo electrónico."
              : "Ingresa tu correo para restablecer tu contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          {isEmailSent ? (
            <div className="text-center p-4 border border-green-200 bg-green-50 rounded-lg">
                <MailCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-700">
                Revisa tu bandeja de entrada (y spam) para encontrar el enlace de restablecimiento.
              </p>
               <Button
                  variant="link"
                  className="mt-4 text-accent hover:text-accent/90"
                  onClick={() => router.push('/login')}
                >
                  Volver a Iniciar Sesión
                </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Enlace de Restablecimiento"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!isEmailSent && (
           <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
             <p>¿Recordaste tu contraseña?{' '}
               <Link href="/login" className="text-accent hover:text-accent/90 font-medium underline">
                 Inicia sesión aquí
               </Link>
             </p>
           </CardFooter>
        )}
      </Card>
    </main>
  );
};

export default ForgotPasswordPage;
```></content>
  </change>
  <change>
    <file>src/app/login/page.tsx</file>
    <description>Add link to the new forgot password page.</description>
    <content><![CDATA[
"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Corrected import path

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }), // Min 1 for login
});

type FormData = z.infer<typeof formSchema>;

const LoginPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // Error state removed, using toast instead
  // const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    // setError(null); // No longer needed
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso", // Consistent capitalization
        description: "Redirigiendo a la página de bienvenida...",
      });
      // Add a slight delay for the toast message
      setTimeout(() => {
        router.push("/welcome");
      }, 1500);
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Ocurrió un problema al iniciar sesión. Por favor, inténtalo de nuevo."; // Default friendly message

      // More specific error messages based on Firebase error codes
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        // Combined message for invalid login attempts
        friendlyError = 'El correo electrónico o la contraseña no son correctos. Verifica tus datos e intenta de nuevo.';
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo electrónico no es válido. Por favor, revisa que esté bien escrito.';
      } else if (authError.code === 'auth/user-disabled') {
         friendlyError = 'Esta cuenta ha sido deshabilitada. Contacta al soporte si crees que es un error.';
      }
      console.error("Firebase Login Error:", authError);
      // Use toast to display the error
      toast({
        variant: "destructive",
        title: "Problema al Iniciar Sesión",
        description: friendlyError,
      });
      // setError(friendlyError); // No longer needed
      setIsLoading(false); // Stop loading on error
    }
    // Keep loading true until redirect or explicit stop on error
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl">
         <CardHeader className="text-center relative pb-4 pt-8"> {/* Added pt-8 for more space */}
           {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full" // Consistent position & styling
              onClick={() => router.push('/')} // Navigate back to home/auth screen
              aria-label="Volver"
              type="button" // Ensure it doesn't submit the form
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <CardTitle className="text-2xl font-bold text-primary pt-2">Iniciar Sesión</CardTitle>
          <CardDescription className="text-muted-foreground">Ingresa con tu correo electrónico.</CardDescription> {/* Adjusted text */}
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6"> {/* Adjusted padding */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5"> {/* Adjusted spacing */}
              {/* Removed Alert component */}
              {/* {error && (
                 <Alert variant="destructive" className="mb-4">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Problema al Iniciar Sesión</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
              )} */}
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
                        className="h-11" // Consistent height
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
                        className="h-11" // Consistent height
                       />
                    </FormControl>
                    <FormMessage />
                     {/* Forgot password link */}
                     <div className="text-right">
                        <Link href="/forgot-password"
                          className="text-sm text-accent hover:text-accent/90 underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                     </div>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg" // Make button larger
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6" // Added margin-top
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8"> {/* Adjusted padding */}
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
```