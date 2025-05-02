
"use client";

import type { FC, ChangeEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "@firebase/storage"; // Import Storage functions
import { auth, db, storage } from "@/lib/firebase/client"; // Import storage
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarIcon, Save, Camera, Trash2, Loader2 } from "lucide-react"; // Added Camera, Trash2, Loader2
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
  // photoURL is not part of the form schema, handled separately
});

type FormData = z.infer<typeof formSchema>;

const EditProfilePage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); // Separate loading state for initial data fetch
  const [isUploading, setIsUploading] = useState(false); // State for image upload loading
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For image preview

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
        setPreviewUrl(currentUser.photoURL); // Initialize preview with existing photoURL
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

   // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit file size (e.g., 2MB)
        toast({
          variant: "destructive",
          title: "Archivo Demasiado Grande",
          description: "Por favor selecciona una imagen de menos de 2MB.",
        });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Archivo Inválido",
          description: "Por favor selecciona un archivo de imagen (jpg, png, gif, etc.).",
        });
        return;
      }
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.trigger(); // Trigger validation to enable save button if other fields are valid
    }
  };

  // Trigger hidden file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

   // Remove selected/current image
   const handleRemoveImage = () => {
       setSelectedFile(null);
       setPreviewUrl(null); // Clear preview
       form.trigger();
       // Note: This only removes the preview/selection.
       // Actual removal from storage/auth happens on save if needed (or implement separately).
       // For now, saving with no previewUrl will update the profile photoURL to null/empty.
   };


  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setIsUploading(false); // Reset upload status

    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no autenticado." });
        setIsLoading(false);
        return;
    }

    console.log("Updating profile data:", values);
    let photoDownloadURL = user.photoURL; // Start with existing URL

    // --- Upload Image if selected ---
    if (selectedFile) {
      setIsUploading(true);
      const imageRef = storageRef(storage, `profilePictures/${user.uid}/${selectedFile.name}`);
      try {
        await uploadBytes(imageRef, selectedFile);
        photoDownloadURL = await getDownloadURL(imageRef);
        console.log("Image uploaded successfully:", photoDownloadURL);
        toast({ title: "Imagen Cargada", description: "La nueva imagen de perfil se ha cargado." });
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({
          variant: "destructive",
          title: "Error al Cargar Imagen",
          description: "No se pudo guardar la imagen. La información del perfil se guardará sin la nueva imagen.",
        });
        // Continue saving other data even if image upload fails, but don't update photoURL
        photoDownloadURL = user.photoURL; // Revert to existing URL
      } finally {
        setIsUploading(false);
      }
    } else if (previewUrl === null && user.photoURL !== null) {
        // Handle case where user explicitly removed the image
        photoDownloadURL = null; // Set to null to remove the photoURL
        console.log("Removing profile picture.");
    }
    // --- End Image Upload ---


    try {
      // --- Update Firestore ---
      const userDocRef = doc(db, "users", user.uid);
      const profileDataToUpdate = {
        fullName: values.fullName,
        address: values.address,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        dob: Timestamp.fromDate(values.dob), // Convert date to timestamp
        photoURL: photoDownloadURL, // Save the new or existing URL (or null if removed)
        lastUpdatedAt: Timestamp.now(),
      };

      await setDoc(userDocRef, profileDataToUpdate, { merge: true });
      console.log("Profile data upserted successfully for user:", user.uid);
      // --- End Firestore Update ---

      // --- Update Firebase Auth Profile ---
      // Update display name and photo URL in Firebase Auth profile
      await updateProfile(user, {
          displayName: values.fullName, // Update display name as well
          photoURL: photoDownloadURL,
      });
       console.log("Firebase Auth profile updated.");
      // --- End Firebase Auth Profile Update ---


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

  // Get initials for Avatar Fallback
  const getInitials = (name?: string | null): string => {
      if (!name) return "?";
      const names = name.trim().split(' ');
      if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
      return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
  };

  if (isDataLoading) {
     return (
      <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
         <Card className="w-full max-w-md shadow-lg border-none rounded-xl">
           <CardHeader className="text-center relative pb-4 pt-8 items-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
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
        <CardHeader className="text-center relative pb-4 pt-8 items-center">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.back()} // Go back to previous page (profile view)
             aria-label="Volver al Perfil"
             type="button"
             disabled={isLoading}
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>

           {/* Avatar Upload */}
           <div className="relative group mb-4">
                <Avatar className="w-24 h-24 border-2 border-primary cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={previewUrl || undefined} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                        {/* Show initials based on form value or user's name */}
                        {getInitials(form.getValues('fullName') || user?.displayName || user?.email)}
                    </AvatarFallback>
                </Avatar>
                 {/* Edit Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer" onClick={handleAvatarClick}>
                   <Camera className="h-6 w-6 text-white" />
                </div>
                 {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*" // Accept only image files
                    className="hidden"
                    disabled={isLoading || isUploading}
                 />
                  {/* Remove Image Button (only show if there's an image) */}
                 {previewUrl && (
                     <Button
                         type="button"
                         variant="destructive"
                         size="icon"
                         className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md"
                         onClick={handleRemoveImage}
                         disabled={isLoading || isUploading}
                         aria-label="Eliminar imagen"
                     >
                         <Trash2 className="h-4 w-4" />
                     </Button>
                  )}
                 {/* Uploading Indicator */}
                 {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                 )}
           </div>


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
                        disabled={isLoading || isUploading}
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
                        disabled={isLoading || isUploading}
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
                        disabled={isLoading || isUploading}
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
                     <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploading}>
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
                             disabled={isLoading || isUploading}
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
                             date > new Date() || date < new Date("1900-01-01") || isLoading || isUploading
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
                disabled={
                    isLoading ||
                    isUploading ||
                    (!form.formState.isDirty && !selectedFile && previewUrl === user?.photoURL) || // Disable if nothing changed (form data, file selection, image removal)
                    !form.formState.isValid // Disable if form is invalid
                 }
              >
                 {isLoading || isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Save className="mr-2 h-4 w-4" />
                 )}
                {isLoading ? "Guardando..." : isUploading ? "Cargando Imagen..." : "Guardar Cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
           <Link href="/profile" className={cn("text-accent hover:text-accent/90 font-medium underline", (isLoading || isUploading) && "pointer-events-none opacity-50")}>
             Cancelar y Volver al Perfil
           </Link>
         </CardFooter>
      </Card>
    </main>
  );
};

export default EditProfilePage;
