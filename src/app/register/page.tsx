"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, type AuthError } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "@/lib/firebase/client"; // Import db
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Added FormDescription
// Removed unused imports for Select, Popover, Calendar, date-fns, es locale
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, X } from "lucide-react"; // Import Icons, Removed CalendarIcon
import { useToast } from "@/hooks/use-toast";

// Password validation criteria
const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

// Updated Schema: Only email and password fields
const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string()
    .min(MIN_LENGTH, { message: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.` })
    .regex(HAS_UPPERCASE, { message: "La contraseña debe contener al menos una letra mayúscula." })
    .regex(HAS_SPECIAL_CHAR, { message: "La contraseña debe contener al menos un caracter especial." }),
  confirmPassword: z.string().min(1, { message: "Por favor confirma tu contraseña." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Set the error path to the confirmPassword field
});


type FormData = z.infer<typeof formSchema>;

const RegisterPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change to update checklist
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "", // Added default value
    },
  });

  const passwordValue = form.watch("password"); // Watch password field changes

  // Password requirement state
  const [metMinLength, setMetMinLength] = useState(false);
  const [metUppercase, setMetUppercase] = useState(false);
  const [metSpecialChar, setMetSpecialChar] = useState(false);

  useEffect(() => {
    setMetMinLength(passwordValue.length >= MIN_LENGTH);
    setMetUppercase(HAS_UPPERCASE.test(passwordValue));
    setMetSpecialChar(HAS_SPECIAL_CHAR.test(passwordValue));
  }, [passwordValue]); // Re-run effect when passwordValue changes

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    console.log("Registration Data Submitted:", {email: values.email}); // Log only email submitted data
    try {
      // 1. Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      console.log("User created successfully:", user.uid);

      // 2. Prepare minimal profile data for Firestore (only email)
      // You might want to add a timestamp or other basic info here if needed
      const profileData = {
        email: values.email, // Store email in Firestore
        createdAt: Timestamp.now(), // Add creation timestamp
      };
      console.log("Profile data to save:", profileData);


      // 3. Save basic profile data to Firestore
      await setDoc(doc(db, "users", user.uid), profileData);
      console.log("Basic profile data saved to Firestore for user:", user.uid);

      toast({
        title: "Registro Exitoso!",
        description: "Redirigiendo a la página de bienvenida...",
      });
      // Add a slight delay for the toast message
      setTimeout(() => {
        // Redirect to profile edit page to complete profile
        router.push("/profile/edit");
      }, 1500);
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "El registro falló. Por favor, inténtalo de nuevo.";
       if (authError.code === "auth/email-already-in-use") {
           friendlyError = "Esta dirección de correo electrónico ya está en uso.";
       } else if (authError.code === "auth/weak-password") {
           friendlyError = "La contraseña es demasiado débil."; // Frontend validation should catch this, but added for safety
       } else if (authError.code === 'auth/invalid-email') {
           friendlyError = 'El formato del correo electrónico no es válido.';
       } else if (authError.code === 'auth/operation-not-allowed') {
           friendlyError = 'El inicio de sesión por correo electrónico/contraseña no está habilitado.';
       } else {
          // Handle Firestore errors potentially
          console.error("Firestore Save Error (or other):", err);
          friendlyError = "Hubo un problema al guardar tu información de perfil.";
       }

      console.error("Registration Error:", authError.code, authError.message, err); // Log the specific error

      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: friendlyError,
      });
      setIsLoading(false); // Stop loading on error
    }
    // Keep loading true until redirect or explicit stop on error
  };

    // Helper component for password requirements
    const RequirementItem: FC<{ met: boolean; text: string }> = ({ met, text }) => (
      <li className={cn(
        "flex items-center text-xs transition-colors duration-200",
        met ? "text-green-600 dark:text-green-400" : "text-muted-foreground" // Use green for met, muted otherwise
      )}>
        {met ? (
          <Check className="h-4 w-4 mr-1.5 flex-shrink-0" />
        ) : (
          <X className="h-4 w-4 mr-1.5 flex-shrink-0" /> // Show X if not met
        )}
        {text}
      </li>
    );

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
              type="button" // Ensure it doesn't submit the form
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary">Crear Cuenta</CardTitle>
          <CardDescription className="text-muted-foreground px-4">Únete a +Seguro para contribuir a un Uruapan más seguro</CardDescription> {/* Updated description */}
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

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
                     {/* Password Requirements Checklist */}
                     <ul className="space-y-1 mt-2 pl-1">
                        <RequirementItem met={metMinLength} text={`Mínimo ${MIN_LENGTH} caracteres`} />
                        <RequirementItem met={metUppercase} text="Al menos una letra mayúscula" />
                        <RequirementItem met={metSpecialChar} text="Al menos un caracter especial (!@#...)" />
                     </ul>
                    <FormMessage /> {/* Show validation errors from Zod */}
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

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6"
                disabled={isLoading || !form.formState.isValid} // Disable if form is invalid
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
