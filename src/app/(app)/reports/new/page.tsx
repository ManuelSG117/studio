
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Loader2, Upload, Image as ImageIcon, Trash2, UserCog, TriangleAlert, LocateFixed } from "lucide-react"; // Use Send for submit, Upload/ImageIcon for media, UserCog, TriangleAlert, LocateFixed
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Import Image

// Define the report type enum
type ReportType = 'incidente' | 'funcionario';

// Define the form schema WITHOUT reportType
const reportFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }).max(100, { message: "El título no puede exceder los 100 caracteres."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(1000, { message: "La descripción no puede exceder los 1000 caracteres."}),
  location: z.string().min(3, { message: "La ubicación es requerida." }).max(150, { message: "La ubicación no puede exceder los 150 caracteres."}),
  // Optional latitude and longitude fields (will be set by location button)
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // mediaFile is handled separately
});

type ReportFormData = z.infer<typeof reportFormSchema>;

const NewReportPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // For overall form submission
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // For media upload specifically
  const [isCompressing, setIsCompressing] = useState(false); // For media compression
  const [isFetchingLocation, setIsFetchingLocation] = useState(false); // For location fetching
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Holds the compressed file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Preview for image/video
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null); // State for visual selection

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      // reportType removed from defaultValues
      title: "",
      description: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
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

    const options = {
        maxSizeMB: file.type.startsWith("image/") ? 2 : 10,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7,
    }

    try {
        let processedFile = file;

        if (file.type.startsWith("image/")) {
             console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
             processedFile = await imageCompression(file, options);
             console.log(`Compressed image size: ${(processedFile.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`Video file size: ${(file.size / 1024 / 1024).toFixed(2)} MB (compression skipped)`);
            if (file.size > options.maxSizeMB * 1024 * 1024) {
                toast({
                    variant: "warning",
                    title: "Archivo Grande",
                    description: `El video es mayor a ${options.maxSizeMB}MB y podría tardar en subirse.`,
                });
            }
        }

        setSelectedFile(processedFile);

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
            fileInputRef.current.value = "";
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

   // Get Current Location Handler
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({
                variant: "destructive",
                title: "Geolocalización no soportada",
                description: "Tu navegador no soporta la geolocalización.",
            });
            return;
        }

        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationString = `Ubicación actual (Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)})`;
                // Ideally, use reverse geocoding here to get a street address
                form.setValue("location", locationString, { shouldValidate: true });
                form.setValue("latitude", latitude);
                form.setValue("longitude", longitude);
                toast({
                    title: "Ubicación obtenida",
                    description: "Se ha establecido tu ubicación actual.",
                });
                setIsFetchingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let description = "No se pudo obtener tu ubicación.";
                if (error.code === error.PERMISSION_DENIED) {
                    description = "Permiso de ubicación denegado.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    description = "La información de ubicación no está disponible.";
                } else if (error.code === error.TIMEOUT) {
                    description = "Se agotó el tiempo de espera para obtener la ubicación.";
                }
                toast({
                    variant: "destructive",
                    title: "Error de Ubicación",
                    description: description,
                });
                setIsFetchingLocation(false);
            },
            {
                enableHighAccuracy: true, // Request high accuracy
                timeout: 10000, // 10 seconds timeout
                maximumAge: 0 // Don't use cached location
            }
        );
    };


  // Form submission handler
  const onSubmit = async (values: ReportFormData) => {
    // Check if report type is selected
    if (!selectedReportType) {
        toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un tipo de reporte." });
        return;
    }

    setIsLoading(true);
    setIsUploading(false);

    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no autenticado." });
        setIsLoading(false);
        return;
    }

    console.log("Submitting report data:", { ...values, reportType: selectedReportType });
    let mediaDownloadURL: string | null = null;

    // 1. Upload Media if selected
    if (selectedFile) {
      setIsUploading(true);
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
      } finally {
        setIsUploading(false);
      }
    }

    // 2. Save Report Data to Firestore
    try {
      const reportsCollectionRef = collection(db, "reports");
      const reportData = {
        userId: user.uid,
        userEmail: user.email,
        reportType: selectedReportType, // Use state variable
        title: values.title,
        description: values.description,
        location: values.location,
        mediaUrl: mediaDownloadURL,
        latitude: values.latitude ?? null, // Save coordinates if available
        longitude: values.longitude ?? null,
        status: 'Pendiente',
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(reportsCollectionRef, reportData);
      console.log("Report submitted successfully with ID:", docRef.id);

      toast({
        title: "Reporte Enviado",
        description: "Tu reporte ha sido registrado exitosamente.",
      });
      router.push("/welcome");
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar Reporte",
        description: "No se pudo registrar el reporte. Inténtalo de nuevo.",
      });
      setIsLoading(false);
    }
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

    const disableForm = isLoading || isUploading || isCompressing || isFetchingLocation;


  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
      <Card className="w-full max-w-lg shadow-lg border-none rounded-xl bg-card">
        <CardHeader className="text-center relative pb-4 pt-8">
           <Button
             variant="ghost"
             size="icon"
             className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
             onClick={() => router.back()}
             aria-label="Volver"
             type="button"
             disabled={disableForm}
           >
             <ArrowLeft className="h-5 w-5" />
           </Button>
          <CardTitle className="text-2xl font-bold text-primary">Crear Nuevo Reporte</CardTitle>
          <CardDescription className="text-muted-foreground">Selecciona el tipo y describe el incidente.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pt-2 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

               {/* Report Type Selection Cards */}
               <FormItem>
                   <FormLabel className="text-base font-medium text-foreground">Tipo de Reporte</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {/* Funcionario Card */}
                        <Card
                             className={cn(
                                "cursor-pointer border-2 p-4 flex flex-col items-center justify-between transition-all hover:shadow-md",
                                selectedReportType === 'funcionario' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50',
                                disableForm ? 'opacity-60 cursor-not-allowed' : ''
                             )}
                             onClick={() => !disableForm && setSelectedReportType('funcionario')}
                        >
                            <CardHeader className="p-0 items-center text-center space-y-2">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-3">
                                    <UserCog className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle className="text-lg text-primary">Funcionario Público</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground px-2">
                                     Reporta malas prácticas, corrupción o abuso por parte de un funcionario público.
                                </CardDescription>
                            </CardHeader>
                            <Button
                                type="button"
                                variant={selectedReportType === 'funcionario' ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    "w-full mt-4",
                                    selectedReportType === 'funcionario' ? 'bg-primary text-primary-foreground' : 'border-primary text-primary hover:bg-primary/10'
                                )}
                                disabled={disableForm}
                                onClick={(e) => { e.stopPropagation(); !disableForm && setSelectedReportType('funcionario'); }}
                            >
                                Seleccionar
                            </Button>
                        </Card>

                        {/* Incidente Card */}
                         <Card
                            className={cn(
                                "cursor-pointer border-2 p-4 flex flex-col items-center justify-between transition-all hover:shadow-md",
                                selectedReportType === 'incidente' ? 'border-destructive bg-destructive/5' : 'border-border bg-card hover:border-destructive/50',
                                disableForm ? 'opacity-60 cursor-not-allowed' : ''
                             )}
                             onClick={() => !disableForm && setSelectedReportType('incidente')}
                         >
                             <CardHeader className="p-0 items-center text-center space-y-2">
                                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-3">
                                     <TriangleAlert className="h-8 w-8 text-destructive" />
                                 </div>
                                <CardTitle className="text-lg text-destructive">Delito / Incidente</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground px-2">
                                     Reporta robos, asaltos, extorsiones u otros delitos que hayas presenciado.
                                </CardDescription>
                             </CardHeader>
                            <Button
                                type="button"
                                variant={selectedReportType === 'incidente' ? 'destructive' : 'outline'}
                                size="sm"
                                className={cn(
                                    "w-full mt-4",
                                    selectedReportType === 'incidente' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'border-destructive text-destructive hover:bg-destructive/10'
                                )}
                                disabled={disableForm}
                                onClick={(e) => { e.stopPropagation(); !disableForm && setSelectedReportType('incidente'); }}
                            >
                                Seleccionar
                            </Button>
                        </Card>
                    </div>
                     {/* Hidden Form Field for validation trigger if needed, or rely on button check */}
                     {!selectedReportType && form.formState.isSubmitted && (
                        <p className="text-sm font-medium text-destructive mt-2">Por favor, selecciona un tipo de reporte.</p>
                    )}
               </FormItem>

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
                        disabled={disableForm}
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
                        disabled={disableForm}
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
                     <div className="flex items-center space-x-2">
                         <FormControl>
                           <Input
                             placeholder="Ej: Esquina de Av. Juárez y Calle Madero, Col. Centro"
                             {...field}
                             disabled={disableForm}
                             aria-required="true"
                             className="h-11 flex-grow"
                             />
                         </FormControl>
                         {/* Use Current Location Button */}
                         <Button
                             type="button"
                             variant="outline"
                             size="icon"
                             onClick={handleGetCurrentLocation}
                             disabled={disableForm}
                             aria-label="Usar ubicación actual (si estás en el lugar del incidente)"
                             className="h-11 w-11 flex-shrink-0 border-primary text-primary hover:bg-primary/10"
                             title="Usar mi ubicación actual (solo si estás en el lugar del incidente)"
                         >
                             {isFetchingLocation ? (
                                 <Loader2 className="h-5 w-5 animate-spin" />
                             ) : (
                                 <LocateFixed className="h-5 w-5" />
                             )}
                         </Button>
                     </div>
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
                            disabled={disableForm}
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
                                       disabled={disableForm}
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
                        disabled={disableForm}
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
                    disableForm ||
                    !form.formState.isValid ||
                    !selectedReportType // Also disable if report type not selected
                 }
              >
                 {isLoading || isUploading || isCompressing || isFetchingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Send className="mr-2 h-4 w-4" />
                 )}
                {isLoading ? "Enviando..." : isUploading ? "Subiendo..." : isCompressing ? "Procesando..." : isFetchingLocation ? "Obteniendo Ubicación..." : "Enviar Reporte"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
};

export default NewReportPage;

    