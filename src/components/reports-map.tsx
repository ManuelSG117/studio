
"use client";

import type { FC } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, HeatmapLayerF } from '@react-google-maps/api'; // Import HeatmapLayerF
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, Info, ExternalLink, UserCog } from 'lucide-react'; // Added UserCog for type icon
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/app/(app)/welcome/page';
import { useState, useCallback, useMemo, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Import cn for conditional styling

type MapViewMode = 'markers' | 'heatmap'; // Define view modes

interface ReportsMapProps {
  reports: Report[];
  defaultZoom?: number;
  defaultCenter?: { lat: number; lng: number };
  viewMode?: MapViewMode; // Add prop for view mode control
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDtuGQXVRNzK0N7_5R5iMFLuRMPxCFG5cs";

// Define map libraries including visualization for heatmap
const libraries: ('maps' | 'visualization')[] = ["maps", "visualization"];

export const ReportsMap: FC<ReportsMapProps> = ({
  reports,
  defaultZoom = 12,
  defaultCenter = { lat: 19.4181, lng: -102.0515 },
  viewMode = 'markers' // Default view mode to 'markers' if not provided
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-reports',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries, // Use the defined libraries array
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [heatmapData, setHeatmapData] = useState<google.maps.LatLng[]>([]); // State for heatmap data

  const handleMarkerClick = useCallback((report: Report) => {
    setSelectedReport(report);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedReport(null);
  }, []);

  const handleInfoWindowClick = (reportId: string) => {
      router.push(`/reports/${reportId}`);
  };

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
  };

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    // styles: [...] // Optional custom map styles
  }), []);

  const reportsWithCoords = useMemo(() => reports.filter(r => r.latitude != null && r.longitude != null), [reports]);

  // Effect to process reports into heatmap data when isLoaded and reports change
  useEffect(() => {
    // Only generate heatmap data if viewMode is 'heatmap' and map is loaded
    if (isLoaded && viewMode === 'heatmap') {
        const data = reportsWithCoords.map(report =>
            new window.google.maps.LatLng(report.latitude!, report.longitude!)
        );
        setHeatmapData(data);
        console.log("Generated heatmap data points:", data.length);
    } else {
        setHeatmapData([]); // Clear heatmap data if not shown or not loaded
    }
  }, [isLoaded, reportsWithCoords, viewMode]); // Depend on viewMode as well


  const mapCenter = useMemo(() => {
    if (reportsWithCoords.length === 0) {
      return defaultCenter;
    }
    // Center on the single report if only one exists
    if (reportsWithCoords.length === 1 && reportsWithCoords[0]) {
      return { lat: reportsWithCoords[0].latitude!, lng: reportsWithCoords[0].longitude! };
    }
    // Calculate average center for multiple reports
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
        {/* Render Heatmap Layer if viewMode is 'heatmap' */}
        {viewMode === 'heatmap' && heatmapData.length > 0 && (
            <HeatmapLayerF
                data={heatmapData}
                options={{
                    radius: 25, // Slightly increased radius
                    opacity: 0.7 // Slightly increased opacity
                }}
            />
        )}

        {/* Render Markers if viewMode is 'markers' */}
        {viewMode === 'markers' && reportsWithCoords.map((report) => (
          <MarkerF
            key={report.id}
            position={{ lat: report.latitude!, lng: report.longitude! }}
            title={report.title}
            onClick={() => handleMarkerClick(report)}
            // You can customize marker icons here based on report.reportType if needed
            // icon={report.reportType === 'incidente' ? '/path/to/alert-icon.png' : '/path/to/user-icon.png'}
          />
        ))}

         {/* InfoWindow for selected marker (only shown in 'markers' mode) */}
         {viewMode === 'markers' && selectedReport && (
            <InfoWindowF
               position={{ lat: selectedReport.latitude!, lng: selectedReport.longitude! }}
               onCloseClick={handleInfoWindowClose}
               options={{
                  pixelOffset: new window.google.maps.Size(0, -35), // Adjust offset if needed
                  maxWidth: 250,
                  // Close button is enabled by default, can be disabled if needed: disableAutoPan: false,
                }}
            >
              <div className="p-1 space-y-1.5 max-w-xs"> {/* Reduced padding */}
                 <h4 className="text-sm font-semibold mb-0.5 text-primary flex items-center gap-1.5"> {/* Reduced bottom margin */}
                    {selectedReport.reportType === 'incidente' ? (
                       <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                     ) : (
                       <UserCog className="h-4 w-4 text-blue-600 flex-shrink-0" /> // Changed icon to UserCog
                     )}
                     {selectedReport.title}
                 </h4>
                 <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">{selectedReport.description}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs text-accent hover:text-accent/80 font-medium mt-1 flex items-center gap-1"
                    onClick={() => handleInfoWindowClick(selectedReport.id)}
                    title="Ver detalles del reporte"
                  >
                     <ExternalLink size={12} /> Ver detalles
                  </Button>
              </div>
            </InfoWindowF>
         )}
      </GoogleMap>
  );
};

export default ReportsMap;
    
