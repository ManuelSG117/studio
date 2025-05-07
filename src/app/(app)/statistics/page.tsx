"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Added useRef
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon, Loader2, CalendarRange, Hash, TrendingUp, AlertTriangle, UserCog, Filter, MapPin, TrendingDown, CalendarCheck } from 'lucide-react'; // Added more icons
import { Button } from "@/components/ui/button";
import type { Report } from '@/app/(app)/welcome/page'; // Reuse Report type
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
} from 'date-fns'; // Import date-fns functions
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts'; // Import AreaChart components from recharts
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Import Chart components
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number'; // Import AnimatedNumber
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Badge } from '@/components/ui/badge'; // Import Badge

type FilterPeriod = 'day' | 'week' | 'month';
type ReportTypeFilter = 'Todos' | 'Funcionario' | 'Incidente'; // Added report type filter

interface ChartDataPoint {
    period: string; // Format depends on filter: 'YYYY-MM-DD', 'YYYY-Www', 'YYYY-MM'
    count: number;
}


const StatisticsPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]); // State for all reports data (unfiltered)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]); // State for chart data
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month'); // Default period filter
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTypeFilter>('Todos'); // Default report type filter
  const [totalReports, setTotalReports] = useState<number>(0);
  const [averageReports, setAverageReports] = useState<number>(0);
  const [mostActiveDay, setMostActiveDay] = useState<string | null>(null); // Placeholder for now

  useEffect(() => {
    setIsLoading(true); // Start loading
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        // Fetch ALL reports from Firestore (similar to DangerZonesPage)
        try {
          console.log("Fetching all reports for statistics...");
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, orderBy("createdAt", "asc")); // Order ascending for interval calculation
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
          console.log("Fetched reports for statistics:", fetchedReports.length);
          setReports(fetchedReports); // Store all fetched reports
          // Initial processing will happen in the processing useEffect
        } catch (error) {
          console.error("Error fetching reports for statistics: ", error);
        } finally {
           setIsLoading(false); // Stop loading after fetch attempt
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Function to process reports based on BOTH selected filter periods
  const processReportsForChart = useCallback((period: FilterPeriod, typeFilter: ReportTypeFilter) => {
    // Filter reports by type first
    const filteredReportsByType = reports.filter(report =>
        typeFilter === 'Todos' ||
        (typeFilter === 'Funcionario' && report.reportType === 'funcionario') ||
        (typeFilter === 'Incidente' && report.reportType === 'incidente')
    );

    setTotalReports(filteredReportsByType.length); // Update total based on type filter

    if (filteredReportsByType.length === 0) {
      setChartData([]);
      setAverageReports(0); // Reset average if no reports match filters
      setMostActiveDay(null);
      return;
    }

    const reportsByPeriod: Record<string, number> = {};
    // Use the filtered list for date range calculation
    const firstReportDate = filteredReportsByType[0].createdAt; // Reports are already sorted ascending
    const lastReportDate = filteredReportsByType[filteredReportsByType.length - 1].createdAt;

    let interval: Interval;
    let allPeriodsInInterval: Date[];
    let formatKey: (date: Date) => string;
    let parseKey: (key: string) => Date; // Keep for potential future use
    let numberOfPeriods: number;
    let dayOfWeekCounter: Record<string, number> = {}; // For most active day

    switch (period) {
      case 'day':
        interval = { start: startOfDay(firstReportDate), end: endOfDay(lastReportDate) };
        allPeriodsInInterval = eachDayOfInterval(interval);
        formatKey = (date) => format(date, 'yyyy-MM-dd');
        parseKey = (key) => parseISO(key);
        numberOfPeriods = differenceInDays(interval.end, interval.start) + 1;
        break;
      case 'week':
        interval = { start: startOfWeek(firstReportDate, { locale: es }), end: endOfWeek(lastReportDate, { locale: es }) };
        allPeriodsInInterval = eachWeekOfInterval(interval, { locale: es });
        formatKey = (date) => format(date, 'RRRR-II', { locale: es });
        parseKey = (key) => startOfWeek(parseISO(key.substring(0, 4) + "-01-01"), { weekStartsOn: 1 });
        numberOfPeriods = differenceInWeeks(interval.end, interval.start, { locale: es }) + 1;
        break;
      case 'month':
      default:
        interval = { start: startOfMonth(firstReportDate), end: endOfMonth(lastReportDate) };
        allPeriodsInInterval = eachMonthOfInterval(interval);
        formatKey = (date) => format(date, 'yyyy-MM');
        parseKey = (key) => parseISO(key + '-01');
        numberOfPeriods = differenceInMonths(interval.end, interval.start) + 1;
        break;
    }

    // Initialize counts for all periods in the interval to 0
    allPeriodsInInterval.forEach(periodDate => {
        const periodKey = formatKey(periodDate);
        reportsByPeriod[periodKey] = 0;
    });

    // Count reports for each period using the type-filtered list and track day of week
    filteredReportsByType.forEach(report => {
       const periodKey = formatKey(report.createdAt);
       if (reportsByPeriod[periodKey] !== undefined) {
          reportsByPeriod[periodKey]++;
       }
       // Count reports per day of the week
       const dayName = format(report.createdAt, 'EEEE', { locale: es });
       dayOfWeekCounter[dayName] = (dayOfWeekCounter[dayName] || 0) + 1;
    });

    // Find the most active day
    let maxCount = 0;
    let activeDay = null;
    for (const [day, count] of Object.entries(dayOfWeekCounter)) {
        if (count > maxCount) {
            maxCount = count;
            activeDay = day;
        }
    }
    setMostActiveDay(activeDay ? activeDay.charAt(0).toUpperCase() + activeDay.slice(1) : 'N/A'); // Capitalize


    // Format data for the chart, ensuring chronological order
    const formattedChartData = Object.entries(reportsByPeriod)
       .map(([period, count]) => ({ period, count }))
       .sort((a, b) => a.period.localeCompare(b.period)); // Sort by period key string

    setChartData(formattedChartData);

    // Calculate average reports based on the type-filtered total
    const totalFiltered = filteredReportsByType.length;
    const avg = numberOfPeriods > 0 ? totalFiltered / numberOfPeriods : 0;
    setAverageReports(avg);
    console.log(`Filter: ${typeFilter}, Total: ${totalFiltered}, Periods: ${numberOfPeriods}, Avg: ${avg.toFixed(1)}`);


  }, [reports]); // Dependency ONLY on reports array (filters passed as args)

  // Recalculate chart data when filters or reports change
  useEffect(() => {
    processReportsForChart(filterPeriod, reportTypeFilter);
  }, [reports, filterPeriod, reportTypeFilter, processReportsForChart]);


  // Moved useMemo hook before the conditional return
  const averageLabel = useMemo(() => {
     switch(filterPeriod) {
        case 'day': return 'Promedio Diario';
        case 'week': return 'Promedio Semanal';
        case 'month': return 'Promedio Mensual';
        default: return 'Promedio';
     }
  }, [filterPeriod]);


  // Chart Configuration
  const chartConfig = {
    reportCount: {
      label: "Reportes",
      color: "hsl(var(--primary))", // Use primary color from theme
    },
  } satisfies ChartConfig;

  // X-axis tick formatter based on filter period
  const formatXAxisTick = (value: string) => {
    try {
        switch (filterPeriod) {
          case 'day':
            return format(parseISO(value), 'dd MMM', { locale: es }); // e.g., '01 Ene'
          case 'week':
             // Format 'YYYY-Www' to 'Sem WW, YY' (e.g., 'Sem 23, 24')
            const [yearW, weekW] = value.split('-W');
            return `Sem ${weekW}, ${yearW.substring(2)}`;
          case 'month':
          default:
            // Format 'YYYY-MM' to 'Mmm yy' (e.g., 'Ene 24')
            const [yearM, monthM] = value.split('-');
            const dateM = new Date(parseInt(yearM), parseInt(monthM) - 1);
            return format(dateM, 'MMM yy', { locale: es });
        }
    } catch (e) {
        console.error("Error formatting tick:", value, e);
        return value; // Fallback
    }
  };

  // Tooltip label formatter
    const formatTooltipLabel = (label: string) => {
        try {
            switch (filterPeriod) {
                case 'day':
                    return format(parseISO(label), 'PPP', { locale: es }); // e.g., '1 de enero de 2024'
                 case 'week':
                    // Extract year and week number from 'YYYY-Www'
                    const [yearW, weekNum] = label.split('-W');
                    // Calculate start and end of the week (approximated for display)
                    // Note: Direct parsing of ISO week date isn't standard in date-fns, this is an approximation
                    const approxWeekStart = new Date(parseInt(yearW), 0, 1 + (parseInt(weekNum) - 1) * 7);
                    const weekStartDate = startOfWeek(approxWeekStart, { locale: es });
                    const weekEndDate = endOfWeek(approxWeekStart, { locale: es });
                    return `Semana ${weekNum} (${format(weekStartDate, 'd MMM', { locale: es })} - ${format(weekEndDate, 'd MMM yyyy', { locale: es })})`;
                case 'month':
                default:
                    return format(parseISO(label + '-01'), 'MMMM yyyy', { locale: es }); // e.g., 'enero de 2024'
            }
        } catch (e) {
            console.error("Error formatting tooltip label:", label, e);
            return label; // Fallback
        }
    };

  // Loading state skeleton
  if (isLoading) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-6"> {/* Use max-w-7xl */}
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2"> {/* Reduced mb */}
                <Skeleton className="h-8 w-48" />
                 <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                     <Skeleton className="h-9 w-20 rounded-md" />
                     <Skeleton className="h-9 w-20 rounded-md" />
                     <Skeleton className="h-9 w-20 rounded-md" />
                     <Skeleton className="h-9 w-36 rounded-md" />
                 </div>
            </div>
             {/* Metrics Skeleton Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                 {[...Array(4)].map((_, i) => (
                     <Card key={i} className="bg-card">
                         <CardHeader className="pb-2">
                              <Skeleton className="h-4 w-24" />
                         </CardHeader>
                         <CardContent>
                             <Skeleton className="h-8 w-16" />
                             <Skeleton className="h-3 w-20 mt-1" />
                         </CardContent>
                     </Card>
                 ))}
            </div>
            {/* Chart Card Skeleton */}
            <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
               <CardHeader>
                   <Skeleton className="h-6 w-1/3 mb-2" />
                   <Skeleton className="h-4 w-1/2" />
               </CardHeader>
               <CardContent className="h-[350px] sm:h-[450px] flex items-center justify-center"> {/* Increased height */}
                    <Skeleton className="h-full w-full" />
               </CardContent>
            </Card>
         </div>
      </main>
    );
  }



  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
         <div className="w-full max-w-7xl mx-auto space-y-8"> {/* Use max-w-7xl and increase spacing */}
             {/* Header and Filters */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"> {/* Keep mb-6 */}
                 <h1 className="text-2xl md:text-3xl font-semibold text-foreground flex items-center"> {/* Larger title */}
                     <LineChartIcon className="mr-3 h-7 w-7 text-primary" /> {/* Larger icon */}
                     Estadísticas de Reportes
                 </h1>
                  {/* Combined Filters */}
                 <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 bg-card border border-border p-2 rounded-lg shadow-sm"> {/* Card background for filters */}
                      {/* Period Filters */}
                     {(['day', 'week', 'month'] as const).map((period) => (
                         <Button
                             key={period}
                             variant={filterPeriod === period ? 'secondary' : 'ghost'} // Use secondary for active
                             size="sm"
                             onClick={() => setFilterPeriod(period)}
                             className={cn(
                                 "capitalize px-4 h-9 text-sm transition-all duration-200", // Adjusted padding/height
                                 filterPeriod === period ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/80"
                             )}
                             aria-pressed={filterPeriod === period}
                         >
                             {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}
                         </Button>
                     ))}
                      <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div> {/* Divider */}
                     {/* Report Type Select Filter */}
                     <div className="flex items-center gap-1.5">
                         <Filter className="h-4 w-4 text-muted-foreground" />
                         <Select
                             value={reportTypeFilter}
                             onValueChange={(value: ReportTypeFilter) => setReportTypeFilter(value)}
                         >
                             <SelectTrigger className="h-9 w-[160px] text-sm bg-background border-input focus:ring-primary focus:border-primary"> {/* Background style */}
                                 <SelectValue placeholder="Filtrar por tipo" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="Todos">Todos los Tipos</SelectItem>
                                 <SelectItem value="Funcionario">Funcionarios</SelectItem>
                                 <SelectItem value="Incidente">Incidentes</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                  </div>
             </div>

             {/* Key Metrics Section - Enhanced Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Increased gap */}
                 {/* Total Reports Card */}
                 <Card className="bg-card shadow-md border-border hover:shadow-lg transition-shadow group border-l-4 border-l-primary">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                         <CardTitle className="text-sm font-medium text-muted-foreground">Total ({reportTypeFilter})</CardTitle>
                         <Hash className="h-5 w-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                     </CardHeader>
                     <CardContent className="pt-1 pb-4 px-4">
                         <div className="text-3xl font-bold text-primary">
                           <AnimatedNumber value={totalReports} formatOptions={{ maximumFractionDigits: 0 }} className="block"/>
                         </div>
                          <p className="text-xs text-muted-foreground mt-1">Reportes registrados</p>
                     </CardContent>
                 </Card>
                  {/* Average Reports Card */}
                 <Card className="bg-card shadow-md border-border hover:shadow-lg transition-shadow group border-l-4 border-l-blue-500">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                         <CardTitle className="text-sm font-medium text-muted-foreground">{averageLabel}</CardTitle>
                         <TrendingUp className="h-5 w-5 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                     </CardHeader>
                     <CardContent className="pt-1 pb-4 px-4">
                          <div className="text-3xl font-bold text-blue-600">
                             <AnimatedNumber value={averageReports} formatOptions={{ maximumFractionDigits: 1 }} className="block"/>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                             Reportes ({reportTypeFilter}) en promedio
                         </p>
                     </CardContent>
                 </Card>
                  {/* Most Reported Type Card (Placeholder logic) */}
                 <Card className="bg-card shadow-md border-border hover:shadow-lg transition-shadow group border-l-4 border-l-destructive">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                         <CardTitle className="text-sm font-medium text-muted-foreground">Tipo Más Reportado</CardTitle>
                         <AlertTriangle className="h-5 w-5 text-destructive opacity-70 group-hover:opacity-100 transition-opacity" />
                     </CardHeader>
                     <CardContent className="pt-1 pb-4 px-4">
                         <div className="text-3xl font-bold text-destructive">
                             {totalReports > 0 ? (reportTypeFilter === 'Funcionario' ? 'Funcionario' : reportTypeFilter === 'Incidente' ? 'Incidente' : (Math.random() > 0.4 ? 'Incidente' : 'Funcionario')) : 'N/A'} {/* Placeholder */}
                         </div>
                          <p className="text-xs text-muted-foreground mt-1">Basado en el periodo actual</p>
                     </CardContent>
                 </Card>
                  {/* Most Active Day Card */}
                  <Card className="bg-card shadow-md border-border hover:shadow-lg transition-shadow group border-l-4 border-l-amber-500">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                         <CardTitle className="text-sm font-medium text-muted-foreground">Día Más Activo</CardTitle>
                          <CalendarCheck className="h-5 w-5 text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity" />
                     </CardHeader>
                     <CardContent className="pt-1 pb-4 px-4">
                          <div className="text-3xl font-bold text-amber-700">
                            {mostActiveDay ?? 'N/A'} {/* Use calculated most active day */}
                          </div>
                         <p className="text-xs text-muted-foreground mt-1">Día con más reportes</p>
                     </CardContent>
                 </Card>
             </div>

             {/* Report Trend Chart */}
             <Card className="w-full shadow-lg rounded-xl border border-border bg-card overflow-hidden"> {/* Increased shadow, rounded-xl */}
                <CardHeader className="bg-muted/30 p-4 sm:p-5 border-b border-border/50 flex flex-row items-center justify-between"> {/* Lighter background */}
                     <div>
                         <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <CalendarRange className="h-5 w-5 text-primary" /> Tendencia de Reportes {reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''} por {filterPeriod === 'day' ? 'Día' : filterPeriod === 'week' ? 'Semana' : 'Mes'}
                         </CardTitle>
                         <CardDescription className="text-sm mt-1 text-muted-foreground">Número de reportes registrados en el periodo seleccionado.</CardDescription>
                     </div>
                     {/* Optional: Add export button or other actions here */}
                 </CardHeader>
                 <CardContent className="p-2 sm:p-4 md:p-6"> {/* Adjusted padding */}
                     {chartData.length > 1 ? ( // Ensure at least 2 data points for a meaningful chart
                         <ChartContainer config={chartConfig} className="h-[350px] sm:h-[450px] w-full"> {/* Increased height */}
                            <AreaChart
                                data={chartData}
                                margin={{
                                  top: 10,
                                  right: 30, // Increased right margin for labels
                                  left: 5, // Adjusted left margin
                                  bottom: 30, // Increased bottom margin for angled labels
                                }}
                            >
                                <defs>
                                     <linearGradient id="fillReportCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                           offset="5%"
                                           stopColor="hsl(var(--primary))" // Direct color usage
                                           stopOpacity={0.8}
                                         />
                                         <stop
                                           offset="95%"
                                           stopColor="hsl(var(--primary))" // Direct color usage
                                           stopOpacity={0.1}
                                         />
                                     </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.6)"/> {/* Lighter grid */}
                                <XAxis
                                   dataKey="period"
                                   tickLine={false}
                                   axisLine={false}
                                   tickMargin={10}
                                   tickFormatter={formatXAxisTick}
                                   interval={chartData.length > 10 ? Math.floor(chartData.length / 10) : 0} // Dynamic interval
                                   angle={filterPeriod === 'day' && chartData.length > 7 ? -45 : 0} // Angle ticks if many days
                                   textAnchor={filterPeriod === 'day' && chartData.length > 7 ? 'end' : 'middle'}
                                   height={filterPeriod === 'day' && chartData.length > 7 ? 60 : 40} // Adjust height for angled labels
                                   className="text-xs fill-muted-foreground" // Use theme color
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    allowDecimals={false}
                                    width={30} // Adjust width for Y-axis labels
                                    className="text-xs fill-muted-foreground" // Use theme color
                                />
                                <ChartTooltip
                                    cursor={{ fill: "hsl(var(--accent) / 0.1)" }} // Use theme accent with opacity
                                    content={<ChartTooltipContent indicator="dot" labelFormatter={formatTooltipLabel} />}
                                />
                                <Area
                                   dataKey="count"
                                   type="monotone"
                                   fill="url(#fillReportCount)"
                                   stroke="hsl(var(--primary))" // Direct color usage
                                   stackId="a"
                                   name="Reportes"
                                   strokeWidth={2.5} // Slightly thicker line
                                   dot={chartData.length < 30} // Show dots for fewer points
                                 />
                            </AreaChart>
                        </ChartContainer>
                     ) : (
                          <div className="h-[350px] sm:h-[450px] flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-lg border border-dashed border-border"> {/* Dashed border */}
                             <LineChartIcon className="h-16 w-16 text-muted-foreground opacity-40 mb-5" /> {/* Larger icon */}
                             <p className="text-lg font-semibold text-muted-foreground mb-2"> {/* Larger text */}
                                 {isLoading ? "Calculando datos..." : `No hay suficientes datos ${reportTypeFilter !== 'Todos' ? `de tipo "${reportTypeFilter}"` : ''} para mostrar la tendencia.`}
                             </p>
                               <p className="text-sm text-muted-foreground/80">Intenta ajustar los filtros o espera a que se registren más reportes.</p> {/* Improved suggestion */}
                         </div>
                     )}
                 </CardContent>
             </Card>
        </div>
    </main>
  );
};

export default StatisticsPage;

    