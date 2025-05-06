"use client";

import { FC, useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp, ThumbsDown, BarChart3, Shield, Bell, Award, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// Definir tipos para los datos de votos
interface VoteData {
  reportId: string;
  reportTitle?: string;
  type: 'up' | 'down';
  timestamp: Date;
}

interface ActivityData {
  type: 'report' | 'vote' | 'comment';
  title: string;
  timestamp: Date;
  status?: string;
  votes?: number;
}

interface DailyActivity {
  day: string;
  shortDay: string;
  date: number;
  hasActivity: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

interface VotingStatsProps {
  userId: string;
}

export const VotingStats: FC<VotingStatsProps> = ({ userId }) => {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [stats, setStats] = useState({
    upvotes: 0,
    downvotes: 0,
    totalVotes: 0,
    participationRate: 3.2,
    mostActiveDay: 'Jue'
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchVotingStats = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Consulta optimizada para obtener solo los votos del usuario actual
        const userVotesQuery = query(
          collection(db, 'userVotes'),
          where("userId", "==", userId),
          orderBy('timestamp', 'desc')
        );

        console.log(`Consultando votos para el usuario: ${userId}`);
        const votesSnapshot = await getDocs(userVotesQuery);
        console.log(`Documentos encontrados: ${votesSnapshot.size}`);
        
        const votesData: VoteData[] = [];
        let upCount = 0;
        let downCount = 0;

        votesSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Procesando documento:', doc.id, data);
          
          const voteData: VoteData = {
            reportId: data.reportId,
            reportTitle: data.reportTitle || 'Reporte sin título',
            type: data.type || 'up',
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
          };
          
          // Contar votos por tipo
          if (data.type === 'up') upCount++;
          else if (data.type === 'down') downCount++;
          
          votesData.push(voteData);
        });
        
        console.log(`Votos encontrados para el usuario ${userId}:`, votesData.length);
        
        // Generar actividades recientes basadas en los votos reales
        const recentActivities: ActivityData[] = [];
        
        // Agregar votos reales como actividades
        votesData.slice(0, 3).forEach(vote => {
          recentActivities.push({
            type: 'vote',
            title: vote.type === 'up' ? `Votaste positivamente: ${vote.reportTitle}` : `Votaste negativamente: ${vote.reportTitle}`,
            timestamp: vote.timestamp,
            votes: 1
          });
        });
        
        // Si no hay suficientes votos, agregar actividades de ejemplo
        if (recentActivities.length === 0) {
          recentActivities.push({
            type: 'report',
            title: 'Aún no tienes actividad reciente',
            timestamp: new Date(),
            status: 'info'
          });
        }

        // Generar datos de actividad semanal
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today, { locale: es });
        const endOfCurrentWeek = endOfWeek(today, { locale: es });
        const daysOfWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
        
        // Crear array de actividad semanal
        const weekActivity = daysOfWeek.map(day => {
          // Verificar si hay votos en este día
          const hasVoteOnDay = votesData.some(vote => {
            const voteDate = vote.timestamp;
            return format(voteDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          });
          
          return {
            day: format(day, 'EEEE', { locale: es }),
            shortDay: format(day, 'EEE', { locale: es }).substring(0, 1).toUpperCase(),
            date: day.getDate(),
            hasActivity: hasVoteOnDay
          };
        });
        
        // Generar logros desbloqueados
        const achievementsList: Achievement[] = [
          {
            id: 'vigilante',
            title: 'Vigilante Verificado',
            description: 'Perfil validado y verificado',
            icon: <Shield className="h-5 w-5 text-amber-500" />,
            unlocked: true
          },
          {
            id: 'alertador',
            title: 'Alertador Activo',
            description: '10+ reportes enviados',
            icon: <Bell className="h-5 w-5 text-green-500" />,
            unlocked: upCount + downCount >= 10
          },
          {
            id: 'comprometido',
            title: 'Ciudadano Comprometido',
            description: '30+ días de actividad',
            icon: <Award className="h-5 w-5 text-blue-500" />,
            unlocked: false
          }
        ];

        setVotes(votesData);
        setActivities(recentActivities);
        setWeeklyActivity(weekActivity);
        setAchievements(achievementsList);
        setStats({
          upvotes: upCount,
          downvotes: downCount,
          totalVotes: upCount + downCount,
          participationRate: 3.2,
          mostActiveDay: 'Jue'
        });
      } catch (error) {
        console.error('Error al obtener estadísticas de votos revisar consola:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotingStats();
  }, [userId]);

  if (isLoading) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="p-6">
          <Skeleton className="h-5 w-full mb-3" />
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-24 w-full mb-3" />
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Si no hay votos, mostrar mensaje
  if (votes.length === 0) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No has votado en ningún reporte todavía.</p>
          <p className="text-xs text-muted-foreground mt-3">Si acabas de votar, actualiza la página para ver tus votos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Título y estadísticas de participación */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Estadísticas de Participación</h3>
          <p className="text-xs text-muted-foreground">Tu actividad en la comunidad *SEGURO</p>
        </div>
        
        <div className="grid grid-cols-4 gap-3 text-center w-full">
          <Card className="p-3 flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Reportes Totales</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold">{stats.totalVotes}</p>
              <span className="text-xs text-muted-foreground">+5 este mes</span>
            </div>
          </Card>
          
          <Card className="p-3 flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Votos Positivos</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold text-green-500">{stats.upvotes}</p>
              <ThumbsUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">+12 esta semana</span>
            </div>
          </Card>
          
          <Card className="p-3 flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Votos Negativos</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold text-red-500">{stats.downvotes}</p>
              <ThumbsDown className="h-3 w-3 text-red-500" />
              <span className="text-xs text-muted-foreground">+2 esta semana</span>
            </div>
          </Card>
          
          <Card className="p-3 flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Frecuencia</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold">{stats.participationRate}</p>
              <span className="text-xs text-muted-foreground">+0.5 vs. anterior</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Actividad Reciente con visualización semanal */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Actividad Reciente</h3>
          <div className="flex space-x-2">
            <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Semana</button>
            <button className="text-xs text-muted-foreground px-2 py-1">Mes</button>
            <button className="text-xs text-muted-foreground px-2 py-1">Año</button>
          </div>
        </div>
        
        {/* Gráfico de actividad semanal */}
        <div className="grid grid-cols-7 gap-2 mb-4 w-full">
          {weeklyActivity.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground">{day.shortDay}</p>
              <div className={`h-20 w-full ${day.hasActivity ? 'bg-blue-500' : 'bg-gray-100'} rounded-md my-1`}></div>
              <p className="text-xs">{day.date}</p>
            </div>
          ))}
        </div>
        
        <div className="text-right mt-2">
          <p className="text-xs text-muted-foreground">Jueves: Día con más actividad</p>
          <a href="#" className="text-xs text-blue-600 flex items-center justify-end">
            Ver análisis completo <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Logros desbloqueados */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Logros Desbloqueados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`p-4 rounded-lg border ${achievement.unlocked ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'} flex items-center gap-3`}
            >
              <div className={`p-2 rounded-full ${achievement.unlocked ? 'bg-amber-100' : 'bg-gray-100'}`}>
                {achievement.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-right mt-3">
          <a href="#" className="text-xs text-blue-600 flex items-center justify-end">
            Ver todos los logros disponibles <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};