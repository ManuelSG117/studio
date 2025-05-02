"use client";

import type { FC } from 'react';
import { MapPin } from 'lucide-react';

// Placeholder component for the Risk Map
export const RiskMap: FC = () => {
  // In a real implementation, this would use react-leaflet or another map library
  // to display actual risk data based on reports.
  return (
    <div className="h-full w-full bg-muted flex flex-col items-center justify-center text-muted-foreground border border-border rounded-lg">
      <MapPin className="h-16 w-16 mb-4 opacity-30" />
      <p className="text-lg font-medium">Mapa de Incidencias (Próximamente)</p>
      <p className="text-sm">Visualización de zonas de riesgo basada en reportes.</p>
    </div>
  );
};