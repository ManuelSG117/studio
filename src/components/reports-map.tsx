
"use client";

import type { FC } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/app/(app)/welcome/page'; // Reuse Report type
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface ReportsMapProps {
  reports: Report[];
  defaultZoom?: number;
  defaultCenter?: { lat: number; lng: number };
}

// Note: Storing the API key directly in the code is not recommended for production.
// Consider using environment variables.
const GOOGLE_MAPS_API_KEY = "AIzaSyDtuGQXVRNzK0N7_5R5iMFLuRMPxCFG5cs"; // User provided key

export const ReportsMap: FC<ReportsMapProps> = ({
  reports,
  defaultZoom = 12, // Default zoom level
  defaultCenter = { lat: 19.4181, lng: -102.0515 } // Centered around Uruapan
}) => {
  const { toast } = useToast();
  const router = useRouter(); // Get router instance
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-reports', // Use a unique ID
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["maps"],
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleMarkerClick = useCallback((report: Report) => {
    setSelectedReport(report);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedReport(null);
  }, []);

  const handleInfoWindowClick = (reportId: string) => {
      router.push(`/reports/${reportId}`); // Navigate to report detail page
  };

  const containerStyle = {
    width: '100%',
    height: '100%', // Take full height of the parent container
    borderRadius: '0.5rem', // Match card rounding
  };

  // Memoize map options to prevent unnecessary re-renders
  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    // Consider adding map styles for a custom look
    // styles: [...]
  }), []);

  // Filter reports that have valid coordinates
  const reportsWithCoords = useMemo(() => reports.filter(r => r.latitude != null && r.longitude != null), [reports]);

  // Calculate map center dynamically based on reports (optional, fallback to default)
  const mapCenter = useMemo(() => {
    if (reportsWithCoords.length === 0) {
      return defaultCenter;
    }
    // Basic average calculation (can be improved with bounds calculation)
    const avgLat = reportsWithCoords.reduce((sum, r) => sum + r.latitude!, 0) / reportsWithCoords.length;
    const avgLng = reportsWithCoords.reduce((sum, r) => sum + r.longitude!, 0) / reportsWithCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [reportsWithCoords, defaultCenter]);

  // --- Loading and Error States ---
  if (loadError) {
     console.error("Error loading Google Maps:", loadError);
     toast({
       variant: "destructive",
       title: "Error de Mapa",
       description: "No se pudo cargar el mapa. Verifica la configuración de la API Key.",
     });
    return (
      <div className="h-full w-full bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Error al cargar el mapa</p>
        <p className="text-xs text-destructive/80">Inténtalo de nuevo más tarde.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <Skeleton className="h-full w-full rounded-lg flex flex-col items-center justify-center">
         <MapPin className="h-8 w-8 text-muted-foreground opacity-50 mb-2 animate-pulse" />
         <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </Skeleton>
    );
  }

  // --- Render Map ---
  return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={defaultZoom}
        options={mapOptions}
      >
        {/* Render a marker for each report with coordinates */}
        {reportsWithCoords.map((report) => (
          <MarkerF
            key={report.id}
            position={{ lat: report.latitude!, lng: report.longitude! }}
            title={report.title}
            onClick={() => handleMarkerClick(report)}
            // Optional: Use different icons based on report type
            // icon={{
            //   url: report.reportType === 'incidente' ? '/path/to/incident-icon.png' : '/path/to/official-icon.png',
            //   scaledSize: new window.google.maps.Size(30, 30) // Adjust size as needed
            // }}
          />
        ))}

         {/* InfoWindow for selected marker */}
         {selectedReport && (
            <InfoWindowF
               position={{ lat: selectedReport.latitude!, lng: selectedReport.longitude! }}
               onCloseClick={handleInfoWindowClose}
               options={{ pixelOffset: new window.google.maps.Size(0, -30) }} // Adjust offset
            >
              <div
                className="p-1 cursor-pointer hover:bg-muted/50 rounded"
                onClick={() => handleInfoWindowClick(selectedReport.id)}
                title="Ver detalles del reporte"
              >
                 <h4 className="text-sm font-semibold mb-1 text-primary">{selectedReport.title}</h4>
                 <p className="text-xs text-muted-foreground line-clamp-2">{selectedReport.description}</p>
                 <div className="flex items-center text-xs text-accent mt-1.5">
                   <Info size={12} className="mr-1"/> Ver detalles
                 </div>
              </div>
            </InfoWindowF>
         )}
      </GoogleMap>
  );
};

export default ReportsMap;
