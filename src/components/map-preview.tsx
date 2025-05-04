
"use client";

import type { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet'; // Import Leaflet library

// Define the props for the component
interface MapPreviewProps {
  mapId: string; // Keep ID for potential future use, but not as key
  latitude: number;
  longitude: number;
  locationName?: string; // Optional name for the popup/tooltip
  zoom?: number;
}

// Fix for default Leaflet icon path issue (same as in danger-zone-map)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapPreview: FC<MapPreviewProps> = ({
    mapId, // Use the mapId
    latitude,
    longitude,
    locationName = "Ubicación del reporte",
    zoom = 14, // Default zoom level for preview
}) => {
    const position: LatLngExpression = [latitude, longitude];

    // Basic check for valid coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
        return (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-destructive text-sm border border-destructive/50 h-[250px]">
                Coordenadas inválidas.
            </div>
        );
    }

    return (
        <MapContainer
            // key={mapId} // Removed key from here, dynamic import handles uniqueness
            center={position}
            zoom={zoom}
            scrollWheelZoom={false} // Disable zoom for preview usually
            dragging={false} // Disable dragging
            zoomControl={false} // Hide zoom controls
            style={{ height: '250px', width: '100%', borderRadius: '0.5rem' }} // Fixed height, rounded corners
            className="cursor-default" // Indicate non-interactive map
            placeholder={ // Add placeholder for better loading experience
                <div className="h-[250px] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm border border-border">
                    Cargando mapa...
                 </div>
             }
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
                <Popup>
                     <span className="font-sans font-medium">{locationName}</span>
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default MapPreview;
