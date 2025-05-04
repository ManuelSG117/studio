
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, Loader2, List } from 'lucide-react';
import { ReportsMap } from '@/components/reports-map'; // Import the ReportsMap component
import type { Report } from '@/app/(app)/welcome/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';


// Helper function to format location
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

const DangerZonesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isClient, setIsClient] = useState(false);

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
            <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                 <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                 </CardHeader>
                 <CardContent className="p-0 sm:p-0 h-[60vh] sm:h-[70vh] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                 </CardContent>
             </Card>
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
            <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                         <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> Mapa de Zonas de Riesgo
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                          Visualización de densidad de reportes. Las zonas más cálidas indican mayor concentración.
                     </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-0 h-[60vh] sm:h-[70vh]">
                     {isClient && (
                        <ReportsMap
                            reports={reports}
                            showHeatmap={true} // Enable the heatmap layer
                            defaultZoom={13} // Slightly more zoomed out to see density patterns
                         />
                     )}
                </CardContent>
            </Card>

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

    