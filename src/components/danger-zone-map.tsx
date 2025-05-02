
"use client";

import type { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet'; // Import Leaflet library

// Define the props for the component
interface DangerZoneMapProps {
  zones: {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
  }[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Fix for default Leaflet icon path issue with Next.js/Webpack
// You might need to install these icons or use a CDN
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for danger zones (optional)
// const dangerIcon = new L.Icon({
//     iconUrl: '/path/to/danger-icon.png', // Replace with your icon path
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
// });

const DangerZoneMap: FC<DangerZoneMapProps> = ({
    zones = [],
    initialCenter = [19.4326, -99.1332], // Default to Mexico City center
    initialZoom = 12, // Default zoom level
}) => {
    const position: LatLngExpression = initialCenter as LatLngExpression;

    return (
        <MapContainer
            center={position}
            zoom={initialZoom}
            scrollWheelZoom={true} // Enable scroll wheel zoom
            style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} // Inherit border radius
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

             {zones.map((zone) => (
                 <Marker
                     key={zone.id}
                     position={[zone.lat, zone.lng] as LatLngExpression}
                     // icon={dangerIcon} // Use custom icon if defined
                 >
                     <Popup>
                         <div className="font-sans"> {/* Ensure Tailwind fonts apply */}
                             <h3 className="text-base font-semibold mb-1 text-primary">{zone.title}</h3>
                             <p className="text-sm text-foreground">{zone.description}</p>
                         </div>
                     </Popup>
                     <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                         <span className="font-semibold">{zone.title}</span>
                     </Tooltip>
                 </Marker>
             ))}

             {/* TODO: Add other map features like heatmaps, clusters, user location marker if needed */}
             {/* Example: <HeatmapLayer points={...} /> */}
             {/* Example: <MarkerClusterGroup>...</MarkerClusterGroup> */}

        </MapContainer>
    );
};

export default DangerZoneMap;
