
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatLocation } from "@/lib/utils";
import { MapPin, AlertTriangle, Loader2, List, Map, Waves, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react'; 
import { ReportsMap, type ReportsMapRef } from '@/components/reports-map';
import type { Report } from '@/app/(app)/welcome/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type MapViewMode = 'markers' | 'heatmap';
type ReportTypeFilter = 'Todos' | 'Funcionario' | 'Incidente';

const DangerZonesPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('heatmap');
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTypeFilter>('Todos');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showNoReportsMapAlert, setShowNoReportsMapAlert] = useState(false);
  const mapRef = useRef<ReportsMapRef>(null);

   useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        try {
          console.log("Fetching all reports for danger zones map...");
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          const fetchedReports: Report[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAtDate = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();

            return {
              id: doc.id,
              userId: data.userId,
              userEmail: data.userEmail,
              reportType: data.reportType,
              title: data.title,
              description: data.description,
              location: data.location,
              mediaUrl: data.mediaUrl || null,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              createdAt: createdAtDate,
            } as Report;
          });
          console.log("Fetched reports for map:", fetchedReports.length);
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching reports for map: ", error);
        } finally {
           setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (reportTypeFilter === 'Todos') {
        return true;
      }
      if (reportTypeFilter === 'Funcionario') {
        return report.reportType === 'funcionario';
      }
      if (reportTypeFilter === 'Incidente') {
        return report.reportType === 'incidente';
      }
      return false;
    });
  }, [reports, reportTypeFilter]);

  // Function to zoom to a specific colonia
  const handleZoomToColonia = (colonia: string, index: number) => {
    // Find all reports for this colonia
    const coloniaReports = filteredReports.filter(report => {
      const parts = report.location.split(',').map(p => p.trim());
      const reportColonia = parts.length >= 2 ? parts[1] : (parts[0] || 'Desconocida');
      return reportColonia === colonia && report.latitude && report.longitude;
    });

    if (coloniaReports.length > 0) {
      // Get the first report's coordinates for this colonia
      const { latitude, longitude } = coloniaReports[0];
      if (latitude && longitude && window.google) {
        // Scroll to map
        document.getElementById('map-container')?.scrollIntoView({ behavior: 'smooth' });
        
        // Zoom to the location with a small delay to ensure the map is in view
        setTimeout(() => {
          const map = mapRef.current?.getMapInstance();
          if (map) {
            const center = new window.google.maps.LatLng(latitude, longitude);
            map.setCenter(center);
            map.setZoom(15 - Math.min(index, 2) * 2); // More zoom for higher ranks
          }
        }, 300);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && isClient && filteredReports.length === 0 && mapViewMode === 'markers') {
      setShowNoReportsMapAlert(true);
    } else {
      setShowNoReportsMapAlert(false);
    }
  }, [isLoading, isClient, filteredReports, mapViewMode]);

  const isReportTypeFilterActive = reportTypeFilter !== 'Todos';
  const isMapViewModeFilterActive = mapViewMode !== 'heatmap'; // Assuming heatmap is default

  const handleClearMobileFilters = () => {
    setReportTypeFilter('Todos');
    setMapViewMode('heatmap');
    setFilterModalOpen(false);
  };

  const topColonias = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((report) => {
      const parts = report.location.split(',').map(p => p.trim());
      let colonia = parts.length >= 2 ? parts[1] : (parts[0] || 'Desconocida');
      if (/^Lat: .+ Lon: .+$/.test(parts[0])) colonia = 'Coordenadas';
      if (colonia) { // Only count if we have a valid colonia name
        counts[colonia] = (counts[colonia] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .filter(([colonia]) => colonia !== 'Desconocida' && colonia !== 'Coordenadas');
  }, [filteredReports]);

  if (isLoading || !isClient) {
    return (
      <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <Skeleton className="h-8 w-2/3 sm:w-1/2" />
                 <div className="md:hidden">
                     <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
                 <div className="hidden md:flex">
                     <Skeleton className="h-12 w-96 rounded-full" />
                 </div>
             </div>
             <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                 <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                     <Skeleton className="h-6 w-1/2 mb-1" />
                     <Skeleton className="h-4 w-3/4" />
                 </CardHeader>
                 <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh] flex items-center justify-center">
                     <Skeleton className="h-full w-full" />
                 </CardContent>
             </Card>
             <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
                 <CardHeader>
                     <Skeleton className="h-6 w-1/3 mb-2" />
                     <Skeleton className="h-4 w-1/2" />
                 </CardHeader>
                 <CardContent className="space-y-3">
                     <Skeleton className="h-5 w-2/3" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-5 w-2/3" />
                     <Skeleton className="h-4 w-full" />
                 </CardContent>
             </Card>
         </div>
      </main>
    );
  }

  const mapCardTitle = `Mapa de ${mapViewMode === 'heatmap' ? 'Densidad de Reportes' : 'Reportes Individuales'} ${reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''}`;
  const mapCardDescription = `${mapViewMode === 'heatmap'
                           ? 'Visualización de densidad. Las zonas más cálidas indican una mayor concentración de reportes.'
                           : 'Ubicación de cada reporte individual en el mapa.'}
                         ${reportTypeFilter !== 'Todos' ? ` Filtrado por: ${reportTypeFilter}.` : ''}`;

  return (
    <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
      <AlertDialog open={showNoReportsMapAlert} onOpenChange={setShowNoReportsMapAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sin Reportes para Mostrar en el Mapa</AlertDialogTitle>
            <AlertDialogDescription>
              No hay reportes con ubicación para mostrar en el mapa con los filtros actuales en la vista de marcadores. Intenta cambiar los filtros o el modo de visualización a "Densidad".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoReportsMapAlert(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <div className="w-full max-w-7xl mx-auto space-y-6">

             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h1 className="text-2xl md:text-3xl font-semibold text-foreground flex items-center">
                     <AlertTriangle className="h-7 w-7 mr-2 text-destructive flex-shrink-0" />
                     Zonas de Riesgo <span className="text-primary font-bold md:ml-1.5">+SEGURO</span>
                 </h1>
                
                 <div className="md:hidden flex items-center justify-end w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "rounded-full p-3 shadow-sm border border-border",
                            (isReportTypeFilterActive || isMapViewModeFilterActive) && "border-primary text-primary bg-primary/5"
                        )}
                        onClick={() => setFilterModalOpen(true)}
                        aria-label="Filtrar Zonas"
                    >
                        <SlidersHorizontal className={cn("h-5 w-5", (isReportTypeFilterActive || isMapViewModeFilterActive) && "text-primary")} />
                    </Button>
                 </div>

                 <div className="hidden md:flex flex-row items-center gap-3 p-2 bg-card rounded-full shadow-md border border-border">
                    <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                    <span className="text-sm font-medium text-muted-foreground hidden md:inline">Filtrar:</span>
                    <Select
                        value={reportTypeFilter}
                        onValueChange={(value: ReportTypeFilter) => setReportTypeFilter(value)}
                    >
                        <SelectTrigger className={cn(
                            "w-auto h-9 rounded-full border-none bg-background shadow-sm px-4",
                            isReportTypeFilterActive && "bg-primary/10 text-primary border border-primary/30"
                        )}>
                            <SelectValue placeholder="Tipo de Reporte" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Todos">Todos los Tipos</SelectItem>
                            <SelectItem value="Funcionario">Funcionarios</SelectItem>
                            <SelectItem value="Incidente">Incidentes</SelectItem>
                        </SelectContent>
                    </Select>
                     <div className="flex items-center gap-1 bg-background p-0.5 rounded-full shadow-sm">
                         <Button
                             variant={mapViewMode === 'heatmap' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setMapViewMode('heatmap')}
                             className={cn(
                                "h-8 px-3 rounded-full text-xs flex items-center gap-1.5",
                                mapViewMode === 'heatmap' && "bg-primary text-primary-foreground hover:bg-primary/90"
                             )}
                             aria-pressed={mapViewMode === 'heatmap'}
                         >
                             <Waves size={14} /> Densidad
                         </Button>
                         <Button
                             variant={mapViewMode === 'markers' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setMapViewMode('markers')}
                              className={cn(
                                "h-8 px-3 rounded-full text-xs flex items-center gap-1.5",
                                mapViewMode === 'markers' && "bg-primary text-primary-foreground hover:bg-primary/90"
                             )}
                             aria-pressed={mapViewMode === 'markers'}
                         >
                             <MapPin size={14} /> Marcadores
                         </Button>
                     </div>
                 </div>
             </div>
            
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="p-0 max-w-sm w-full rounded-2xl">
                    <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                        <DialogTitle className="text-lg font-semibold">Filtrar Zonas</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 pb-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de Reporte</label>
                            <Select
                                value={reportTypeFilter}
                                onValueChange={(value: ReportTypeFilter) => setReportTypeFilter(value)}
                            >
                                <SelectTrigger className={cn(
                                    "h-10 rounded-full border-none bg-background shadow-sm px-4",
                                    isReportTypeFilterActive && "bg-primary/10 text-primary border border-primary/30"
                                )}>
                                    <SelectValue placeholder="Tipo de Reporte" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todos">Todos los Tipos</SelectItem>
                                    <SelectItem value="Funcionario">Funcionarios</SelectItem>
                                    <SelectItem value="Incidente">Incidentes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Vista del Mapa</label>
                            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                 <Button 
                                    variant={mapViewMode === 'heatmap' ? 'default' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setMapViewMode('heatmap')} 
                                    className={cn(
                                        "flex-1 h-10 rounded-md flex items-center gap-1.5",
                                        mapViewMode === 'heatmap' && "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        <Waves size={16}/>Densidad
                                 </Button>
                                 <Button 
                                    variant={mapViewMode === 'markers' ? 'default' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setMapViewMode('markers')} 
                                    className={cn(
                                        "flex-1 h-10 rounded-md flex items-center gap-1.5",
                                        mapViewMode === 'markers' && "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        <MapPin size={16}/>Marcadores
                                 </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="grid grid-cols-2 gap-2 px-4 pb-4 sm:flex sm:flex-row sm:justify-end sm:space-x-2">
                        <Button variant="ghost" className="w-full rounded-full flex items-center gap-2" onClick={handleClearMobileFilters}>
                            <RotateCcw className="h-4 w-4" /> Limpiar
                        </Button>
                        <Button className="w-full rounded-full" onClick={() => setFilterModalOpen(false)}>
                            Aplicar y Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1 min-w-0">
                 <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                   <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                     <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                       {mapViewMode === 'heatmap' ? (
                         <Waves className="h-5 w-5 mr-2 text-primary" />
                       ) : (
                         <Map className="h-5 w-5 mr-2 text-primary" />
                       )}
                       {mapCardTitle}
                     </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                       {mapCardDescription}
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh]">
                     <div id="map-container" className="w-full h-full rounded-lg overflow-hidden border border-border">
                       <ReportsMap 
                         ref={mapRef}
                         reports={filteredReports} 
                         viewMode={mapViewMode}
                       />
                     </div>
                   </CardContent>
                 </Card>
               </div>
               <div className="hidden md:block w-96 flex-shrink-0" style={{height: 'calc(60vh + 64px)'}}>
                 <Card className="h-full shadow-sm rounded-xl border border-border bg-card flex flex-col overflow-hidden">
                   <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                     <div className="flex items-center justify-between">
                       <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                         <MapPin className="h-5 w-5 text-primary" />
                         Top 5 Colonias
                       </CardTitle>
                       <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                         {filteredReports.length} reportes totales
                       </span>
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       Zonas con mayor actividad de reportes
                     </p>
                   </CardHeader>
                   <CardContent className="flex-1 flex flex-col p-0">
                     {topColonias.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                         <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                         <p className="text-muted-foreground text-sm">No hay suficientes datos para mostrar</p>
                         <p className="text-xs text-muted-foreground/70 mt-1">Los reportes aparecerán aquí</p>
                       </div>
                     ) : (
                       <div className="divide-y divide-border/50">
                         {(() => {
                           // Calculate max count once for all items
                           const maxCount = Math.max(...topColonias.map(([_, c]) => c as number));
                           const rankColors = [
                             'from-yellow-500 to-amber-400', // 1st
                             'from-slate-400 to-slate-300', // 2nd
                             'from-amber-600 to-amber-400', // 3rd
                             'from-slate-500 to-slate-400', // 4th
                             'from-slate-600 to-slate-500'  // 5th
                           ];
                           
                           return topColonias.map(([colonia, count], idx) => {
                             // Calculate percentage relative to the max count
                             const percentage = Math.round(((count as number) / maxCount) * 100);

                             return (
                               <div 
                                 key={colonia}
                                 className={cn(
                                   "group relative p-4 transition-all hover:bg-primary/5 cursor-pointer",
                                   "hover:pl-5 hover:pr-3"
                                 )}
                                 onClick={() => handleZoomToColonia(colonia, idx)}
                               >
                                 <div className="flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3 flex-1 min-w-0">
                                     <div className={cn(
                                       "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                       idx < 3 ? 'bg-gradient-to-br' : 'bg-slate-600',
                                       idx < 3 ? rankColors[idx] : ''
                                     )}>
                                       {idx + 1}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                       <h4 className="font-medium text-foreground line-clamp-1">
                                         {colonia}
                                       </h4>
                                       <div className="w-full mt-1.5">
                                         <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                           <div 
                                             className={cn(
                                               "h-full rounded-full transition-all duration-500",
                                               idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                                               idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                                               idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                               'bg-gradient-to-r from-slate-500 to-slate-400'
                                             )}
                                             style={{ width: `${percentage}%` }}
                                             title={`${count} ${count === 1 ? 'reporte' : 'reportes'}`}
                                           />
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                   <span className="text-sm font-medium text-muted-foreground whitespace-nowrap ml-2">
                                     {count} {count === 1 ? 'reporte' : 'reportes'}
                                   </span>
                                 </div>
                                 {idx === 0 && (
                                   <div className="mt-3 pt-3 border-t border-border/50">
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       className="w-full text-xs h-8 gap-1.5"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleZoomToColonia(colonia, idx);
                                       }}
                                     >
                                       <MapPin className="h-3.5 w-3.5" />
                                       Ver {colonia} en el mapa
                                     </Button>
                                   </div>
                                 )}
                               </div>
                             );
                           });
                         })()}
                       </div>
                     )}
                   </CardContent>
                   {topColonias.length > 0 && (
                     <CardFooter className="p-3 bg-muted/20 border-t border-border/50">
                       <p className="text-xs text-muted-foreground text-center">
                         Actualizado {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </CardFooter>
                   )}
                 </Card>
               </div>
             </div>

              <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
                 <CardHeader>
                     <CardTitle className="text-lg font-semibold flex items-center">
                         <List className="h-5 w-5 mr-2 text-primary"/> Lista de Reportes {reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''}
                     </CardTitle>
                     <CardDescription>Detalles de los últimos reportes recibidos {reportTypeFilter !== 'Todos' ? `filtrados por tipo "${reportTypeFilter}"` : ''}.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     {filteredReports.length > 0 ? (
                         <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                             {filteredReports.slice(0, 5).map(report => (
                                <Link key={report.id} href={`/reports/${report.id}`} className="block hover:bg-muted/50 p-3 rounded-lg transition-colors duration-150 border-b last:border-b-0">
                                 <li >
                                     <div className="flex justify-between items-center mb-1">
                                         <h4 className="font-medium text-foreground line-clamp-1">{report.title}</h4>
                                         <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                            {format(report.createdAt, "P", { locale: es })}
                                         </span>
                                     </div>
                                     <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                                     <p className="text-xs text-muted-foreground/70 mt-1 flex items-center">
                                         <MapPin size={12} className="mr-1" />
                                         {formatLocation(report.location)}
                                     </p>
                                 </li>
                                </Link>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-muted-foreground text-sm text-center py-4">
                             No hay reportes disponibles para mostrar {reportTypeFilter !== 'Todos' ? `del tipo "${reportTypeFilter}"` : ''}.
                         </p>
                     )}
                 </CardContent>
              </Card>
        </div>
        <footer className="mt-12 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
        </footer>
    </main>
  );
};

export default DangerZonesPage;
    
