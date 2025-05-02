
"use client";

import type { FC } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
// Removed unused date-fns imports
// import { format } from "date-fns";
// import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Label import
// import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"; // Import FormDescription
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Removed unused RadioGroup imports
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Removed unused Popover/Calendar imports
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
// Removed unused CalendarIcon
import { Terminal, ArrowLeft } from "lucide-react"; // Import ArrowLeft
import { useToast } from "@/hooks/use-toast";

// Updated Schema: Only email, password, confirmPassword. Added password complexity and confirmation validation.
const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[A-Z]/, { message: "La contraseña debe contener al menos una letra mayúscula." })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: "La contraseña debe contener al menos un caracter especial." }),
  confirmPassword: z.string().min(1, { message: "Por favor confirma tu contraseña." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Set the error path to the confirmPassword field
});


type FormData = z.infer<typeof formSchema>;

const RegisterPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "", // Added default value
      // Removed unused fields
      // fullName: "",
      // address: "",
      // phoneNumber: "",
      // gender: undefined,
      // dob: undefined,
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setError(null);
    console.log("Registration Data (Email/Password only):", { email: values.email }); // Log only necessary data
    try {
      // Create user with email and password - No need for other fields here
      await createUserWithEmailAndPassword(auth, values.email, values.password);

      // --- Removed TODO for saving additional data ---

      toast({
        title: "Registro Exitoso!",
        description: "Redirigiendo a la página de bienvenida...",
      });
      // Add a slight delay for the toast message
      setTimeout(() => {
        router.push("/welcome");
      }, 1500);
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "El registro falló. Por favor, inténtalo de nuevo.";
      if (authError.code === "auth/email-already-in-use") {
        friendlyError = "Esta dirección de correo electrónico ya está en uso.";
      } else if (authError.code === "auth/weak-password") {
         // Although we have frontend validation, Firebase might still reject if rules are stricter
        friendlyError = "La contraseña es demasiado débil según las reglas del servidor.";
      } else if (authError.code === 'auth/invalid-email') {
        friendlyError = 'El formato del correo electrónico no es válido.';
      } else if (authError.code === 'auth/operation-not-allowed') {
        friendlyError = 'El inicio de sesión por correo electrónico/contraseña no está habilitado.';
      }
      console.error("Firebase Registration Error:", authError);
      setError(friendlyError);
      setIsLoading(false);
    }
    // Keep loading true until redirect or explicit stop on error
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl"> {/* Reduced max-width */}
        <CardHeader className="text-center relative pb-4 pt-8">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.push('/')}
             aria-label="Volver"
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary">Crear Cuenta</CardTitle>
          <CardDescription className="text-muted-foreground">Solo necesitas tu correo y una contraseña.</CardDescription> {/* Simplified description */}
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                 <Alert variant="destructive" className="mb-4">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Error de Registro</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
              )}

              {/* Email */}
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

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Crea una contraseña segura"
                        {...field}
                        disabled={isLoading}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.password}
                        className="h-11"
                       />
                    </FormControl>
                    {/* Clarify password requirements */}
                    <FormDescription className="text-xs pt-1">
                       Mínimo 8 caracteres, 1 mayúscula, 1 caracter especial (!@#...).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
               <FormField
                 control={form.control}
                 name="confirmPassword"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Confirmar Contraseña</FormLabel>
                     <FormControl>
                       <Input
                         type="password"
                         placeholder="Vuelve a escribir tu contraseña"
                         {...field}
                         disabled={isLoading}
                         aria-required="true"
                         aria-invalid={!!form.formState.errors.confirmPassword}
                         className="h-11"
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

              {/* Removed Full Name, Address, Phone, Gender, DOB Fields */}


              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6"
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrarme"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
           <p>¿Ya tienes cuenta?{' '}
             <Link href="/login" className="text-accent hover:text-accent/90 font-medium underline">
               Inicia sesión aquí
             </Link>
           </p>
         </CardFooter>
      </Card>
    </main>
  );
};

export default RegisterPage;
