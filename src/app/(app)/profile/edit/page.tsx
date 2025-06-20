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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "@firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import imageCompression from 'browser-image-compression'; // Import compression library
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
import { ArrowLeft, CalendarIcon, Save, Camera, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserProfileData, type UserProfile } from "@/app/(app)/profile/page";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";

// Schema remains the same
const formSchema = z.object({
  fullName: z.string().min(1, { message: "El nombre completo es requerido." }),
  address: z.string().min(1, { message: "La dirección es requerida." }),
  phoneNumber: z.string().min(1, { message: "El número de teléfono es requerido." }),
  gender: z.enum(['masculino', 'femenino', 'otro'], { required_error: "Selecciona un género." }),
  dob: z.date({ required_error: "La fecha de nacimiento es requerida." }),
  email: z.string().email().readonly(),
});

type FormData = z.infer<typeof formSchema>;

const EditProfilePage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); // State for compression loading
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Will hold the compressed file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        fullName: "",
        address: "",
        phoneNumber: "",
        gender: undefined,
        dob: undefined,
        email: "",
    },
  });

  // Effect to handle authentication state changes and populate form data (remains the same)
  useEffect(() => {
    setIsDataLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setIsDataLoading(false);
      } else {
        setUser(currentUser);
        setPreviewUrl(currentUser.photoURL);
        try {
          const profileData = await getUserProfileData(currentUser.uid);
          form.reset({
            fullName: profileData?.fullName || "",
            address: profileData?.address || "",
            phoneNumber: profileData?.phoneNumber || "",
            gender: profileData?.gender || undefined,
            dob: profileData?.dob || undefined,
            email: currentUser.email || "",
          });
        } catch (error) {
        //  console.error("Error fetching/resetting profile data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar la información del perfil.",
          });
          form.reset({
              fullName: "",
              address: "",
              phoneNumber: "",
              gender: undefined,
              dob: undefined,
              email: currentUser.email || "",
          });
        } finally {
          setIsDataLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router, toast, form]);

   // Handle file selection and COMPRESSION
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Archivo Inválido",
        description: "Por favor selecciona un archivo de imagen (jpg, png, gif, etc.).",
      });
      return;
    }

    setIsCompressing(true);
    setPreviewUrl(null);
    setSelectedFile(null);

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        initialQuality: 0.7,
        fileType: 'image/webp', // Forzar conversión a webp
    }

    try {
    //    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const compressedFile = await imageCompression(file, options);
   //     console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        // Cambia la extensión a .webp
        const fileName = file.name.replace(/\.[^.]+$/, '.webp');
        // Guarda el nombre procesado para usarlo en el upload
        (compressedFile as any).customFileName = fileName;

        setSelectedFile(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

        form.trigger();

        toast({
            title: "Imagen Lista",
            description: `Imagen comprimida a ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB y convertida a webp.`,
        });

    } catch (error) {
   //     console.error('Error compressing image:', error);
        toast({
            variant: "destructive",
            title: "Error de Subida",
            description: "No se pudo procesar la imagen. Intenta con otra imagen.",
        });
        setPreviewUrl(user?.photoURL || null);
    } finally {
        setIsCompressing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  // Trigger hidden file input click
  const handleAvatarClick = () => {
    if (!isCompressing && !isUploading && !isLoading) { // Prevent clicking while busy
        fileInputRef.current?.click();
    }
  };

   // Remove selected/current image (remains the same)
   const handleRemoveImage = () => {
       if (isCompressing || isUploading || isLoading) return; // Prevent action while busy
       setSelectedFile(null);
       setPreviewUrl(null);
       form.trigger();
   };


  // onSubmit remains largely the same, but now uploads the compressed file if selectedFile is set
  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setIsUploading(false);

    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Usuario no autenticado." });
      setIsLoading(false);
      return;
    }

  //  console.log("Updating profile data:", values);
    let photoDownloadURL: string | null = user.photoURL;

    if (selectedFile) {
      setIsUploading(true);
      try {
        // Nombre fijo para la imagen de perfil del usuario
        const fileName = `profile/${user.uid}/avatar.webp`;

        // Primero intentamos eliminar el archivo existente (no importa si falla)
        try {
          await supabase.storage
            .from('profile')
            .remove([fileName]);
        } catch (error) {
      //    console.log("No existing file to delete or error deleting:", error);
        }

        // Subir la nueva imagen
        const { error: uploadError, data } = await supabase.storage
          .from('profile')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Obtener la URL pública usando el mismo nombre de archivo
        const { data: { publicUrl } } = supabase
          .storage
          .from('profile')
          .getPublicUrl(fileName);

        // Añadir timestamp para forzar actualización de caché
        photoDownloadURL = `${publicUrl}?t=${Date.now()}`;
        
    //    console.log("Image uploaded successfully to Supabase:", photoDownloadURL);
        toast({ title: "Imagen Actualizada", description: "La nueva imagen de perfil se ha guardado." });

      } catch (uploadError) {
     //   console.error("Error uploading image:", uploadError);
        toast({
          variant: "destructive",
          title: "Error al Cargar Imagen",
          description: "No se pudo guardar la imagen. La información del perfil se guardará sin la nueva imagen.",
        });
        photoDownloadURL = user.photoURL;
      } finally {
        setIsUploading(false);
      }
    } else if (previewUrl === null && user.photoURL !== null) {
      // Si se está eliminando la foto de perfil
      try {
        const fileName = `profile/${user.uid}/avatar.webp`;
        await supabase.storage
          .from('profile')
          .remove([fileName]);
        
        photoDownloadURL = null;
     //   console.log("Profile picture removed from storage");
      } catch (error) {
     //   console.error("Error removing profile picture:", error);
      }
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const profileDataToUpdate = {
        fullName: values.fullName,
        address: values.address,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        dob: Timestamp.fromDate(values.dob),
        photoURL: photoDownloadURL,
        lastUpdatedAt: Timestamp.now(),
      };

      await setDoc(userDocRef, profileDataToUpdate, { merge: true });
      //console.log("Profile data upserted successfully for user:", user.uid);

      await updateProfile(user, {
          displayName: values.fullName,
          photoURL: photoDownloadURL,
      });
      // console.log("Firebase Auth profile updated.");

      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada.",
      });
      router.push("/profile");
    } catch (error) {
   //   console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo guardar la información. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials for Avatar Fallback (remains the same)
  const getInitials = (name?: string | null): string => {
      if (!name) return "?";
      const names = name.trim().split(' ');
      if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
      return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
  };

  // Loading state skeleton (remains the same)
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
      <Card className="w-full max-w-6xl shadow-lg border-none rounded-xl">
        <CardHeader className="text-center relative pb-4 pt-8 items-center">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.back()}
             aria-label="Volver al Perfil"
             type="button"
             disabled={isLoading || isUploading || isCompressing} // Disable during compression
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>

           {/* Avatar Upload Section */}
           <div className="relative group mb-4">
                <Avatar
                  className={cn(
                    "w-28 h-28 border-2 border-primary",
                    (isLoading || isUploading || isCompressing) ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  )}
                  onClick={handleAvatarClick}
                >
                    <AvatarImage src={previewUrl || undefined} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                        {getInitials(form.getValues('fullName') || user?.displayName || user?.email)}
                    </AvatarFallback>
                </Avatar>
                 {/* Edit Icon Overlay */}
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        (isLoading || isUploading || isCompressing) ? "cursor-not-allowed" : "cursor-pointer"
                    )}
                    onClick={handleAvatarClick}
                 >
                   {!(isLoading || isUploading || isCompressing) && <Camera className="h-6 w-6 text-white" />}
                </div>
                 {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isLoading || isUploading || isCompressing} // Disable during compression
                 />
                  {/* Remove Image Button */}
                 {previewUrl && (
                     <Button
                         type="button"
                         variant="destructive"
                         size="icon"
                         className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md"
                         onClick={handleRemoveImage}
                         disabled={isLoading || isUploading || isCompressing} // Disable during compression
                         aria-label="Eliminar imagen"
                     >
                         <Trash2 className="h-4 w-4" />
                     </Button>
                  )}
                 {/* Loading Indicator (Uploading or Compressing) */}
                 {(isUploading || isCompressing) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                        <span className="sr-only">{isCompressing ? "Comprimiendo..." : "Cargando..."}</span>
                    </div>
                 )}
           </div>


          <CardTitle className="text-2xl font-bold text-primary">Editar Perfil</CardTitle>
          <CardDescription className="text-muted-foreground">Actualiza tu información personal.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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
                        value={field.value || ""}
                        readOnly
                        disabled
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
                        value={field.value || ""}
                        disabled={isLoading || isUploading || isCompressing} // Disable during compression
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
                        value={field.value || ""}
                        disabled={isLoading || isUploading || isCompressing} // Disable during compression
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
                        value={field.value || ""}
                        disabled={isLoading || isUploading || isCompressing} // Disable during compression
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
                     <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploading || isCompressing}> {/* Disable during compression */}
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
                             disabled={isLoading || isUploading || isCompressing} // Disable during compression
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
                             date > new Date() || date < new Date("1900-01-01") || isLoading || isUploading || isCompressing // Disable during compression
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

              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-6"
                disabled={
                    isLoading ||
                    isUploading ||
                    isCompressing || // Disable during compression
                    (!form.formState.isDirty && !selectedFile && previewUrl === user?.photoURL) ||
                    !form.formState.isValid
                 }
              >
                 {isLoading || isUploading || isCompressing ? ( // Check all loading states
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Save className="mr-2 h-4 w-4" />
                 )}
                {isLoading ? "Guardando..." : isUploading ? "Cargando..." : isCompressing ? "Procesando..." : "Guardar Cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center pt-2 pb-8">
           <Link href="/profile" className={cn("text-accent hover:text-accent/90 font-medium underline", (isLoading || isUploading || isCompressing) && "pointer-events-none opacity-50")}>
             Cancelar y Volver al Perfil
           </Link>
         </CardFooter>
      </Card>
    </main>
  );
};

export default EditProfilePage;
