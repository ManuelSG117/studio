
"use client";

import type { FC } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'; // Use MarkerF for functional components
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapPreviewProps {
  lat: number;
  lng: number;
  zoom?: number;
}

// Note: Storing the API key directly in the code is not recommended for production.
// Consider using environment variables.
const GOOGLE_MAPS_API_KEY = "AIzaSyDtuGQXVRNzK0N7_5R5iMFLuRMPxCFG5cs"; // User provided key

const MapPreview: FC<MapPreviewProps> = ({ lat, lng, zoom = 15 }) => {
  const { toast } = useToast();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["maps"], // Specify libraries if needed, e.g., ["places"]
  });

  const containerStyle = {
    width: '100%',
    height: '100%', // Take full height of the parent container
    borderRadius: '0.5rem', // Match card rounding
  };

  const center = {
    lat: lat,
    lng: lng,
  };

  const mapOptions = {
    disableDefaultUI: true, // Hide default controls like zoom, street view
    zoomControl: true, // Optionally enable zoom control
    clickableIcons: false, // Disable clicking on default map POIs
    // Add more styling options if needed: https://developers.google.com/maps/documentation/javascript/styling
    // styles: [ ... ]
  };

  if (loadError) {
     console.error("Error loading Google Maps:", loadError);
     toast({
       variant: "destructive",
       title: "Error de Mapa",
       description: "No se pudo cargar el mapa. Verifica la configuración de la API Key.",
     });
    return (
      <div className="h-48 w-full bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Error al cargar el mapa</p>
        <p className="text-xs text-destructive/80">Inténtalo de nuevo más tarde.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <Skeleton className="h-48 w-full rounded-lg flex flex-col items-center justify-center">
         <MapPin className="h-8 w-8 text-muted-foreground opacity-50 mb-2 animate-pulse" />
         <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </Skeleton>
    );
  }

  return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        // Optional: Add onLoad and onUnmount handlers if needed
        // onLoad={map => console.log('Map Loaded:', map)}
        // onUnmount={map => console.log('Map Unmounted:', map)}
      >
        {/* Add a marker at the report location */}
        <MarkerF position={center} title="Ubicación del Reporte" />
      </GoogleMap>
  );
};

export default MapPreview;
