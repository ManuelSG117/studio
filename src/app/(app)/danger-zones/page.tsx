
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button
import { MapPin, AlertTriangle, Loader2, List, Map, Waves } from 'lucide-react'; // Added Map and Waves icons
import { ReportsMap } from '@/components/reports-map'; // Import the ReportsMap component
import type { Report } from '@/app/(app)/welcome/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Import cn

// Helper function to format location (remains the same)
const formatLocation = (location: string): string => {
    if (!location) return "Ubicación no disponible";
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
        if (/^Lat: .+ Lon: .+$/.test(parts[0])) {
           return parts[0];
        }
        return `${parts[0]}, ${parts[1]}`;
    }
    return location;
};

type MapViewMode = 'markers' | 'heatmap'; // Define view modes

const DangerZonesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('heatmap'); // Default to heatmap view

   useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        try {
          console.log("Fetching all reports for danger zones map...");
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          const fetchedReports: Report[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAtDate = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();

            return {
              id: doc.id,
              userId: data.userId,
              userEmail: data.userEmail,
              reportType: data.reportType,
              title: data.title,
              description: data.description,
              location: data.location,
              mediaUrl: data.mediaUrl || null,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              createdAt: createdAtDate,
            } as Report;
          });
          console.log("Fetched reports for map:", fetchedReports.length);
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching reports for map: ", error);
        } finally {
           setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);


  if (isLoading || !isClient) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-4xl space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                 <Skeleton className="h-8 w-2/3 sm:w-1/2" />
                 {/* Toggle Buttons Skeleton */}
                 <div className="flex items-center gap-2">
                     <Skeleton className="h-9 w-28 rounded-md" />
                     <Skeleton className="h-9 w-28 rounded-md" />
                 </div>
             </div>
             {/* Map Card Skeleton */}
             <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                 <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                     <Skeleton className="h-6 w-1/2 mb-1" />
                     <Skeleton className="h-4 w-3/4" />
                 </CardHeader>
                 <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh] flex items-center justify-center"> {/* Adjusted height */}
                     <Skeleton className="h-full w-full" />
                 </CardContent>
             </Card>
             {/* List Card Skeleton */}
             <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
                 <CardHeader>
                     <Skeleton className="h-6 w-1/3 mb-2" />
                     <Skeleton className="h-4 w-1/2" />
                 </CardHeader>
                 <CardContent className="space-y-3">
                     <Skeleton className="h-5 w-2/3" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-5 w-2/3" />
                     <Skeleton className="h-4 w-full" />
                 </CardContent>
             </Card>
         </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
        <div className="w-full max-w-4xl space-y-6">

             {/* Header with Toggle Buttons */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                 <div className="flex items-center">
                     <AlertTriangle className="h-6 w-6 mr-2 text-destructive flex-shrink-0" />
                     <h1 className="text-xl font-semibold text-foreground">
                         Zonas de Riesgo y Reportes
                     </h1>
                 </div>
                 {/* View Toggle Buttons */}
                 <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                     <Button
                         variant={mapViewMode === 'heatmap' ? 'default' : 'ghost'}
                         size="sm"
                         onClick={() => setMapViewMode('heatmap')}
                         className={cn("flex-1 justify-center gap-1.5 h-8 px-4", mapViewMode === 'heatmap' && "shadow")}
                         aria-pressed={mapViewMode === 'heatmap'}
                     >
                         <Waves size={16} />
                         <span>Densidad</span>
                     </Button>
                     <Button
                         variant={mapViewMode === 'markers' ? 'default' : 'ghost'}
                         size="sm"
                         onClick={() => setMapViewMode('markers')}
                         className={cn("flex-1 justify-center gap-1.5 h-8 px-4", mapViewMode === 'markers' && "shadow")}
                         aria-pressed={mapViewMode === 'markers'}
                     >
                         <MapPin size={16} />
                         <span>Marcadores</span>
                     </Button>
                 </div>
             </div>

             {/* Map Card */}
             <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                         {mapViewMode === 'heatmap' ? (
                            <Waves className="h-5 w-5 mr-2 text-primary"/>
                         ) : (
                            <Map className="h-5 w-5 mr-2 text-primary"/>
                         )}
                        Mapa de {mapViewMode === 'heatmap' ? 'Densidad' : 'Reportes Individuales'}
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                          {mapViewMode === 'heatmap'
                           ? 'Visualización de densidad. Zonas más cálidas indican mayor concentración.'
                           : 'Ubicación de cada reporte individual.'}
                     </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh]"> {/* Adjusted height */}
                     {isClient && (
                        <ReportsMap
                            reports={reports}
                            viewMode={mapViewMode} // Pass the current view mode
                            defaultZoom={13}
                         />
                     )}
                </CardContent>
            </Card>

              {/* Report List Card */}
              <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
                 <CardHeader>
                     <CardTitle className="text-lg font-semibold flex items-center">
                         <List className="h-5 w-5 mr-2 text-primary"/> Lista de Reportes
                     </CardTitle>
                     <CardDescription>Detalles de los últimos reportes recibidos.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     {reports.length > 0 ? (
                         <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                             {reports.map(report => (
                                <Link key={report.id} href={`/reports/${report.id}`} className="block hover:bg-muted/50 p-3 rounded-lg transition-colors duration-150 border-b last:border-b-0">
                                 <li >
                                     <div className="flex justify-between items-center mb-1">
                                         <h4 className="font-medium text-foreground line-clamp-1">{report.title}</h4>
                                         <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                            {format(report.createdAt, "P", { locale: es })}
                                         </span>
                                     </div>
                                     <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                                     <p className="text-xs text-muted-foreground/70 mt-1 flex items-center">
                                         <MapPin size={12} className="mr-1" />
                                         {formatLocation(report.location)}
                                     </p>
                                 </li>
                                </Link>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-muted-foreground text-sm text-center py-4">No hay reportes disponibles para mostrar.</p>
                     )}
                 </CardContent>
              </Card>
        </div>
    </main>
  );
};

export default DangerZonesPage;
    
