
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getReportById, type Report } from '@/app/welcome/page'; // Import function and type
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarDays, MapPin, Tag, UserCog, TriangleAlert, Image as ImageIcon, Map, Video } from 'lucide-react'; // Add ImageIcon, Map, Video

// Placeholder for a Map component (replace with actual implementation)
const MapPreviewPlaceholder: FC<{ location: string }> = ({ location }) => (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm border border-border">
        <Map className="h-8 w-8 mr-2 opacity-50" />
        <span>Mapa de "{location}"</span>
    </div>
);

const ReportDetailPage: FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string; // Get reportId from URL
    const [report, setReport] = useState<Report | null | undefined>(undefined); // Initial state undefined for loading
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [user, setUser] = useState(null); // To check if user is logged in

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace("/login"); // Redirect if not logged in
            } else {
                setUser(currentUser); // Set user if logged in
                 // Fetch report data after confirming authentication
                 const foundReport = getReportById(reportId);
                 setReport(foundReport); // Set report data or null if not found
            }
            setIsAuthLoading(false);
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
    if (isAuthLoading || report === undefined) {
        return (
            <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-secondary">
                <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl bg-card">
                    <CardHeader className="relative pb-4 pt-8">
                        <Skeleton className="absolute left-4 top-6 h-8 w-8 rounded-full" />
                        <Skeleton className="h-7 w-3/5 mx-auto" />
                        <Skeleton className="h-4 w-2/5 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-5">
                        {/* Metadata Skeletons */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className="flex items-center space-x-3">
                                     <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                                     <Skeleton className="h-4 w-24" />
                                 </div>
                             ))}
                         </div>
                         {/* Description Skeleton */}
                         <div className="pt-4 space-y-2">
                           <Skeleton className="h-5 w-28" />
                           <Skeleton className="h-16 w-full" />
                         </div>
                         {/* Media Skeleton */}
                         <div className="pt-4 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="aspect-video w-full rounded-lg" />
                         </div>
                         {/* Map Skeleton */}
                          <div className="pt-4 space-y-2">
                             <Skeleton className="h-5 w-24" />
                             <Skeleton className="aspect-video w-full rounded-lg" />
                          </div>
                         <div className="flex justify-end pt-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                         </div>
                    </CardContent>
                </Card>
            </main>
        );
    }

     // Report not found state
    if (report === null) {
         return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
                 <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center bg-card">
                     <CardHeader>
                         <CardTitle className="text-xl text-destructive">Reporte No Encontrado</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <p className="text-muted-foreground mb-6">
                             No pudimos encontrar el reporte que buscas. Puede que haya sido eliminado o el enlace sea incorrecto.
                         </p>
                         <Button asChild variant="outline" className="rounded-full">
                             <Link href="/welcome">
                                 <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Reportes
                             </Link>
                         </Button>
                     </CardContent>
                 </Card>
             </main>
         );
     }


    // Display report details
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-secondary">
            <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl bg-card">
                <CardHeader className="relative pb-4 pt-8">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
                        onClick={() => router.push('/welcome')}
                        aria-label="Volver a Reportes"
                        type="button"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <CardTitle className="text-2xl font-bold text-primary text-center pt-2">{report.title}</CardTitle>
                    <CardDescription className="text-muted-foreground text-center">
                        Detalles del reporte #{report.id}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-6"> {/* Increased spacing */}
                    {/* Report Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="flex items-center space-x-3 text-foreground">
                            {report.type === 'funcionario' ? (
                              <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                             ) : (
                              <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                             )}
                            <span className="font-medium">Tipo:</span> <span className="capitalize">{report.type === 'funcionario' ? 'Funcionario' : 'Incidente'}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-foreground">
                            <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">Fecha:</span> <span>{report.date}</span>
                        </div>
                         <div className="flex items-center space-x-3 text-foreground">
                             <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                             <span className="font-medium">Ubicación:</span> <span>{report.location}</span>
                         </div>
                         <div className="flex items-center space-x-3 text-foreground">
                            <Tag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex items-center">
                                <span className="font-medium mr-2">Estado:</span>
                                <Badge
                                     variant={getStatusVariant(report.status)}
                                     className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusClasses(report.status)}`}
                                >
                                    {report.status}
                                </Badge>
                            </div>
                         </div>
                    </div>

                    {/* Report Description */}
                    <div className="pt-2"> {/* Adjusted padding */}
                        <h3 className="text-base font-semibold text-primary mb-2">Descripción</h3>
                        <p className="text-foreground/90 leading-relaxed">{report.description}</p>
                    </div>

                    {/* Media Evidence */}
                    {report.mediaUrl && (
                         <div className="pt-2">
                             <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                                 <ImageIcon className="h-5 w-5 mr-2 opacity-70" /> Evidencia Multimedia
                             </h3>
                             {/* Basic Image display for now */}
                             <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                                 <Image
                                     src={report.mediaUrl}
                                     alt={`Evidencia para reporte ${report.id}`}
                                     layout="fill"
                                     objectFit="cover"
                                     data-ai-hint="report evidence media"
                                 />
                                 {/* TODO: Add video player logic if needed */}
                                 {/* If it's a video, you might render a <video> tag or a placeholder */}
                                 {/* Example: If it ends with .mp4 (adjust logic as needed) */}
                                 {/* {report.mediaUrl.endsWith('.mp4') && (
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                         <Video className="h-12 w-12 text-white" />
                                     </div>
                                 )} */}
                             </div>
                         </div>
                    )}

                    {/* Location Map Preview */}
                    <div className="pt-2">
                         <h3 className="text-base font-semibold text-primary mb-2 flex items-center">
                             <Map className="h-5 w-5 mr-2 opacity-70" /> Ubicación en Mapa
                         </h3>
                         <MapPreviewPlaceholder location={report.location} />
                         {/* TODO: Integrate actual map component (e.g., Google Maps Embed API, Leaflet) */}
                    </div>


                     {/* TODO: Add Actions (e.g., Edit, Change Status, Delete) if needed */}
                     {/* <CardFooter className="pt-6 justify-end">
                       <Button variant="outline" className="rounded-full">Editar</Button>
                     </CardFooter> */}
                </CardContent>
            </Card>
        </main>
    );
};

export default ReportDetailPage;
