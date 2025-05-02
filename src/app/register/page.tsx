
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
import { format } from "date-fns";
import { es } from 'date-fns/locale'; // Import Spanish locale
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Terminal, ArrowLeft, CalendarIcon } from "lucide-react"; // Import ArrowLeft & CalendarIcon
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  phoneNumber: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, { message: "Número de teléfono inválido." }),
  gender: z.enum(["masculino", "femenino", "otro"], {
    required_error: "Por favor selecciona un género.",
  }),
  dob: z.date({
    required_error: "Por favor selecciona tu fecha de nacimiento.",
  }),
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
      fullName: "",
      email: "",
      password: "",
      address: "",
      phoneNumber: "",
      // gender: undefined, // Let zod handle required error
      // dob: undefined, // Let zod handle required error
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setError(null);
    console.log("Registration Data:", values); // Log all form data
    try {
      // Create user with email and password
      await createUserWithEmailAndPassword(auth, values.email, values.password);

      // --- TODO: Save additional user data (values.fullName, values.address, etc.) ---
      // This typically involves:
      // 1. Getting the user ID (userCredential.user.uid)
      // 2. Setting up Firestore (if not already done)
      // 3. Creating a user profile document in Firestore with the additional data
      // Example (needs Firestore setup):
      // const user = userCredential.user;
      // const userRef = doc(db, "users", user.uid); // Assuming 'db' is your Firestore instance
      // await setDoc(userRef, {
      //   fullName: values.fullName,
      //   address: values.address,
      //   phoneNumber: values.phoneNumber,
      //   gender: values.gender,
      //   dob: values.dob,
      //   email: values.email, // Store email too if needed
      // });
      // --- End TODO ---


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
        friendlyError = "La contraseña es demasiado débil. Por favor, elige una contraseña más segura.";
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
      <Card className="w-full max-w-lg shadow-lg"> {/* Increased max-w */}
        <CardHeader className="text-center relative">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-4 text-muted-foreground hover:text-primary"
             onClick={() => router.push('/')}
             aria-label="Volver"
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary pt-2">Regístrate</CardTitle>
          <CardDescription>Crea tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> {/* Reduced space-y */}
              {error && (
                 <Alert variant="destructive">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Error de Registro</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
              )}

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Pérez"
                        {...field}
                        disabled={isLoading}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.fullName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.password}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               {/* Address */}
               <FormField
                 control={form.control}
                 name="address"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Dirección</FormLabel>
                     <FormControl>
                       <Input
                         placeholder="Calle Falsa 123, Ciudad"
                         {...field}
                         disabled={isLoading}
                         aria-required="true"
                         aria-invalid={!!form.formState.errors.address}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               {/* Phone Number */}
               <FormField
                 control={form.control}
                 name="phoneNumber"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Número de Teléfono</FormLabel>
                     <FormControl>
                       <Input
                         type="tel"
                         placeholder="+56 9 1234 5678"
                         {...field}
                         disabled={isLoading}
                         aria-required="true"
                         aria-invalid={!!form.formState.errors.phoneNumber}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Género</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          disabled={isLoading}
                           aria-required="true"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="masculino" />
                            </FormControl>
                            <FormLabel className="font-normal">Masculino</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="femenino" />
                            </FormControl>
                            <FormLabel className="font-normal">Femenino</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="otro" />
                            </FormControl>
                            <FormLabel className="font-normal">Otro</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoading}
                              aria-required="true"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es }) // Use Spanish locale
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={es} // Use Spanish locale in Calendar
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4" // Added margin top
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrarme"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pb-6">
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

    