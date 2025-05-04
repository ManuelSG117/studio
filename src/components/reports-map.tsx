
"use client";

import type { FC } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, Info, ExternalLink } from 'lucide-react'; // Added ExternalLink
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/app/(app)/welcome/page'; // Reuse Report type
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button'; // Import Button for better styling

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
    if (reportsWithCoords.length === 1 && reportsWithCoords[0]) {
      // If only one report, center on it
      return { lat: reportsWithCoords[0].latitude!, lng: reportsWithCoords[0].longitude! };
    }
    // Basic average calculation for multiple reports (can be improved with bounds calculation)
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
             icon={{
               url: report.reportType === 'incidente'
                 ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImhzbCgxMCA4MCUgNjAlKSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFsZXJ0LXRyaWFuZ2xlIj48cGF0aCBkPSJNMTUuNzggMy4yMkExIDEgMCAwIDAgMTQgNEg1YTEgMSAwIDAgMCAtLjc4IDEuNzhsNyAxNEExIDEgMCAwIDAgMTQgMjBoOEExIDEgMCAwIDAgMjIuNzggMTcuNzhsLTctMTRhMSAxIDAgMCAwIC0xLjIyIC0xLjU2eiIvPjxsaW5lIHgxPSIxMiIgeDI9IjEyIiB5MT0iOCIgeTI9IjEzIi8+PHBvaW50IHgxPSIxMiIgeTE9IjE3IiB5Mj0iMTcuMDEiLz48L3N2Zz4=' // Red triangle for incidents
                 : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImhzbCgyMTUgNDklIDMyJSkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyLWNvZyI+PHBhdGggZD0ibTE0IDE4IDYtNi02LTYiLz48cGF0aCBkPSJNNS44NjEgMTggLjc3NyAxMC4yOTNhNSA1IDAgMSAxIDktMS43MzYiLz48cGF0aCBkPSJtMTYgMy4xMzEgMy45MiAyLjI2NGEyIDIgMCAwIDEgMS4wOCAxLjcxNXY0Ljc3NWEyIDIgMCAwIDEgLTEuMDggMS43MTRsLTMuOTIgMi4yNjRhMiAyIDAgMCAxIC0yIDBMMTAuMDggMTMuNjFhMiAyIDAgMCAxIC0xLjA4LTEuNzE1di00Ljc3NWEyIDIgMCAwIDEgMS4wOC0xLjcxNEwxNCAzLjEzMVoiLz48L3N2Zz4=', // Blue user cog for officials
               scaledSize: new window.google.maps.Size(30, 30), // Adjust size
               anchor: new window.google.maps.Point(15, 15), // Center anchor
             }}
          />
        ))}

         {/* InfoWindow for selected marker */}
         {selectedReport && (
            <InfoWindowF
               position={{ lat: selectedReport.latitude!, lng: selectedReport.longitude! }}
               onCloseClick={handleInfoWindowClose}
               options={{
                  pixelOffset: new window.google.maps.Size(0, -35), // Adjust offset slightly higher
                  maxWidth: 250, // Set max width for better layout
                }}
            >
              <div className="p-2 space-y-1.5 max-w-xs"> {/* Add padding and spacing */}
                 <h4 className="text-base font-semibold mb-1 text-primary flex items-center gap-1.5">
                    {selectedReport.reportType === 'incidente' ? (
                       <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                     ) : (
                       <Info className="h-4 w-4 text-blue-600 flex-shrink-0" /> // Example icon for funcionario
                     )}
                     {selectedReport.title}
                 </h4>
                 <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">{selectedReport.description}</p>
                  {/* Use a styled button/link for viewing details */}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs text-accent hover:text-accent/80 font-medium mt-1 flex items-center gap-1"
                    onClick={() => handleInfoWindowClick(selectedReport.id)}
                    title="Ver detalles del reporte"
                  >
                     <ExternalLink size={12} /> Ver detalles del reporte
                  </Button>
              </div>
            </InfoWindowF>
         )}
      </GoogleMap>
  );
};

export default ReportsMap;

    