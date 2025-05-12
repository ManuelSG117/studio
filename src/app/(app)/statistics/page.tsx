
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon, Loader2, CalendarRange, Hash, TrendingUp, AlertTriangle, UserCog, Filter, MapPin, TrendingDown, CalendarCheck, List, ThumbsDown, AtSign, CheckCircle, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { Report } from '@/app/(app)/welcome/page';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  getMonth,
  getYear,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  getWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getDate,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";

type FilterPeriod = 'day' | 'week' | 'month';
type ReportTypeFilter = 'Todos' | 'Funcionario' | 'Incidente';

interface ChartDataPoint {
    period: string;
    count: number;
    incidentCount: number;
    officerCount: number;
}


const StatisticsPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTypeFilter>('Todos');
  const [totalReports, setTotalReports] = useState<number>(0);
  const [averageReports, setAverageReports] = useState<number>(0);
  const [mostActiveDay, setMostActiveDay] = useState<string | null>(null);
  const [officerReportsCount, setOfficerReportsCount] = useState<number>(0);
  const [incidentReportsCount, setIncidentReportsCount] = useState<number>(0); 
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        try {
          console.log("Fetching all reports for statistics...");
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, orderBy("createdAt", "asc")); 
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
              upvotes: data.upvotes || 0,
              downvotes: data.downvotes || 0,
            } as Report;
          });
          console.log("Fetched reports for statistics:", fetchedReports.length);
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching reports for statistics: ", error);
        } finally {
           setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const processReportsForChart = useCallback((period: FilterPeriod, typeFilter: ReportTypeFilter) => {
    const filteredReportsForCards = reports.filter(report =>
        typeFilter === 'Todos' ||
        (typeFilter === 'Funcionario' && report.reportType === 'funcionario') ||
        (typeFilter === 'Incidente' && report.reportType === 'incidente')
    );

    setTotalReports(filteredReportsForCards.length);
    const currentOfficerReports = reports.filter(r => r.reportType === 'funcionario').length;
    const currentIncidentReports = reports.filter(r => r.reportType === 'incidente').length;
    setOfficerReportsCount(currentOfficerReports);
    setIncidentReportsCount(currentIncidentReports);


    if (reports.length === 0) {
      setChartData([]);
      setAverageReports(0);
      setMostActiveDay(null);
      return;
    }

    const reportsByPeriod: Record<string, { total: number, incident: number, officer: number }> = {};
    const firstReportDate = reports[0].createdAt;
    const lastReportDate = reports[reports.length - 1].createdAt;

    let interval: Interval;
    let allPeriodsInInterval: Date[];
    let formatKey: (date: Date) => string;
    let numberOfPeriods: number;
    let dayOfWeekCounter: Record<string, number> = {};

    switch (period) {
      case 'day':
        interval = { start: startOfDay(firstReportDate), end: endOfDay(lastReportDate) };
        allPeriodsInInterval = eachDayOfInterval(interval);
        formatKey = (date) => format(date, 'yyyy-MM-dd');
        numberOfPeriods = differenceInDays(interval.end, interval.start) + 1;
        break;
      case 'week':
        interval = { start: startOfWeek(firstReportDate, { locale: es }), end: endOfWeek(lastReportDate, { locale: es }) };
        allPeriodsInInterval = eachWeekOfInterval(interval, { locale: es });
        formatKey = (date) => format(date, 'RRRR-II', { locale: es }); 
        numberOfPeriods = differenceInWeeks(interval.end, interval.start, { locale: es }) + 1;
        break;
      case 'month':
      default:
        interval = { start: startOfMonth(firstReportDate), end: endOfMonth(lastReportDate) };
        allPeriodsInInterval = eachMonthOfInterval(interval);
        formatKey = (date) => format(date, 'yyyy-MM');
        numberOfPeriods = differenceInMonths(interval.end, interval.start) + 1;
        break;
    }

    allPeriodsInInterval.forEach(periodDate => {
        const periodKey = formatKey(periodDate);
        reportsByPeriod[periodKey] = { total: 0, incident: 0, officer: 0 };
    });

    reports.forEach(report => {
       const periodKey = formatKey(report.createdAt);
       if (reportsByPeriod[periodKey]) {
          reportsByPeriod[periodKey].total++; 
            if (report.reportType === 'incidente') {
              reportsByPeriod[periodKey].incident++;
            } else if (report.reportType === 'funcionario') {
              reportsByPeriod[periodKey].officer++;
            }
       }
       const dayName = format(report.createdAt, 'EEEE', { locale: es });
       dayOfWeekCounter[dayName] = (dayOfWeekCounter[dayName] || 0) + 1;
    });

    let maxCount = 0;
    let activeDay = null;
    for (const [day, count] of Object.entries(dayOfWeekCounter)) {
        if (count > maxCount) {
            maxCount = count;
            activeDay = day;
        }
    }
    setMostActiveDay(activeDay ? activeDay.charAt(0).toUpperCase() + activeDay.slice(1) : 'N/A');

    const formattedChartData: ChartDataPoint[] = Object.entries(reportsByPeriod)
       .map(([period, counts]) => ({
            period,
            count: counts.total, 
            incidentCount: counts.incident,
            officerCount: counts.officer
        }))
       .sort((a, b) => a.period.localeCompare(b.period)); 

    setChartData(formattedChartData);

    const totalForAverage = filteredReportsForCards.length;
    const avg = numberOfPeriods > 0 ? totalForAverage / numberOfPeriods : 0;
    setAverageReports(avg);

  }, [reports]);

  useEffect(() => {
    processReportsForChart(filterPeriod, reportTypeFilter);
  }, [reports, filterPeriod, reportTypeFilter, processReportsForChart]);

  const averageLabel = useMemo(() => {
     switch(filterPeriod) {
        case 'day': return 'Promedio Diario';
        case 'week': return 'Promedio Semanal';
        case 'month': return 'Promedio Mensual';
        default: return 'Promedio';
     }
  }, [filterPeriod]);

  const chartConfig = {
    incidentCount: { 
      label: "Incidentes",
      color: "hsl(var(--primary))", 
    },
    officerCount: { 
      label: "Funcionarios",
      color: "hsl(var(--destructive))", 
    },
  } satisfies ChartConfig;

  const formatXAxisTick = (value: string) => {
    try {
        if (typeof value !== 'string') return String(value);

        switch (filterPeriod) {
          case 'day':
            return format(parseISO(value), 'dd MMM', { locale: es });
          case 'week':
            const partsW = value.split(/-W?/)
            if (partsW.length === 2) {
                return `Sem ${partsW[1]}, '${partsW[0].substring(2)}`;
            }
            return value; 
          case 'month':
          default:
             const dateM = parseISO(value + '-01'); 
            return format(dateM, 'MMM yy', { locale: es });
        }
    } catch (e) {
        console.warn("Error formatting X-axis tick:", value, e);
        return value; 
    }
  };

    const formatTooltipLabel = (label: string) => {
        try {
            if (typeof label !== 'string') return String(label);
            switch (filterPeriod) {
                case 'day':
                    return format(parseISO(label), 'PPP', { locale: es });
                 case 'week':
                    const partsW = label.split(/-W?/);
                    if (partsW.length === 2) {
                        const yearW = parseInt(partsW[0]);
                        const weekNum = parseInt(partsW[1]);
                        const firstDayOfYear = new Date(yearW, 0, 1);
                        const daysOffset = (weekNum - 1) * 7;
                        const approxWeekStart = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset));
                        const weekStartDate = startOfWeek(approxWeekStart, { locale: es, weekStartsOn: 1 }); 
                        const weekEndDate = endOfWeek(approxWeekStart, { locale: es, weekStartsOn: 1 });
                        return `Semana ${weekNum} (${format(weekStartDate, 'd MMM', { locale: es })} - ${format(weekEndDate, 'd MMM yyyy', { locale: es })})`;
                    }
                    return label;
                case 'month':
                default:
                    return format(parseISO(label + '-01'), 'MMMM yyyy', { locale: es });
            }
        } catch (e) {
            console.warn("Error formatting tooltip label:", label, e);
            return label;
        }
    };

  if (isLoading) {
    return (
      <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-row justify-between items-center mb-2 gap-2"> {/* Changed to flex-row and items-center */}
                <div className="space-y-1"> 
                    <Skeleton className="h-8 w-64" />
                </div>
                 <div className="flex flex-wrap justify-end gap-2 w-auto">  {/* Removed w-full for desktop */}
                     <Skeleton className="h-9 w-36 rounded-md" /> 
                 </div>
            </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                 {[...Array(4)].map((_, i) => (
                     <Card key={i} className="bg-card rounded-lg">
                         <CardHeader className="pb-2 pt-3 sm:pt-4 px-3 sm:px-4 flex flex-row items-center justify-between space-y-0">
                              <Skeleton className="h-4 w-20 sm:w-24" />
                              <Skeleton className="h-5 w-5" />
                         </CardHeader>
                         <CardContent className="pt-1 pb-3 sm:pb-4 px-3 sm:px-4">
                             <Skeleton className="h-7 sm:h-8 w-12 sm:w-16 mb-1" />
                             <Skeleton className="h-3 w-16 sm:w-20 mt-1" />
                         </CardContent>
                     </Card>
                 ))}
            </div>
            <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
               <CardHeader>
                   <Skeleton className="h-6 w-1/3 mb-2" />
                   <Skeleton className="h-4 w-1/2" />
               </CardHeader>
               <CardContent className="h-[350px] sm:h-[450px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
               </CardContent>
            </Card>
         </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-8">
              <div className="flex flex-row justify-between items-center mb-6 gap-4"> {/* Main header row */}
                 
                  {/* Title Section */}
                  <h1 className="text-2xl md:text-3xl font-semibold text-foreground flex items-center">
                      <span className="hidden md:inline">Dashboard de Estadísticas </span> {/* Hidden on mobile */}
                      <span className="text-primary font-bold md:ml-1.5">+SEGURO</span>
                  </h1>
                 
                  {/* Filter Section */}
                  <div className="w-auto"> {/* Ensure filter section doesn't take full width on mobile */}
                        <div className="md:hidden flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full p-3 shadow-sm border border-border"
                                onClick={() => setFilterModalOpen(true)}
                                aria-label="Filtrar Estadísticas"
                            >
                                <SlidersHorizontal className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="hidden md:flex flex-row items-center gap-3 p-2 bg-card rounded-full shadow-md border border-border">
                            <span className="text-sm font-medium text-muted-foreground pl-2 pr-1 hidden md:inline">Filtrar por:</span>
                            <Select value={reportTypeFilter} onValueChange={(value) => setReportTypeFilter(value as ReportTypeFilter)}>
                                <SelectTrigger className="w-full md:w-[180px] h-9 rounded-full border-none bg-background shadow-sm px-4">
                                <SelectValue placeholder="Tipo de Reporte" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="Todos">Todos los Tipos</SelectItem>
                                <SelectItem value="Incidente">Incidentes</SelectItem>
                                <SelectItem value="Funcionario">Funcionarios</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
                                <SelectTrigger className="w-full md:w-[140px] h-9 rounded-full border-none bg-background shadow-sm px-4">
                                <SelectValue placeholder="Periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="day">Día</SelectItem>
                                <SelectItem value="week">Semana</SelectItem>
                                <SelectItem value="month">Mes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                            <DialogContent className="p-0 max-w-sm w-full rounded-2xl">
                            <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                                <DialogTitle className="text-lg font-semibold">Filtrar Estadísticas</DialogTitle>
                            </DialogHeader>
                            <div className="px-4 pb-4 space-y-4">
                                <div>
                                <label className="block text-xs font-medium mb-1">Tipo de Reporte</label>
                                <Select value={reportTypeFilter} onValueChange={(value) => setReportTypeFilter(value as ReportTypeFilter)}>
                                    <SelectTrigger className="h-10 rounded-full border-none bg-background shadow-sm px-4">
                                    <SelectValue placeholder="Tipo de Reporte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Todos">Todos los Tipos</SelectItem>
                                    <SelectItem value="Incidente">Incidentes</SelectItem>
                                    <SelectItem value="Funcionario">Funcionarios</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                                <div>
                                <label className="block text-xs font-medium mb-1">Periodo</label>
                                <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
                                    <SelectTrigger className="h-10 rounded-full border-none bg-background shadow-sm px-4">
                                    <SelectValue placeholder="Periodo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="day">Día</SelectItem>
                                    <SelectItem value="week">Semana</SelectItem>
                                    <SelectItem value="month">Mes</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>
                            <DialogFooter className="px-4 pb-4">
                                <Button className="w-full rounded-full" onClick={() => setFilterModalOpen(false)}>
                                Aplicar filtros
                                </Button>
                            </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                 <Card className="p-3 flex flex-col justify-between bg-green-50 border-green-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-xs text-green-700 font-medium flex items-center">
                            <List className="h-3.5 w-3.5 mr-1.5"/>Total Reportes ({reportTypeFilter})
                         </p>
                         <AnimatedNumber value={totalReports} className="text-2xl sm:text-3xl font-bold text-green-700 block mt-0.5"/>
                     </div>
                     <p className="text-xs text-green-500 mt-1 flex items-center">
                         <TrendingUp className="h-3 w-3 mr-0.5"/> {averageReports.toFixed(1)} {averageLabel}
                     </p>
                 </Card>
                
                 <Card className="p-3 flex flex-col justify-between bg-red-50 border-red-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-xs text-red-600 font-medium flex items-center">
                            <UserCog className="h-3.5 w-3.5 mr-1.5"/>Reportes Funcionarios
                         </p>
                         <AnimatedNumber value={officerReportsCount} className="text-2xl sm:text-3xl font-bold text-red-700 block mt-0.5"/>
                     </div>
                     <p className="text-xs text-red-500 mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5"/> +2% este mes
                     </p>
                 </Card>

                 <Card className="p-3 flex flex-col justify-between bg-blue-50 border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-xs text-blue-600 font-medium flex items-center">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5"/>Incidentes Reportados
                         </p>
                         <AnimatedNumber value={incidentReportsCount} className="text-2xl sm:text-3xl font-bold text-blue-700 block mt-0.5"/>
                     </div>
                     <p className="text-xs text-blue-500 mt-1 flex items-center">
                         <TrendingDown className="h-3 w-3 mr-0.5"/> {mostActiveDay} día más común
                     </p>
                 </Card>
                
                 <Card className="p-3 flex flex-col justify-between bg-orange-50 border-orange-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs text-orange-700 font-medium flex items-center">
                           <MapPin className="h-3.5 w-3.5 mr-1.5"/>Zona Más Peligrosa
                        </p>
                        <div className="text-xl sm:text-2xl font-bold text-orange-800 block mt-0.5 truncate">Col. Centro</div> {/* Placeholder */}
                    </div>
                    <p className="text-xs text-orange-600 mt-1 flex items-center">
                       <AlertTriangle className="h-3 w-3 mr-0.5"/> Riesgo Elevado
                    </p>
                </Card>
             </div>

             <Card className="w-full shadow-lg rounded-xl border border-border bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 sm:p-5 border-b border-border/50 flex flex-row items-center justify-between">
                     <div>
                         <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <CalendarRange className="h-5 w-5 text-primary" /> Tendencia de Reportes {reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''} por {filterPeriod === 'day' ? 'Día' : filterPeriod === 'week' ? 'Semana' : 'Mes'}
                         </CardTitle>
                         <CardDescription className="text-sm mt-1 text-muted-foreground hidden md:block"> {/* Hide on mobile */}
                           Número de reportes registrados en el periodo seleccionado.
                         </CardDescription>
                     </div>
                 </CardHeader>
                  <CardContent className="p-2 sm:p-4 md:p-6">
                     {chartData.length > 1 ? (
                         <ChartContainer config={chartConfig} className="h-[350px] sm:h-[450px] w-full">
                            <AreaChart
                                data={chartData}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 5,
                                  bottom: 30,
                                }}
                            >
                                <defs>
                                     <linearGradient id="fillIncident" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                     </linearGradient>
                                     <linearGradient id="fillOfficer" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.7}/>
                                         <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                                     </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.6)"/>
                                <XAxis
                                   dataKey="period"
                                   tickLine={false}
                                   axisLine={false}
                                   tickMargin={10}
                                   tickFormatter={formatXAxisTick}
                                   interval={chartData.length > 10 ? Math.floor(chartData.length / 10) : 0}
                                   angle={filterPeriod === 'day' && chartData.length > 7 ? -45 : 0}
                                   textAnchor={filterPeriod === 'day' && chartData.length > 7 ? 'end' : 'middle'}
                                   height={filterPeriod === 'day' && chartData.length > 7 ? 60 : 40}
                                   className="text-xs fill-muted-foreground"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    allowDecimals={false}
                                    width={30}
                                    className="text-xs fill-muted-foreground"
                                />
                                <ChartTooltip
                                    cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                                    content={<ChartTooltipContent indicator="dot" labelFormatter={formatTooltipLabel} />}
                                />
                                <Area
                                   dataKey="incidentCount"
                                   type="monotone"
                                   fill="url(#fillIncident)"
                                   stroke="hsl(var(--primary))" 
                                   stackId="a" 
                                   name={chartConfig.incidentCount.label}
                                   strokeWidth={2}
                                   dot={chartData.length < 30}
                                 />
                                 <Area
                                   dataKey="officerCount"
                                   type="monotone"
                                   fill="url(#fillOfficer)"
                                   stroke="hsl(var(--destructive))" 
                                   stackId="b" 
                                   name={chartConfig.officerCount.label}
                                   strokeWidth={2}
                                   dot={chartData.length < 30}
                                 />
                            </AreaChart>
                        </ChartContainer>
                     ) : (
                          <div className="h-[350px] sm:h-[450px] flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-lg border border-dashed border-border">
                             <LineChartIcon className="h-16 w-16 text-muted-foreground opacity-40 mb-5" />
                             <p className="text-lg font-semibold text-muted-foreground mb-2">
                                 {isLoading ? "Calculando datos..." : `No hay suficientes datos ${reportTypeFilter !== 'Todos' ? `de tipo "${reportTypeFilter}"` : ''} para mostrar la tendencia.`}
                             </p>
                               <p className="text-sm text-muted-foreground/80">Intenta ajustar los filtros o espera a que se registren más reportes.</p>
                         </div>
                     )}
                 </CardContent>
             </Card>
        </div>
    </main>
  );
};

export default StatisticsPage;

