
"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserProfileData, type UserProfile } from "@/app/(app)/profile/page";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for the edit form (similar to registration, but password is not included)
const formSchema = z.object({
  fullName: z.string().min(1, { message: "El nombre completo es requerido." }),
  address: z.string().min(1, { message: "La dirección es requerida." }),
  phoneNumber: z.string().min(1, { message: "El número de teléfono es requerido." }),
  gender: z.enum(['masculino', 'femenino', 'otro'], { required_error: "Selecciona un género." }),
  dob: z.date({ required_error: "La fecha de nacimiento es requerida." }),
  email: z.string().email().readonly(), // Email is read-only
});

type FormData = z.infer<typeof formSchema>;

const EditProfilePage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); // Separate loading state for initial data fetch
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Use synchronous default values to prevent uncontrolled input errors
    defaultValues: {
        fullName: "",
        address: "",
        phoneNumber: "",
        gender: undefined, // Use undefined for Select placeholder
        dob: undefined,    // Use undefined for Calendar placeholder
        email: "",         // Initial email is empty, will be set by useEffect
    },
  });

  // Effect to handle authentication state changes and populate form data
  useEffect(() => {
    setIsDataLoading(true); // Set loading true initially
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login"); // Redirect if not logged in
        setIsDataLoading(false); // Stop loading if redirecting
      } else {
        setUser(currentUser);
        // Fetch profile data and reset the form once authenticated
        try {
          const profileData = await getUserProfileData(currentUser.uid);
          // Reset the form with fetched data or defaults
          form.reset({
            fullName: profileData?.fullName || "",
            address: profileData?.address || "",
            phoneNumber: profileData?.phoneNumber || "",
            gender: profileData?.gender || undefined, // Use undefined for Select placeholder if no data
            dob: profileData?.dob || undefined, // Use undefined for Calendar placeholder if no data
            email: currentUser.email || "", // Set email from auth
          });
        } catch (error) {
          console.error("Error fetching/resetting profile data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar la información del perfil.",
          });
          // Reset with defaults + email from auth on error.
          form.reset({
              fullName: "",
              address: "",
              phoneNumber: "",
              gender: undefined,
              dob: undefined,
              email: currentUser.email || "",
          });
        } finally {
          setIsDataLoading(false); // Stop loading after successful reset or error handling
        }
      }
    });
    return () => unsubscribe();
    // Dependencies: Re-run when auth state changes or router/toast instances change.
    // form.reset is stable and doesn't need to be a dependency.
  }, [router, toast, form]); // Include form in dependencies as we call form.reset

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no autenticado." });
        setIsLoading(false);
        return;
    }

    console.log("Updating profile data:", values);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const profileDataToUpdate = {
        fullName: values.fullName,
        address: values.address,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        dob: Timestamp.fromDate(values.dob), // Convert date to timestamp
        // Email is read-only and stored during registration, not updated here
        lastUpdatedAt: Timestamp.now(),
      };

      // Use setDoc with merge: true to create or update the document
      await setDoc(userDocRef, profileDataToUpdate, { merge: true });
      console.log("Profile data upserted successfully for user:", user.uid);

      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada.",
      });
      router.push("/profile"); // Redirect back to profile view page
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo guardar la información. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
     return (
      <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
         <Card className="w-full max-w-md shadow-lg border-none rounded-xl">
           <CardHeader className="text-center relative pb-4 pt-8">
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
           </CardHeader>
           <CardContent className="px-6 sm:px-8 pt-2 pb-6 space-y-5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                       <Skeleton className="h-4 w-1/4" />
                       <Skeleton className="h-11 w-full" />
                    </div>
                ))}
                <Skeleton className="h-12 w-full rounded-full mt-6" />
            </CardContent>
            <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
                 <Skeleton className="h-4 w-1/3" />
            </CardFooter>
         </Card>
       </main>
     );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg border-none rounded-xl">
        <CardHeader className="text-center relative pb-4 pt-8">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.back()} // Go back to previous page (profile view)
             aria-label="Volver al Perfil"
             type="button"
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary">Editar Perfil</CardTitle>
          <CardDescription className="text-muted-foreground">Actualiza tu información personal.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Email (Read-only) */}
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu correo electrónico"
                        {...field}
                        value={field.value || ""} // Ensure value is always a string
                        readOnly // Make input read-only
                        disabled // Visually indicate it's disabled
                        className="h-11 bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre completo"
                        {...field}
                        value={field.value || ""} // Ensure value is always a string
                        disabled={isLoading}
                        aria-required="true"
                        className="h-11"
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
                        placeholder="Tu dirección"
                        {...field}
                        value={field.value || ""} // Ensure value is always a string
                        disabled={isLoading}
                        aria-required="true"
                        className="h-11"
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
                        placeholder="Ej: +56 9 1234 5678"
                        {...field}
                        value={field.value || ""} // Ensure value is always a string
                        disabled={isLoading}
                        aria-required="true"
                        className="h-11"
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
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                     {/* Ensure value is passed to Select */}
                     <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                           <SelectValue placeholder="Selecciona tu género" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
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
                               "w-full pl-3 text-left font-normal h-11",
                               !field.value && "text-muted-foreground"
                             )}
                             disabled={isLoading}
                           >
                             {field.value ? (
                               format(field.value, "PPP", { locale: es })
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
                           locale={es}
                         />
                       </PopoverContent>
                     </Popover>
                     <FormMessage />
                   </FormItem>
                 )}
               />

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6"
                disabled={isLoading || !form.formState.isDirty || !form.formState.isValid } // Disable if loading, not dirty, or invalid
              >
                 <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
           <Link href="/profile" className="text-accent hover:text-accent/90 font-medium underline">
             Cancelar y Volver al Perfil
           </Link>
         </CardFooter>
      </Card>
    </main>
  );
};

export default EditProfilePage;
