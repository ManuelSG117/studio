"use client";

import { FC, useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp,getCountFromServer } from 'firebase/firestore'; // Added getCountFromServer
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp, ThumbsDown, BarChart3, Shield, Bell, Award, ChevronRight, FileText, TrendingUp, TrendingDown, Users } from 'lucide-react'; // Added icons
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number'; // Import AnimatedNumber
import { Button } from '../ui/button';


interface VoteData {
  reportId: string;
  reportTitle?: string;
  type: 'up' | 'down';
  timestamp: Date;
}

interface DailyActivity {
  day: string;
  shortDay: string; // For labels like 'L', 'M'
  date: number;
  hasActivity: boolean;
  count: number; // Number of activities for this day
}


interface VotingStatsProps {
  userId: string;
}

export const VotingStats: FC<VotingStatsProps> = ({ userId }) => {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  
  const [totalUserReports, setTotalUserReports] = useState(0); // New state for total reports by user


  const stats = useMemo(() => {
    const upvotes = votes.filter(v => v.type === 'up').length;
    const downvotes = votes.filter(v => v.type === 'down').length;
    const totalVotesMade = upvotes + downvotes;
    // Placeholder for average - needs more complex calculation based on a period
    const averageVotesPerDay = totalVotesMade > 0 ? (totalVotesMade / 30).toFixed(1) : "0.0"; // Example: avg over 30 days

    let mostActiveDayData: { day: string; count: number } = { day: 'N/A', count: 0 };
    if (weeklyActivity.length > 0) {
        const activeDays = weeklyActivity.filter(d => d.hasActivity);
        if (activeDays.length > 0) {
            mostActiveDayData = activeDays.reduce((max, day) => day.count > max.count ? day : max, activeDays[0]);
        }
    }
    
    return {
      upvotesGiven: upvotes,
      downvotesGiven: downvotes,
      totalVotesGiven: totalVotesMade,
      averageVotesPerDay: parseFloat(averageVotesPerDay), // Ensure it's a number
      mostActiveDay: mostActiveDayData.day !== 'N/A' ? mostActiveDayData.day.charAt(0).toUpperCase() + mostActiveDayData.day.slice(1) : 'N/A',
    };
  }, [votes, weeklyActivity]);

  useEffect(() => {
    const fetchVotingData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Fetch votes made BY this user
        const userVotesQuery = query(
          collection(db, 'userVotes'),
          where("userId", "==", userId),
          orderBy('timestamp', 'desc')
        );
        const votesSnapshot = await getDocs(userVotesQuery);
        const fetchedVotes: VoteData[] = [];
        votesSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedVotes.push({
            reportId: data.reportId,
            reportTitle: data.reportTitle || 'Reporte sin título',
            type: data.type as 'up' | 'down',
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
          });
        });
        setVotes(fetchedVotes);

        // Fetch total reports made BY this user
        const userReportsQuery = query(collection(db, "reports"), where("userId", "==", userId));
        const reportsSnapshot = await getCountFromServer(userReportsQuery); // Use getCountFromServer
        setTotalUserReports(reportsSnapshot.data().count);


        // Generate weekly activity based on fetchedVotes
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today, { locale: es });
        const endOfCurrentWeek = endOfWeek(today, { locale: es });
        const daysOfWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
        
        const weekActivityData = daysOfWeek.map(day => {
          const activitiesOnDay = fetchedVotes.filter(vote => 
            format(vote.timestamp, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          return {
            day: format(day, 'EEEE', { locale: es }),
            shortDay: format(day, 'EEE', { locale: es }).substring(0,3), // For Lun, Mar, etc.
            date: day.getDate(), // Not used in the new design but kept for now
            hasActivity: activitiesOnDay.length > 0,
            count: activitiesOnDay.length
          };
        });
        setWeeklyActivity(weekActivityData);

      } catch (error) {
        console.error('Error al obtener estadísticas de votos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotingData();
  }, [userId]);

  const maxActivityCount = useMemo(() => Math.max(...weeklyActivity.map(d => d.count), 0) || 1, [weeklyActivity]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Participation Stats Skeleton */}
        <div>
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
        </div>
        {/* Recent Activity Skeleton */}
        <div>
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="grid grid-cols-7 gap-2 h-24 bg-muted p-2 rounded-lg">
                 {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-full w-full rounded" />)}
            </div>
            <Skeleton className="h-4 w-1/4 mt-2 ml-auto" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 w-full">
      {/* Estadísticas de Participación */}
      <div>
        <CardHeader className="p-0 mb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary"/>Estadísticas de Participación
            </CardTitle>
            <CardDescription className="text-sm">Tu actividad en la comunidad +SEGURO</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <Card className="p-3 flex flex-col justify-between bg-blue-50 border-blue-200 rounded-lg">
            <div>
                <p className="text-xs text-blue-600 font-medium flex items-center"><FileText className="h-3.5 w-3.5 mr-1.5"/>Reportes Totales</p>
                <AnimatedNumber value={totalUserReports} className="text-2xl font-bold text-blue-700 block mt-0.5"/>
            </div>
            <p className="text-xs text-blue-500 mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> +5 este mes</p>
          </Card>
          <Card className="p-3 flex flex-col justify-between bg-green-50 border-green-200 rounded-lg">
            <div>
                <p className="text-xs text-green-600 font-medium flex items-center"><ThumbsUp className="h-3.5 w-3.5 mr-1.5"/>Votos Positivos</p>
                <AnimatedNumber value={stats.upvotesGiven} className="text-2xl font-bold text-green-700 block mt-0.5"/>
            </div>
             <p className="text-xs text-green-500 mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> +12 esta semana</p>
          </Card>
          <Card className="p-3 flex flex-col justify-between bg-red-50 border-red-200 rounded-lg">
             <div>
                <p className="text-xs text-red-600 font-medium flex items-center"><ThumbsDown className="h-3.5 w-3.5 mr-1.5"/>Votos Negativos</p>
                <AnimatedNumber value={stats.downvotesGiven} className="text-2xl font-bold text-red-700 block mt-0.5"/>
            </div>
            <p className="text-xs text-red-500 mt-1 flex items-center"><TrendingDown className="h-3 w-3 mr-0.5"/> +2 esta semana</p>
          </Card>
          <Card className="p-3 flex flex-col justify-between bg-indigo-50 border-indigo-200 rounded-lg">
            <div>
                <p className="text-xs text-indigo-600 font-medium flex items-center"><Users className="h-3.5 w-3.5 mr-1.5"/>Promedio/día</p>
                <AnimatedNumber value={stats.averageVotesPerDay} formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-2xl font-bold text-indigo-700 block mt-0.5"/>
            </div>
            <p className="text-xs text-indigo-500 mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5"/> +0.5 vs. anterior</p>
          </Card>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div>
        <CardHeader className="p-0 mb-3 flex flex-row justify-between items-center">
            <div>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary"/>Actividad Reciente
                </CardTitle>
            </div>
            <div className="flex space-x-1 bg-muted p-0.5 rounded-md">
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:shadow-sm" data-active={true}>Semana</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:shadow-sm">Mes</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:shadow-sm">Año</Button>
            </div>
        </CardHeader>
        <Card className="p-4 bg-card rounded-lg border border-border">
            <div className="grid grid-cols-7 gap-2 h-28 items-end">
            {weeklyActivity.map((day, index) => (
                <div key={index} className="flex flex-col items-center justify-end h-full">
                <div 
                    className={cn(
                        "w-full rounded-t-md transition-all duration-300 ease-out",
                        day.hasActivity ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ height: `${(day.count / maxActivityCount) * 100}%` }}
                    title={`${day.count} actividades`}
                ></div>
                <p className="text-[10px] text-muted-foreground mt-1">{day.shortDay}</p>
                </div>
            ))}
            </div>
        </Card>
        <div className="text-right mt-2">
          <p className="text-xs text-muted-foreground">{stats.mostActiveDay}: Día con más actividad</p>
          {/* <Link href="#" className="text-xs text-primary hover:text-primary/80 flex items-center justify-end">
            Ver análisis completo <ChevronRight className="h-3 w-3" />
          </Link> */}
        </div>
      </div>
    </div>
  );
};

