
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle } from 'lucide-react'; // Import icons

// Placeholder for a Map component (replace with actual implementation)
const MapPlaceholder: FC = () => (
    <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm border border-border">
        <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
        <span>Vista de Mapa de Zonas de Peligro</span>
        <span className="text-xs">(Componente de mapa a implementar)</span>
    </div>
);

const DangerZonesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login"); // Redirect if not logged in
      } else {
        setUser(currentUser); // Set user if logged in
      }
      setIsLoading(false); // Finish loading after auth check
    });

    return () => unsubscribe();
  }, [router]);

   // Loading state
  if (isLoading) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary">
         <div className="w-full max-w-4xl space-y-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-1/3" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="aspect-video w-full rounded-lg" />
         </div>
      </main>
    );
  }

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
                         <MapPin className="h-5 w-5 mr-2 text-red-600" /> Mapa de Riesgo
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                         Visualiza las áreas reportadas con mayor incidencia.
                     </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                    <MapPlaceholder />
                     {/* TODO: Implement actual map integration (e.g., Leaflet, Google Maps SDK) */}
                     {/* Data for markers/heatmaps would be fetched here */}
                </CardContent>
            </Card>

             {/* Potentially add a list view or other information below the map */}
             {/* <Card> ... </Card> */}
        </div>
    </main>
  );
};

export default DangerZonesPage;
