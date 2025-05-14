

"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Loader2, List, Map, Waves, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react'; // Added SlidersHorizontal, RotateCcw
import { ReportsMap } from '@/components/reports-map';
import type { Report } from '@/app/(app)/welcome/page';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn, formatLocation } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Import Dialog components

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
  const [filterModalOpen, setFilterModalOpen] = useState(false); // State for mobile filter modal

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

  const isReportTypeFilterActive = reportTypeFilter !== 'Todos';

  const handleClearMobileFilters = () => {
    setReportTypeFilter('Todos');
    setMapViewMode('heatmap'); // Optionally reset map view mode or keep current
    setFilterModalOpen(false);
  };

  if (isLoading || !isClient) {
    return (
      <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-6"> {/* Increased max-width */}
            {/* Header Skeleton */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <Skeleton className="h-8 w-2/3 sm:w-1/2" />
                 <div className="md:hidden">
                     <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
                 <div className="hidden md:flex">
                     <Skeleton className="h-12 w-96 rounded-full" />
                 </div>
             </div>
             {/* Map Card Skeleton */}
             <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                 <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                     <Skeleton className="h-6 w-1/2 mb-1" />
                     <Skeleton className="h-4 w-3/4" />
                 </CardHeader>
                 <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh] flex items-center justify-center">
                     <Skeleton className="h-full w-full" />
                 </CardContent>
             </Card>
             {/* List Card Skeleton */}
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

  const mapCardTitle = `Mapa de ${mapViewMode === 'heatmap' ? 'Densidad' : 'Reportes Individuales'} ${reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''}`;
  const mapCardDescription = `${mapViewMode === 'heatmap'
                           ? 'Visualización de densidad. Zonas más cálidas indican mayor concentración.'
                           : 'Ubicación de cada reporte individual.'}
                         ${reportTypeFilter !== 'Todos' ? ` Filtrado por: ${reportTypeFilter}.` : ''}`;

  return (
    <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
        <div className="w-full max-w-7xl mx-auto space-y-6"> {/* Increased max-width */}

             {/* Header with Title and Unified Filters */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h1 className="text-2xl md:text-3xl font-semibold text-foreground flex items-center">
                     <AlertTriangle className="h-7 w-7 mr-2 text-destructive flex-shrink-0" />
                     Zonas de Riesgo <span className="text-primary font-bold md:ml-1.5">+SEGURO</span>
                 </h1>
                
                 {/* Mobile: Filter Button */}
                 <div className="md:hidden flex items-center justify-end w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "rounded-full p-3 shadow-sm border border-border",
                            isReportTypeFilterActive && "border-primary text-primary bg-primary/5"
                        )}
                        onClick={() => setFilterModalOpen(true)}
                        aria-label="Filtrar Zonas"
                    >
                        <SlidersHorizontal className={cn("h-5 w-5", isReportTypeFilterActive && "text-primary")} />
                    </Button>
                 </div>

                 {/* Desktop: Inline Filters */}
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
                    {/* View Mode Toggle Buttons */}
                     <div className="flex items-center gap-1 bg-background p-0.5 rounded-full shadow-sm">
                         <Button
                             variant={mapViewMode === 'heatmap' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setMapViewMode('heatmap')}
                             className="h-8 px-3 rounded-full text-xs flex items-center gap-1.5"
                             aria-pressed={mapViewMode === 'heatmap'}
                         >
                             <Waves size={14} /> Densidad
                         </Button>
                         <Button
                             variant={mapViewMode === 'markers' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setMapViewMode('markers')}
                             className="h-8 px-3 rounded-full text-xs flex items-center gap-1.5"
                             aria-pressed={mapViewMode === 'markers'}
                         >
                             <MapPin size={14} /> Marcadores
                         </Button>
                     </div>
                 </div>
             </div>
            
            {/* Mobile: Filter Modal */}
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
                                 <Button variant={mapViewMode === 'heatmap' ? 'default' : 'ghost'} size="sm" onClick={() => setMapViewMode('heatmap')} className="flex-1 h-10 rounded-md flex items-center gap-1.5"><Waves size={16}/>Densidad</Button>
                                 <Button variant={mapViewMode === 'markers' ? 'default' : 'ghost'} size="sm" onClick={() => setMapViewMode('markers')} className="flex-1 h-10 rounded-md flex items-center gap-1.5"><MapPin size={16}/>Marcadores</Button>
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


             {/* Map Card */}
             <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card">
                <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                         {mapViewMode === 'heatmap' ? (
                            <Waves className="h-5 w-5 mr-2 text-primary"/>
                         ) : (
                            <Map className="h-5 w-5 mr-2 text-primary"/>
                         )}
                        {mapCardTitle}
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                          {mapCardDescription}
                     </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-0 h-[50vh] sm:h-[60vh]">
                     {isClient && (
                        <ReportsMap
                            reports={filteredReports}
                            viewMode={mapViewMode}
                            defaultZoom={13}
                         />
                     )}
                </CardContent>
            </Card>

              {/* Report List Card */}
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
                             {filteredReports.map(report => (
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
         {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
        </footer>
    </main>
  );
};

export default DangerZonesPage;
    



    