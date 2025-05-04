
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Added useRef
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon, Loader2, CalendarRange, Hash, TrendingUp, AlertTriangle, UserCog, Filter } from 'lucide-react'; // Import icons, added UserCog, Filter
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
import { motion, animate } from 'framer-motion'; // Import motion and animate
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

type FilterPeriod = 'day' | 'week' | 'month';
type ReportTypeFilter = 'Todos' | 'Funcionario' | 'Incidente'; // Added report type filter

interface ChartDataPoint {
    period: string; // Format depends on filter: 'YYYY-MM-DD', 'YYYY-Www', 'YYYY-MM'
    count: number;
}

// Animated number component
const AnimatedNumber: FC<{ value: number; formatOptions?: Intl.NumberFormatOptions }> = ({ value, formatOptions }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(displayValue, value, {
      duration: 1, // Animation duration in seconds
      ease: "easeOut",
      onUpdate(latest) {
        setDisplayValue(latest);
      }
    });

    return () => controls.stop();
  }, [value]); // Rerun animation when the target value changes

  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('es-ES', formatOptions).format(displayValue);
  }, [displayValue, formatOptions]);

  return <motion.div ref={nodeRef}>{formattedValue}</motion.div>;
};


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

    // Count reports for each period using the type-filtered list
    filteredReportsByType.forEach(report => {
       const periodKey = formatKey(report.createdAt);
       if (reportsByPeriod[periodKey] !== undefined) {
          reportsByPeriod[periodKey]++;
       }
    });

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
        case 'day': return 'Promedio por Día';
        case 'week': return 'Promedio por Semana';
        case 'month': return 'Promedio por Mes';
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
            // Format 'YYYY-MM' to 'Mmm YY' (e.g., 'Ene 24')
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
         <div className="w-full max-w-4xl space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2"> {/* Reduced mb */}
                <Skeleton className="h-8 w-48" />
                 {/* Combined Filter Skeleton */}
                 <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                     {/* Period Filters */}
                     <Skeleton className="h-9 w-20 rounded-md" />
                     <Skeleton className="h-9 w-20 rounded-md" />
                     <Skeleton className="h-9 w-20 rounded-md" />
                      {/* Type Filters (Select Placeholder) */}
                     <Skeleton className="h-9 w-36 rounded-md" /> {/* Placeholder for Select */}
                 </div>
            </div>
             {/* Metrics Skeleton */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"> {/* Reduced mb */}
                 <Card className="bg-card">
                     <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-24" />
                     </CardHeader>
                     <CardContent>
                         <Skeleton className="h-8 w-16" />
                     </CardContent>
                 </Card>
                 <Card className="bg-card">
                     <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-32" />
                     </CardHeader>
                     <CardContent>
                         <Skeleton className="h-8 w-20" />
                     </CardContent>
                 </Card>
            </div>

            {/* Chart Card Skeleton */}
            <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
               <CardHeader>
                   <Skeleton className="h-6 w-1/3 mb-2" />
                   <Skeleton className="h-4 w-1/2" />
               </CardHeader>
               <CardContent className="h-[300px] sm:h-[400px] flex items-center justify-center"> {/* Adjusted height */}
                    <Skeleton className="h-full w-full" />
               </CardContent>
            </Card>
         </div>
      </main>
    );
  }



  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
             {/* Header and Filters */}
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"> {/* Increased mb */}
                <h1 className="text-2xl font-semibold text-foreground flex items-center">
                    <LineChartIcon className="mr-3 h-6 w-6 text-primary" />
                    Estadísticas de Reportes
                </h1>
                {/* Combined Filters */}
                 <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                     {/* Period Filters */}
                    {(['day', 'week', 'month'] as const).map((period) => (
                        <Button
                            key={period}
                            variant={filterPeriod === period ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterPeriod(period)}
                            className={cn("capitalize", filterPeriod === period && "shadow")}
                            aria-pressed={filterPeriod === period}
                        >
                            {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}
                        </Button>
                    ))}
                    {/* Report Type Select Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={reportTypeFilter}
                            onValueChange={(value: ReportTypeFilter) => setReportTypeFilter(value)}
                        >
                            <SelectTrigger className="h-9 w-[150px] text-sm">
                                <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos</SelectItem>
                                <SelectItem value="Funcionario">Funcionarios</SelectItem>
                                <SelectItem value="Incidente">Incidentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </div>

             {/* Key Metrics Section */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"> {/* Reduced mb */}
                 {/* Total Reports Card */}
                <Card className="bg-card shadow-sm border-border">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium text-muted-foreground">Total ({reportTypeFilter})</CardTitle> {/* Show current filter */}
                         <Hash className="h-4 w-4 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                         <div className="text-2xl font-bold text-foreground">
                           {/* Animated Total Reports */}
                           <AnimatedNumber value={totalReports} formatOptions={{ maximumFractionDigits: 0 }}/>
                         </div>
                     </CardContent>
                 </Card>
                  {/* Average Reports Card */}
                 <Card className="bg-card shadow-sm border-border">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium text-muted-foreground">{averageLabel}</CardTitle>
                         <TrendingUp className="h-4 w-4 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                          <div className="text-2xl font-bold text-foreground">
                            {/* Animated Average Reports */}
                             <AnimatedNumber value={averageReports} formatOptions={{ maximumFractionDigits: 1 }} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                             Reportes ({reportTypeFilter})
                         </p>
                     </CardContent>
                 </Card>
             </div>

             {/* Report Trend Chart */}
             <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
                <CardHeader>
                     <CardTitle className="text-lg font-semibold flex items-center">
                        <CalendarRange className="h-5 w-5 mr-2 text-muted-foreground" /> Tendencia de Reportes {reportTypeFilter !== 'Todos' ? `(${reportTypeFilter}s)` : ''} por {filterPeriod === 'day' ? 'Día' : filterPeriod === 'week' ? 'Semana' : 'Mes'}
                     </CardTitle>
                     <CardDescription>Número de reportes registrados en el periodo seleccionado.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     {chartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full"> {/* Adjusted height */}
                            <AreaChart
                                data={chartData}
                                margin={{
                                  top: 10, // Increased top margin
                                  right: 15, // Increased right margin
                                  left: 5, // Increased left margin
                                  bottom: 10, // Increased bottom margin for labels
                                }}
                            >
                                <defs>
                                     <linearGradient id="fillReportCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                           offset="5%"
                                           stopColor="var(--color-reportCount)"
                                           stopOpacity={0.8}
                                         />
                                         <stop
                                           offset="95%"
                                           stopColor="var(--color-reportCount)"
                                           stopOpacity={0.1}
                                         />
                                     </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                   dataKey="period"
                                   tickLine={false}
                                   axisLine={false}
                                   tickMargin={10} // Increase space below ticks
                                   tickFormatter={formatXAxisTick} // Use dynamic formatter
                                   interval={"preserveStartEnd"} // Ensure start/end labels show
                                   minTickGap={30} // Adjust gap between ticks
                                   angle={filterPeriod === 'day' ? -45 : 0} // Angle ticks if needed for day view
                                   textAnchor={filterPeriod === 'day' ? 'end' : 'middle'} // Adjust anchor for angled ticks
                                   height={filterPeriod === 'day' ? 50 : 30} // Increase height for angled labels
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    allowDecimals={false} // Ensure whole numbers for count
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" labelFormatter={formatTooltipLabel}/>}
                                />
                                <Area
                                   dataKey="count"
                                   type="monotone" // Smooth curve
                                   fill="url(#fillReportCount)"
                                   stroke="var(--color-reportCount)"
                                   stackId="a"
                                   name="Reportes" // Name for tooltip
                                   strokeWidth={2} // Slightly thicker line
                                   dot={chartData.length < 50} // Show dots only for smaller datasets
                                 />
                            </AreaChart>
                        </ChartContainer>
                     ) : (
                         <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center text-center p-4">
                             <LineChartIcon className="h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                             <p className="text-sm text-muted-foreground">
                                 {isLoading ? "Calculando datos..." : `No hay reportes ${reportTypeFilter !== 'Todos' ? `de tipo "${reportTypeFilter}"` : ''} para mostrar la tendencia en este periodo.`}
                             </p>
                         </div>
                     )}
                 </CardContent>
             </Card>
        </div>
    </main>
  );
};

export default StatisticsPage;

