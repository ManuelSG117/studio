"use client";

import React, { forwardRef, useImperativeHandle, useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, HeatmapLayerF } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, ExternalLink, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/app/(app)/welcome/page';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

type MapViewMode = 'markers' | 'heatmap';

export interface ReportsMapRef {
  getMapInstance: () => google.maps.Map | null;
}

interface ReportsMapProps {
  reports: Report[];
  defaultZoom?: number;
  defaultCenter?: { lat: number; lng: number };
  viewMode?: MapViewMode; // Add prop for view mode control
  draggableMarker?: boolean; // Nuevo: permite que el marcador sea arrastrable
  onMarkerDragEnd?: (coords: { lat: number; lng: number }) => void; // Nuevo: callback al mover el marcador
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// Define map libraries including visualization for heatmap
const libraries: ('maps' | 'visualization' | 'places')[] = ["maps", "visualization", "places"];

const ReportsMap = forwardRef<ReportsMapRef, ReportsMapProps>((props, ref) => {
  const {
    reports,
    defaultZoom = 12,
    defaultCenter = { lat: 19.4181, lng: -102.0515 },
    viewMode = 'markers',
    draggableMarker,
    onMarkerDragEnd,
  } = props;
  const { toast } = useToast();
  const router = useRouter();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-reports',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries, // Use the defined libraries array
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [heatmapData, setHeatmapData] = useState<google.maps.LatLng[]>([]);
  const [showNoReportsAlert, setShowNoReportsAlert] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Expose the map instance via ref
  useImperativeHandle(ref, () => ({
    getMapInstance: () => mapRef.current
  }));

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
    borderRadius: '0.5rem', // Keep border radius if map container has it
  };

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    // styles: [...] // Optional custom map styles
  }), []);

  // Directly use the received reports array, already filtered upstream
  const reportsWithCoords = useMemo(() => reports.filter(r => r.latitude != null && r.longitude != null), [reports]);

  // Effect to process reports into heatmap data and handle no reports alert
  useEffect(() => {
    if (isLoaded) {
        if (viewMode === 'heatmap') {
            const data = reportsWithCoords.map(report =>
                new window.google.maps.LatLng(report.latitude!, report.longitude!)
            );
            setHeatmapData(data);
            setShowNoReportsAlert(false); // No alert needed for heatmap
            console.log("Generated heatmap data points:", data.length);
        } else { // Marker view
            setHeatmapData([]); // Clear heatmap data
            if (reportsWithCoords.length === 0) {
                setShowNoReportsAlert(true); // Show alert if no markers
                console.log("No reports with coordinates to show in marker view.");
            } else {
                setShowNoReportsAlert(false); // Hide alert if there are markers
            }
        }
    } else {
        setHeatmapData([]);
        setShowNoReportsAlert(false); // Ensure alert is hidden if map not loaded
    }
  }, [isLoaded, reportsWithCoords, viewMode]);


  const mapCenter = useMemo(() => {
    // Handle case where the filtered array might be empty
    if (reportsWithCoords.length === 0) {
      return defaultCenter;
    }
    if (reportsWithCoords.length === 1 && reportsWithCoords[0]) {
      return { lat: reportsWithCoords[0].latitude!, lng: reportsWithCoords[0].longitude! };
    }
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
    <>
      <AlertDialog open={showNoReportsAlert} onOpenChange={setShowNoReportsAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sin Reportes para Mostrar</AlertDialogTitle>
            <AlertDialogDescription>
              No hay reportes con ubicación para mostrar con los filtros actuales en la vista de marcadores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoReportsAlert(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={map => { mapRef.current = map; }}
        onUnmount={() => { mapRef.current = null; }}
      >
        {/* Render Heatmap Layer if viewMode is 'heatmap' */}
        {viewMode === 'heatmap' && heatmapData.length > 0 && (
          <HeatmapLayerF
            data={heatmapData}
            options={{
              radius: 25,
              opacity: 0.7
            }}
          />
        )}

          {/* Render Markers if viewMode is 'markers' */}
          {viewMode === 'markers' && reportsWithCoords.map((report, idx) => {
            // Si hay solo un reporte y draggableMarker está activo, el marcador es arrastrable
            const isDraggable = reportsWithCoords.length === 1 && idx === 0 && !!(typeof draggableMarker !== 'undefined' && draggableMarker);
            return (
              <MarkerF
                key={report.id}
                position={{ lat: report.latitude!, lng: report.longitude! }}
                title={report.title}
                onClick={() => handleMarkerClick(report)}
                draggable={isDraggable}
                onDragEnd={isDraggable && typeof onMarkerDragEnd === 'function' ? (e) => {
                  const lat = e.latLng?.lat();
                  const lng = e.latLng?.lng();
                  if (lat && lng) onMarkerDragEnd({ lat, lng });
                } : undefined}
                // icon personalizado si quieres
              />
            );
          })}

        {/* InfoWindow for selected marker (only shown in 'markers' mode) */}
        {viewMode === 'markers' && selectedReport && (
          <InfoWindowF
            position={{ lat: selectedReport.latitude!, lng: selectedReport.longitude! }}
            onCloseClick={handleInfoWindowClose}
            options={{
              pixelOffset: new window.google.maps.Size(0, -35),
              maxWidth: 250,
            }}
          >
            <div className="p-1 space-y-1.5 max-w-xs">
              <h4 className="text-sm font-semibold mb-0.5 text-primary flex items-center gap-1.5">
                {selectedReport.reportType === 'incidente' ? (
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                ) : (
                  <UserCog className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
                {selectedReport.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">
                {selectedReport.description}
              </p>
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
    </>
  );
});

ReportsMap.displayName = 'ReportsMap';

export { ReportsMap };
export default ReportsMap;
