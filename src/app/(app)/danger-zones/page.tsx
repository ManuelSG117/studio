
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // Import dynamic
import { onAuthStateChanged, type User } from 'firebase/auth'; // Import User type
import { auth } from '@/lib/firebase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle } from 'lucide-react'; // Import icons
// Removed: import 'leaflet/dist/leaflet.css'; // Leaflet CSS will be imported globally

// Dynamically import the Map component to avoid SSR issues
const DangerZoneMap = dynamic(() => import('@/components/danger-zone-map'), {
  ssr: false,
  loading: () => (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground text-sm border border-border rounded-lg bg-muted">
          <MapPin className="h-10 w-10 mb-2 opacity-50 animate-pulse" />
          <span>Cargando mapa...</span>
      </div>
  ),
});

// Define interface for Danger Zone data
interface DangerZone {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
}

// Placeholder data for danger zones (replace with actual data fetching)
const mockDangerZones: DangerZone[] = [
  { id: 'dz1', lat: 19.4326, lng: -99.1332, title: 'Zona Centro Histórico', description: 'Alto índice de robos a transeúnte.' },
  { id: 'dz2', lat: 19.4000, lng: -99.1667, title: 'Colonia Roma', description: 'Reportes de robo de autopartes.' },
  { id: 'dz3', lat: 19.3560, lng: -99.1717, title: 'Coyoacán Centro', description: 'Actividad sospechosa reportada por las noches.' },
];


const DangerZonesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Use User type
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]); // State for danger zones data
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting

   useEffect(() => {
    setIsClient(true); // Indicate component has mounted on client
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login"); // Redirect if not logged in
      } else {
        setUser(currentUser); // Set user if logged in
         // TODO: Fetch actual danger zone data from your backend/database
         // For now, using mock data after a slight delay to simulate loading
         setTimeout(() => {
            setDangerZones(mockDangerZones);
            setIsLoading(false); // Finish loading after auth check and data fetch
         }, 500); // Simulate network delay
      }
      // Removed setIsLoading(false) from here to ensure it happens after data is potentially fetched
    });

    return () => unsubscribe();
  }, [router]);

   // Loading state skeleton
  if (isLoading || !isClient) { // Also wait for client mount
    return (
      <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary">
         <div className="w-full max-w-4xl space-y-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-1/3" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card mb-6">
                 <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                 </CardHeader>
                 <CardContent className="p-0 sm:p-0 h-[60vh] sm:h-[70vh] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                 </CardContent>
             </Card>
         </div>
      </main>
    );
  }

  // Render map only after client mount, auth check, loading finished, and data is available
  const renderMap = isClient && !isLoading && user && dangerZones.length > 0;

  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary">
        <div className="w-full max-w-4xl">
             {/* Header */}
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-primary">Zonas de Peligro</h1>
                {/* Add any header actions if needed, e.g., filters */}
            </header>

            {/* Search/Filter Input (Optional) */}
            {/* <div className="relative mb-4"> ... </div> */}

             {/* Map View */}
            <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card mb-6">
                <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                         <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> Mapa de Riesgo
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                         Visualiza las áreas reportadas con mayor incidencia. Pasa el cursor o haz clic en un marcador para ver detalles.
                     </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-0 h-[60vh] sm:h-[70vh]"> {/* Adjust padding and height */}
                     {/* Conditional rendering for the map */}
                     {renderMap ? (
                        <DangerZoneMap zones={dangerZones} />
                     ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground text-sm border border-border rounded-lg bg-muted">
                            {dangerZones.length === 0 && !isLoading ? (
                                <span>No hay zonas de peligro para mostrar.</span>
                            ) : (
                                <>
                                    {/* Show loading skeleton/indicator if map isn't ready but shouldn't be empty */}
                                    <MapPin className="h-10 w-10 mb-2 opacity-50 animate-pulse" />
                                    <span>Cargando mapa...</span>
                                </>
                            )}
                         </div>
                     )}
                </CardContent>
            </Card>

             {/* Potentially add a list view or other information below the map */}
             {/* ... (List view code remains commented) ... */}
        </div>
    </main>
  );
};

export default DangerZonesPage;
