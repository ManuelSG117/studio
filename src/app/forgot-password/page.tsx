
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
