"use client";

import type { FC, ChangeEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore"; 
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "@firebase/storage";
import imageCompression from 'browser-image-compression'; 
import { auth, db, storage } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Loader2, UploadCloud, Image as ImageIcon, Trash2, UserCog, TriangleAlert, LocateFixed, FileUp } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image"; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; 
import { ReportsMap } from '@/components/reports-map';
import { RecentCommunityReports } from '@/components/reports/recent-community-reports'; // Import the new component
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useCallback } from "react";

type ReportType = 'incidente' | 'funcionario';

const reportFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }).max(100, { message: "El título no puede exceder los 100 caracteres."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(1000, { message: "La descripción no puede exceder los 1000 caracteres."}),
  location: z.string().min(3, { message: "La ubicación es requerida." }).max(150, { message: "La ubicación no puede exceder los 150 caracteres."}),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

const NewReportPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); 
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); 
  const [isCompressing, setIsCompressing] = useState(false); 
  const [isFetchingLocation, setIsFetchingLocation] = useState(false); 
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); 
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null); 
  const [fetchedCoordinates, setFetchedCoordinates] = useState<{ lat: number; lng: number } | null>(null); // State for fetched coordinates
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    id: 'google-map-script-reports',
    libraries: ["maps", "visualization", "places"],
  });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

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
        maxSizeMB: file.type.startsWith("image/") ? 2 : 10, // 2MB for images, 10MB for videos
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
            console.log(`Video file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            if (file.size > options.maxSizeMB * 1024 * 1024) { // Check against 10MB for videos
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

  const handleUploadClick = () => {
    if (!isCompressing && !isUploading && !isLoading) {
        fileInputRef.current?.click();
    }
  };

   const handleRemoveFile = () => {
       if (isCompressing || isUploading || isLoading) return;
       setSelectedFile(null);
       setPreviewUrl(null);
   };

    const fetchAndSetLocation = () => {
        setIsFetchingLocation(true);
        setFetchedCoordinates(null); // Reset map preview
        navigator.geolocation.getCurrentPosition(
             (position) => {
                const { latitude, longitude } = position.coords;
                 fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(response => response.json())
                    .then(data => {
                         const address = data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                         form.setValue("location", address, { shouldValidate: true });
                         toast({
                            title: "Ubicación Actual Obtenida",
                            description: "Se estableció tu ubicación. Revisa si es correcta y añade detalles si es necesario (ej. número interior, piso).",
                         });
                    })
                    .catch(err => {
                         console.error("Reverse geocoding failed:", err);
                         const locationString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                         form.setValue("location", locationString, { shouldValidate: true });
                          toast({
                             title: "Coordenadas Obtenidas",
                             description: "No se pudo obtener la dirección, se usaron coordenadas. Por favor, completa la dirección manualmente.",
                          });
                    })
                    .finally(() => {
                         form.setValue("latitude", latitude);
                         form.setValue("longitude", longitude);
                         setFetchedCoordinates({ lat: latitude ?? 0, lng: longitude ?? 0 }); // Update coordinates for map
                         setIsFetchingLocation(false);
                    });
            },
            (error) => {
                 console.error("Geolocation error:", error);
                 let description = "No se pudo obtener tu ubicación.";
                 if (error.code === error.PERMISSION_DENIED) description = "Permiso de ubicación denegado.";
                 else if (error.code === error.POSITION_UNAVAILABLE) description = "La información de ubicación no está disponible.";
                 else if (error.code === error.TIMEOUT) description = "Se agotó el tiempo de espera para obtener la ubicación.";
                 toast({ variant: "destructive", title: "Error de Ubicación", description: description });
                 setIsFetchingLocation(false);
                 setFetchedCoordinates(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
         );
    };

    const handleConfirmUseLocation = () => {
       if (!navigator.geolocation) {
          toast({ variant: "destructive", title: "Geolocalización no soportada", description: "Tu navegador no soporta la geolocalización." });
          return;
       }
       fetchAndSetLocation(); 
    };

  const handlePlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.formatted_address) return;
      const lat = place.geometry.location?.lat();
      const lng = place.geometry.location?.lng();
      form.setValue("location", place.formatted_address, { shouldValidate: true });
      form.setValue("latitude", lat, { shouldValidate: true });
      form.setValue("longitude", lng, { shouldValidate: true });
      setFetchedCoordinates({ lat: lat ?? 0, lng: lng ?? 0 });
    }
  }, [form, setFetchedCoordinates]);

  const onSubmit = async (values: ReportFormData) => {
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
    let mediaDownloadURL: string | null = null;
    if (selectedFile) {
      setIsUploading(true);
      const fileName = `${user.uid}_${Date.now()}_${selectedFile.name}`;
      const mediaRef = storageRef(storage, `reportMedia/${fileName}`);
      try {
        await uploadBytes(mediaRef, selectedFile);
        mediaDownloadURL = await getDownloadURL(mediaRef);
        toast({ title: "Archivo Subido", description: "La evidencia multimedia se ha guardado." });
      } catch (uploadError) {
        console.error("Error uploading media:", uploadError);
        toast({ variant: "destructive", title: "Error al Subir Archivo", description: "No se pudo guardar la evidencia. El reporte se guardará sin ella."});
      } finally {
        setIsUploading(false);
      }
    }
    try {
      const reportsCollectionRef = collection(db, "reports");
      const reportData = {
        userId: user.uid, userEmail: user.email, reportType: selectedReportType, 
        title: values.title, description: values.description, location: values.location,
        mediaUrl: mediaDownloadURL, latitude: values.latitude ?? null, longitude: values.longitude ?? null,
        createdAt: Timestamp.now(), upvotes: 0, downvotes: 0,
      };
      const docRef = await addDoc(reportsCollectionRef, reportData);
      toast({ title: "Reporte Enviado", description: "Tu reporte ha sido registrado exitosamente." });
      router.push("/welcome");
    } catch (error) {
      console.error("Error saving report:", error);
      toast({ variant: "destructive", title: "Error al Guardar Reporte", description: "No se pudo registrar el reporte. Inténtalo de nuevo."});
    } finally {
      setIsLoading(false);
    }
  };

   if (isAuthLoading) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center py-8 px-4 sm:px-8 bg-secondary">
           <Card className="w-full max-w-7xl shadow-lg border-none rounded-xl">
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
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 md:px-8 bg-secondary min-h-screen">
      <Card className="w-full max-w-7xl shadow-xl border-none rounded-xl bg-card">
        <CardHeader className="pt-8 pb-6 px-6 md:px-8">
           <div className="flex items-center mb-4">
             <Button
               variant="ghost"
               size="icon"
               className="mr-3 text-muted-foreground hover:text-primary rounded-full h-9 w-9"
               onClick={() => router.back()}
               aria-label="Volver"
               type="button"
               disabled={disableForm}
             >
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex-grow">
                <CardTitle className="text-2xl font-bold text-foreground">Crear Nuevo Reporte</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                    Ayuda a mejorar la seguridad de tu comunidad reportando incidentes o actos indebidos. Tu participación es importante para construir un Uruapan +SEGURO.
                </CardDescription>
             </div>
           </div>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormItem>
                   <FormLabel className="text-sm font-medium text-foreground">Tipo de Reporte</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                        <Card
                             className={cn(
                                "cursor-pointer border-2 p-4 flex flex-col items-center justify-center text-center transition-all hover:shadow-md h-32",
                                selectedReportType === 'funcionario' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border bg-card hover:border-primary/40',
                                disableForm ? 'opacity-60 cursor-not-allowed' : ''
                             )}
                             onClick={() => !disableForm && setSelectedReportType('funcionario')}
                        >
                            <UserCog className={cn("h-7 w-7 mb-2", selectedReportType === 'funcionario' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
                            <p className={cn("text-sm font-medium", selectedReportType === 'funcionario' ? 'text-primary' : 'text-foreground')}>Funcionario Público</p>
                            <p className="text-xs text-muted-foreground">Actos indebidos, corrupción, etc.</p>
                        </Card>
                         <Card
                            className={cn(
                                "cursor-pointer border-2 p-4 flex flex-col items-center justify-center text-center transition-all hover:shadow-md h-32",
                                selectedReportType === 'incidente' ? 'border-destructive bg-destructive/5 ring-2 ring-destructive' : 'border-border bg-card hover:border-destructive/40',
                                disableForm ? 'opacity-60 cursor-not-allowed' : ''
                             )}
                             onClick={() => !disableForm && setSelectedReportType('incidente')}
                         >
                            <TriangleAlert className={cn("h-7 w-7 mb-2", selectedReportType === 'incidente' ? 'text-destructive' : 'text-muted-foreground group-hover:text-destructive')} />
                            <p className={cn("text-sm font-medium", selectedReportType === 'incidente' ? 'text-destructive' : 'text-foreground')}>Delito/Incidente</p>
                            <p className="text-xs text-muted-foreground">Robos, asaltos, vandalismo, etc.</p>
                        </Card>
                    </div>
                     {!selectedReportType && form.formState.isSubmitted && (
                        <p className="text-xs font-medium text-destructive mt-1.5">Por favor, selecciona un tipo de reporte.</p>
                    )}
               </FormItem>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Reporte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Robo en la calle principal" {...field} disabled={disableForm} aria-required="true" className="h-11"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe con detalle lo sucedido..." {...field} disabled={disableForm} aria-required="true" className="min-h-[100px]"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                     <FormLabel>Ubicación</FormLabel>
                     <div className="flex items-center gap-2">
                        <FormControl>
                          {isMapsLoaded ? (
                            <Autocomplete
                              onLoad={ac => (autocompleteRef.current = ac)}
                              onPlaceChanged={handlePlaceChanged}
                              options={{
                                componentRestrictions: { country: "mx" },
                                types: ["address"],
                                bounds: {
                                  east: -102.0,
                                  north: 19.5,
                                  south: 19.3,
                                  west: -102.2,
                                },
                                strictBounds: true,
                              }}
                            >
                              <Input
                                placeholder="Dirección del incidente"
                                {...field}
                                disabled={disableForm}
                                aria-required="true"
                                className="h-11 flex-grow min-w-[220px] sm:min-w-[350px] md:min-w-[500px] lg:min-w-[1000px] max-w-full text-base px-4"
                                autoComplete="off"
                              />
                            </Autocomplete>
                          ) : (
                            <Input
                              placeholder="Dirección del incidente"
                              {...field}
                              disabled={true}
                              aria-required="true"
                              className="h-11 flex-grow min-w-[220px] sm:min-w-[350px] md:min-w-[500px] lg:min-w-[1000px] max-w-full text-base px-4"
                            />
                          )}
                        </FormControl>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="outline" className="h-11 px-3" disabled={disableForm || isFetchingLocation} aria-label="Usar mi ubicación">
                                    {isFetchingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                                    <span className="ml-2 hidden sm:inline">Usar mi ubicación</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmación de Ubicación</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción usará tu ubicación actual del GPS. Asegúrate de estar físicamente en el lugar donde ocurrió el incidente para mayor precisión.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isFetchingLocation}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmUseLocation} disabled={isFetchingLocation}>
                                        {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Usar Ubicación Actual
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                     <FormMessage />
                  </FormItem>
                )}
              />
              {/* Map Preview */}
              <div className="h-96 bg-muted rounded-md flex items-center justify-center text-muted-foreground border overflow-hidden">
                 {fetchedCoordinates && user ? (
                    <ReportsMap
                      reports={[{
                        id: 'current-location',
                        userId: user.uid,
                        reportType: selectedReportType || 'incidente',
                        title: 'Ubicación Actual del Reporte',
                        description: form.getValues('description') || 'Ubicación seleccionada para el nuevo reporte.',
                        location: form.getValues('location'),
                        mediaUrl: null,
                        latitude: fetchedCoordinates.lat,
                        longitude: fetchedCoordinates.lng,
                        createdAt: new Date(),
                        upvotes: 0,
                        downvotes: 0,
                      }]}
                      defaultCenter={fetchedCoordinates}
                      defaultZoom={16}
                      viewMode="markers"
                      draggableMarker={true}
                      onMarkerDragEnd={({ lat, lng }) => {
                        form.setValue('latitude', lat, { shouldValidate: true });
                        form.setValue('longitude', lng, { shouldValidate: true });
                        setFetchedCoordinates({ lat, lng });
                      }}
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 opacity-50" />
                      <span className="ml-2">Vista previa del mapa aquí</span>
                    </>
                  )}
              </div>
              {/* Mensaje minimalista para el marcador arrastrable */}
              {fetchedCoordinates && user && (
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  Puedes mover el marcador en el mapa para precisar la ubicación.
                </div>
              )}


               <FormItem>
                    <FormLabel>Evidencia</FormLabel>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {previewUrl ? (
                                <div className="relative group w-full max-w-xs mx-auto">
                                    {selectedFile?.type.startsWith('image/') ? (
                                        <Image src={previewUrl} alt="Vista previa" width={200} height={150} className="mx-auto rounded-md object-contain max-h-[150px]" data-ai-hint="evidence preview"/>
                                    ) : (
                                        <video src={previewUrl} controls className="mx-auto rounded-md max-h-[150px] max-w-full" preload="metadata"/>
                                    )}
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveFile} disabled={disableForm} aria-label="Eliminar archivo">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            )}
                            
                            <div className="flex text-sm text-muted-foreground justify-center">
                                <label htmlFor="file-upload" className={cn("relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary", disableForm && "opacity-50 cursor-not-allowed")}>
                                <span>{isCompressing ? "Procesando..." : "Arrastra y suelta o selecciona archivos"}</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" disabled={disableForm} />
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, MP4 (máx 2MB img, 10MB video)</p>
                            {isUploading && (
                                <div className="flex items-center text-sm text-primary mt-1">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Subiendo archivo...
                                </div>
                            )}
                        </div>
                    </div>
                     <FormMessage />
               </FormItem>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={disableForm} className="rounded-full">
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                    disabled={disableForm || !form.formState.isValid || !selectedReportType}
                >
                    {isLoading || isUploading || isCompressing || isFetchingLocation ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Enviando..." : isUploading ? "Subiendo..." : isCompressing ? "Procesando..." : isFetchingLocation ? "Ubicando..." : "Enviar Reporte"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Community Reports Section */}
      <div className="w-full max-w-7xl mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Reportes Recientes de la Comunidad</h2>
          <RecentCommunityReports />
      </div>

    </main>
  );
};

export default NewReportPage;
