
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { onAuthStateChanged, type User } from 'firebase/auth'; // Import User type
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, Tag, UserCog, TriangleAlert, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react'; // Added ArrowLeft and ImageIcon
import type { Report } from '@/app/(app)/welcome/page'; // Import Report type
import { format } from 'date-fns'; // Import format for date display
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting


const ReportDetailPage: FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string;
    const [report, setReport] = useState<Report | null>(null); // Start with null
    const [isLoading, setIsLoading] = useState(true); // Combined loading state
    const [user, setUser] = useState<User | null>(null);
    const [isClient, setIsClient] = useState(false); // State to track client-side mounting

    useEffect(() => {
        setIsClient(true); // Component has mounted
        setIsLoading(true); // Start loading
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.replace("/login");
            } else {
                setUser(currentUser);
                if (reportId) {
                    try {
                         console.log("Fetching report with ID:", reportId);
                         const reportDocRef = doc(db, "reports", reportId);
                         const reportDocSnap = await getDoc(reportDocRef);

                         if (reportDocSnap.exists()) {
                            const data = reportDocSnap.data();
                             // Convert Firestore Timestamp to Date object
                            const createdAtDate = data.createdAt instanceof Timestamp
                              ? data.createdAt.toDate()
                              : new Date(); // Fallback

                            const fetchedReport: Report = {
                                 id: reportDocSnap.id,
                                 userId: data.userId,
                                 userEmail: data.userEmail || null,
                                 reportType: data.reportType,
                                 title: data.title,
                                 description: data.description,
                                 location: data.location,
                                 mediaUrl: data.mediaUrl || null,
                                 latitude: data.latitude || null,
                                 longitude: data.longitude || null,
                                 status: data.status,
                                 createdAt: createdAtDate,
                            };
                            console.log("Report data found:", fetchedReport);
                            setReport(fetchedReport);
                         } else {
                             console.log("No report found with ID:", reportId);
                             setReport(null); // Set to null if document doesn't exist
                         }
                    } catch (error) {
                        console.error("Error fetching report details:", error);
                        setReport(null); // Set to null on error
                        // Optionally show toast
                    } finally {
                         setIsLoading(false); // Stop loading after fetch attempt
                    }
                } else {
                    console.error("Report ID is missing.");
                    setReport(null);
                    setIsLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, [router, reportId]);


    // Function to get status badge variant (consistent with welcome page)
    const getStatusVariant = (status: Report['status']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
        switch (status) {
            case 'Pendiente': return 'default';
            case 'En proceso': return 'secondary';
            case 'Resuelto': return 'outline';
            default: return 'default';
        }
    }

     // Function to get status badge colors (consistent with welcome page)
    const getStatusClasses = (status: Report['status']): string => {
        switch (status) {
             case 'Pendiente':
                 return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
             case 'En proceso':
                 return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
             case 'Resuelto':
                 return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
             default:
                 return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'; // Fallback
        }
    }

     // Loading state for authentication check and data fetching
    if (isLoading || !isClient) { // Use the single isLoading state and check for client mount
        return (
            <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary min-h-screen">
                <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl bg-card">
                    <CardHeader className="relative pb-4 pt-8">
                         {/* Add Back Button Skeleton */}
                         <Skeleton className="absolute left-4 top-6 h-9 w-9 rounded-full" />
                        <Skeleton className="h-7 w-3/5 mx-auto mb-4" /> {/* Adjusted margin */}
                        {/* Removed CardDescription skeleton */}
                    </CardHeader>
                    <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-6"> {/* Increased spacing */}
                        {/* Metadata Skeletons */}
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-4">
                            <Skeleton className="h-6 w-28" />
                            <Skeleton className="h-4 w-40" />
                         </div>
                         {/* Location Skeleton */}
                         <div className="space-y-2">
                             <Skeleton className="h-5 w-32" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                         {/* Description Skeleton */}
                         <div className="space-y-2">
                           <Skeleton className="h-5 w-40" />
                           <Skeleton className="h-16 w-full" />
                         </div>
                         {/* Media Skeleton */}
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="aspect-video w-full rounded-lg" />
                         </div>
                         {/* Map Placeholder Skeleton */}
                         <div className="space-y-2">
                             <Skeleton className="h-5 w-40" />
                             <Skeleton className="h-48 w-full rounded-lg" />
                         </div>
                    </CardContent>
                </Card>
            </main>
        );
    }

     // Report not found state
    if (report === null) {
         return (
             <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-secondary"> {/* Added min-h-screen */}
                 <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center bg-card">
                     <CardHeader>
                         <CardTitle className="text-xl text-destructive">Reporte No Encontrado</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <p className="text-muted-foreground mb-6">
                             No pudimos encontrar el reporte que buscas (ID: {reportId}). Puede que haya sido eliminado o el enlace sea incorrecto.
                         </p>
                         <Button asChild variant="outline" className="rounded-full">
                             <Link href="/welcome">
                                 Volver a Reportes
                             </Link>
                         </Button>
                     </CardContent>
                 </Card>
             </main>
         );
     }


    // Display report details
    return (
        <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary">
            <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl bg-card">
                <CardHeader className="relative pb-4 pt-8">
                     {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
                        onClick={() => router.back()}
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {/* Combined Title and Type Icon */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                       {report.reportType === 'funcionario' ? (
                          <UserCog className="h-6 w-6 text-primary flex-shrink-0" />
                       ) : (
                          <TriangleAlert className="h-6 w-6 text-destructive flex-shrink-0" />
                       )}
                       <CardTitle className="text-2xl font-bold text-foreground">{report.title}</CardTitle>
                    </div>
                    {/* Removed redundant CardDescription */}
                </CardHeader>

                 {/* Status and Date Section */}
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground px-6 sm:px-8 pb-4 border-b border-border">
                     <div className="flex items-center space-x-3">
                         <Tag className="h-4 w-4 flex-shrink-0" />
                         <span className="font-medium text-foreground">Estado:</span>
                         <Badge
                             variant={getStatusVariant(report.status)}
                             className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusClasses(report.status)}`}
                         >
                             {report.status}
                         </Badge>
                     </div>
                     <div className="flex items-center space-x-2">
                         <CalendarDays className="h-4 w-4 flex-shrink-0" />
                         <span>{format(report.createdAt, "PPP 'a las' p", { locale: es })}</span>
                     </div>
                 </div>


                <CardContent className="px-6 sm:px-8 pt-6 pb-6 space-y-6"> {/* Increased top padding */}

                     {/* Report Location */}
                     <div className="pt-0"> {/* Adjusted padding */}
                         <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                             <MapPin className="h-5 w-5 mr-2 opacity-70" /> Ubicación Reportada
                         </h3>
                         <p className="text-foreground/90 leading-relaxed">{report.location}</p>
                         {/* Coordinates Display (if needed) */}
                         {report.latitude && report.longitude && (
                             <p className="text-xs text-muted-foreground mt-1">
                                 (Lat: {report.latitude.toFixed(6)}, Lon: {report.longitude.toFixed(6)})
                             </p>
                         )}
                     </div>


                    {/* Report Description */}
                    <div className="pt-0"> {/* Adjusted padding */}
                        <h3 className="text-base font-semibold text-primary mb-2">Descripción</h3>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{report.description}</p> {/* Added whitespace-pre-wrap */}
                    </div>

                    {/* Media Evidence */}
                    {report.mediaUrl ? (
                         <div className="pt-0">
                             <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                                 <ImageIcon className="h-5 w-5 mr-2 opacity-70" /> Evidencia Multimedia
                             </h3>
                             <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                                 {/* Simple check for video based on common extensions or content type if available */}
                                 {/\.(mp4|webm|ogg|mov)$/i.test(report.mediaUrl) ? (
                                      <video
                                         controls
                                         src={report.mediaUrl}
                                         className="absolute inset-0 w-full h-full object-contain"
                                         preload="metadata" // Load only metadata initially
                                       >
                                         Tu navegador no soporta videos HTML5.
                                      </video>
                                  ) : (
                                      <Image
                                         src={report.mediaUrl}
                                         alt={`Evidencia para reporte ${report.id}`}
                                         fill
                                         style={{ objectFit: 'contain' }}
                                         data-ai-hint="report evidence media"
                                         className="bg-muted"
                                         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
                                      />
                                  )}
                             </div>
                         </div>
                    ) : (
                        <div className="pt-0">
                             <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                                <ImageIcon className="h-5 w-5 mr-2 opacity-70" /> Evidencia Multimedia
                             </h3>
                             <p className="text-sm text-muted-foreground italic">No se adjuntó evidencia multimedia.</p>
                         </div>
                    )}

                     {/* Map Preview Placeholder */}
                    <div className="pt-0">
                         <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                             <MapPin className="h-5 w-5 mr-2 opacity-70" /> Ubicación en Mapa
                         </h3>
                         <div className="h-48 w-full bg-muted border border-border rounded-lg flex flex-col items-center justify-center text-center p-4">
                            <MapPin className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                            <p className="text-sm text-muted-foreground">Visualización del mapa no disponible.</p>
                            {/* In a future implementation, MapPreview component would go here */}
                            {/* {report.latitude && report.longitude && (
                                <MapPreview lat={report.latitude} lng={report.longitude} />
                            )} */}
                         </div>
                    </div>

                </CardContent>
            </Card>
        </main>
    );
};

export default ReportDetailPage;


    