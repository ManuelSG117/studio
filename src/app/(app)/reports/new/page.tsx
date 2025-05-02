
"use client";

import type { FC, ChangeEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore"; // Use collection and addDoc for new documents
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "@firebase/storage";
import imageCompression from 'browser-image-compression'; // Import compression library
import { auth, db, storage } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Correctly import FormDescription
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Loader2, Upload, Image as ImageIcon, Trash2 } from "lucide-react"; // Use Send for submit, Upload/ImageIcon for media
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Import Image

// Define the form schema for a new report
const reportFormSchema = z.object({
  reportType: z.enum(['incidente', 'funcionario'], {
    required_error: "Selecciona el tipo de reporte.",
  }),
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }).max(100, { message: "El título no puede exceder los 100 caracteres."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(1000, { message: "La descripción no puede exceder los 1000 caracteres."}),
  location: z.string().min(3, { message: "La ubicación es requerida." }).max(150, { message: "La ubicación no puede exceder los 150 caracteres."}),
  // mediaFile is handled separately, not part of Zod schema for direct form values
});

type ReportFormData = z.infer<typeof reportFormSchema>;

const NewReportPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // For overall form submission
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // For media upload specifically
  const [isCompressing, setIsCompressing] = useState(false); // For media compression
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Holds the compressed file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Preview for image/video

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: undefined,
      title: "",
      description: "",
      location: "",
    },
  });

  // Authentication check
  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle file selection and COMPRESSION
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation (type - image or video for now)
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        variant: "destructive",
        title: "Archivo Inválido",
        description: "Por favor selecciona un archivo de imagen o video.",
      });
      return;
    }

    setIsCompressing(true);
    setPreviewUrl(null);
    setSelectedFile(null);

    // Compression options (adjust as needed, especially for video)
    // For videos, compression might be more complex or skipped depending on requirements
    const options = {
        maxSizeMB: file.type.startsWith("image/") ? 2 : 10, // Allow larger size for video, compress images more
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7,
    }

    try {
        let processedFile = file; // Start with the original file

        if (file.type.startsWith("image/")) { // Only compress images for now
             console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
             processedFile = await imageCompression(file, options);
             console.log(`Compressed image size: ${(processedFile.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`Video file size: ${(file.size / 1024 / 1024).toFixed(2)} MB (compression skipped)`);
            // TODO: Consider video compression library if needed
            if (file.size > options.maxSizeMB * 1024 * 1024) {
                toast({
                    variant: "warning",
                    title: "Archivo Grande",
                    description: `El video es mayor a ${options.maxSizeMB}MB y podría tardar en subirse.`,
                });
            }
        }


        setSelectedFile(processedFile);

        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(processedFile);

        toast({
            title: "Archivo Listo",
            description: `Archivo "${processedFile.name}" seleccionado.`,
        });

    } catch (error) {
        console.error('Error processing file:', error);
        toast({
            variant: "destructive",
            title: "Error de Procesamiento",
            description: "No se pudo procesar el archivo. Intenta con otro.",
        });
    } finally {
        setIsCompressing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset input
        }
    }
  };

  // Trigger hidden file input click
  const handleUploadClick = () => {
    if (!isCompressing && !isUploading && !isLoading) {
        fileInputRef.current?.click();
    }
  };

   // Remove selected file
   const handleRemoveFile = () => {
       if (isCompressing || isUploading || isLoading) return;
       setSelectedFile(null);
       setPreviewUrl(null);
   };

  // Form submission handler
  const onSubmit = async (values: ReportFormData) => {
    setIsLoading(true);
    setIsUploading(false);

    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no autenticado." });
        setIsLoading(false);
        return;
    }

    console.log("Submitting report data:", values);
    let mediaDownloadURL: string | null = null;

    // 1. Upload Media if selected
    if (selectedFile) {
      setIsUploading(true);
      // Generate a unique file name using timestamp and user ID
      const fileName = `${user.uid}_${Date.now()}_${selectedFile.name}`;
      const mediaRef = storageRef(storage, `reportMedia/${fileName}`);
      try {
        await uploadBytes(mediaRef, selectedFile);
        mediaDownloadURL = await getDownloadURL(mediaRef);
        console.log("Media uploaded successfully:", mediaDownloadURL);
        toast({ title: "Archivo Subido", description: "La evidencia multimedia se ha guardado." });
      } catch (uploadError) {
        console.error("Error uploading media:", uploadError);
        toast({
          variant: "destructive",
          title: "Error al Subir Archivo",
          description: "No se pudo guardar la evidencia. El reporte se guardará sin ella.",
        });
        // Proceed without media URL
      } finally {
        setIsUploading(false);
      }
    }

    // 2. Save Report Data to Firestore
    try {
      const reportsCollectionRef = collection(db, "reports"); // Reference to the 'reports' collection
      const reportData = {
        userId: user.uid, // Store the reporter's user ID
        userEmail: user.email, // Optionally store email for quick reference
        reportType: values.reportType,
        title: values.title,
        description: values.description,
        location: values.location,
        mediaUrl: mediaDownloadURL, // Store the URL if upload was successful
        status: 'Pendiente', // Initial status
        createdAt: Timestamp.now(),
        // TODO: Add latitude/longitude if implementing map selection later
        // latitude: ...,
        // longitude: ...,
      };

      const docRef = await addDoc(reportsCollectionRef, reportData); // Add new document
      console.log("Report submitted successfully with ID:", docRef.id);

      toast({
        title: "Reporte Enviado",
        description: "Tu reporte ha sido registrado exitosamente.",
      });
      router.push("/welcome"); // Redirect to reports list on success
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar Reporte",
        description: "No se pudo registrar el reporte. Inténtalo de nuevo.",
      });
      setIsLoading(false); // Only set loading false on final error
    }
    // Keep isLoading true until redirect or final error
  };

   // Loading state skeleton
   if (isAuthLoading) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
           <Card className="w-full max-w-lg shadow-lg border-none rounded-xl">
             <CardHeader className="text-center relative pb-4 pt-8 items-center">
                  <Skeleton className="h-8 w-2/3 mx-auto mb-2" />
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
           </Card>
         </main>
      );
    }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
      <Card className="w-full max-w-lg shadow-lg border-none rounded-xl">
        <CardHeader className="text-center relative pb-4 pt-8">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.back()} // Go back to previous page
             aria-label="Volver"
             type="button"
             disabled={isLoading || isUploading || isCompressing}
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary">Crear Nuevo Reporte</CardTitle>
          <CardDescription className="text-muted-foreground">Describe el incidente o la conducta del funcionario.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

               {/* Report Type */}
               <FormField
                 control={form.control}
                 name="reportType"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Tipo de Reporte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploading || isCompressing}>
                       <FormControl>
                         <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecciona incidente o funcionario" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="incidente">Incidente (Robo, Vandalismo, etc.)</SelectItem>
                         <SelectItem value="funcionario">Funcionario (Corrupción, Abuso, etc.)</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Reporte</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Robo en Calle Principal"
                        {...field}
                        disabled={isLoading || isUploading || isCompressing}
                        aria-required="true"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Detallada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe lo sucedido con la mayor cantidad de detalles posible..."
                        {...field}
                        disabled={isLoading || isUploading || isCompressing}
                        aria-required="true"
                        className="min-h-[120px]" // Increase default height for description
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Esquina de Av. Juárez y Calle Madero, Col. Centro"
                        {...field}
                        disabled={isLoading || isUploading || isCompressing}
                        aria-required="true"
                        className="h-11"
                      />
                      {/* TODO: Add map interaction button later? */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               {/* Media Upload Section */}
               <FormItem>
                    <FormLabel>Evidencia Multimedia (Opcional)</FormLabel>
                    <FormControl>
                       <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadClick}
                            disabled={isLoading || isUploading || isCompressing}
                            className="h-11"
                          >
                             {isCompressing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                             {isCompressing ? "Procesando..." : selectedFile ? "Cambiar Archivo" : "Subir Imagen/Video"}
                          </Button>
                           {previewUrl && (
                                <div className="flex items-center space-x-2">
                                   {selectedFile?.type.startsWith('image/') ? (
                                       <Image src={previewUrl} alt="Preview" width={40} height={40} className="rounded object-cover aspect-square" data-ai-hint="media preview"/>
                                   ) : (
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                            <ImageIcon className="h-5 w-5 text-muted-foreground" /> {/* Placeholder for video */}
                                        </div>
                                   )}
                                   <Button
                                       type="button"
                                       variant="ghost"
                                       size="icon"
                                       className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                       onClick={handleRemoveFile}
                                       disabled={isLoading || isUploading || isCompressing}
                                       aria-label="Eliminar archivo"
                                   >
                                       <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                           )}
                       </div>
                    </FormControl>
                     <FormDescription className="text-xs">
                         Puedes adjuntar una imagen (jpg, png, gif) o video (mp4, webm) como evidencia. Máx 2MB para imágenes, 10MB para videos.
                     </FormDescription>
                     <FormMessage /> {/* For file-related errors if needed */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*" // Accept images and videos
                        className="hidden"
                        disabled={isLoading || isUploading || isCompressing}
                     />
                     {/* Upload Progress Indicator */}
                     {isUploading && (
                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo archivo...
                        </div>
                     )}
               </FormItem>


              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-full text-base font-medium mt-8" // Increased margin-top
                disabled={
                    isLoading ||
                    isUploading ||
                    isCompressing ||
                    !form.formState.isValid
                 }
              >
                 {isLoading || isUploading || isCompressing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Send className="mr-2 h-4 w-4" />
                 )}
                {isLoading ? "Enviando..." : isUploading ? "Subiendo..." : isCompressing ? "Procesando..." : "Enviar Reporte"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
};

export default NewReportPage;
     
    
