"use client";

import { FC, useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
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

interface VotingStatsProps {
  userId: string;
}

export const VotingStats: FC<VotingStatsProps> = ({ userId }) => {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    upvotes: 0,
    downvotes: 0,
    totalVotes: 0,
    participationRate: 0,
    mostActiveDay: 'Lun'
  });

  useEffect(() => {
    const fetchVotingStats = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Obtener todos los votos del usuario
        const userVotesQuery = query(
          collection(db, 'userVotes'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );

        const votesSnapshot = await getDocs(userVotesQuery);
        const votesData: VoteData[] = [];
        let upCount = 0;
        let downCount = 0;

        votesSnapshot.forEach((doc) => {
          const data = doc.data();
          const voteData: VoteData = {
            reportId: data.reportId,
            reportTitle: data.reportTitle || 'Reporte sin título',
            type: data.type,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
          };
          
          // Contar votos por tipo
          if (data.type === 'up') upCount++;
          else if (data.type === 'down') downCount++;
          
          votesData.push(voteData);
        });

        // Simular actividades recientes
        const recentActivities: ActivityData[] = [
          {
            type: 'report',
            title: 'Reportaste un asalto en Av. Insurgentes',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'pendiente'
          },
          {
            type: 'vote',
            title: 'Denunciaste una irregularidad policial',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            votes: 5
          },
          {
            type: 'comment',
            title: 'Comentaste en reporte de Zona Norte',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            votes: 4
          }
        ];

        setVotes(votesData);
        setActivities(recentActivities);
        setStats({
          upvotes: upCount,
          downvotes: downCount,
          totalVotes: upCount + downCount,
          participationRate: 4.2,
          mostActiveDay: 'Lun'
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
        <CardContent className="p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-20 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Si no hay votos, mostrar mensaje
  if (votes.length === 0) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="p-4 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No has votado en ningún reporte todavía.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de participación */}
      <div className="text-center space-y-2">
        <div className="flex justify-center items-baseline gap-8">
          <div>
            <p className="text-3xl font-bold text-primary">{stats.upvotes}</p>
            <p className="text-xs text-muted-foreground">Votos positivos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-destructive">{stats.downvotes}</p>
            <p className="text-xs text-muted-foreground">Votos negativos</p>
          </div>
        </div>
        <div className="flex justify-center items-baseline gap-8 mt-4">
          <div>
            <p className="text-2xl font-semibold text-primary">{stats.participationRate}</p>
            <p className="text-xs text-muted-foreground">Promedio de votos</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-primary">{stats.mostActiveDay}</p>
            <p className="text-xs text-muted-foreground">Día con más votos</p>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Actividad reciente</h4>
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex-1">
                <p className="text-foreground font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  Hace {Math.floor((Date.now() - activity.timestamp.getTime()) / (24 * 60 * 60 * 1000))} días
                </p>
              </div>
              {activity.votes !== undefined && (
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                  {activity.votes} votos
                </div>
              )}
              {activity.status && (
                <div className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                  {activity.status}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progreso de participación */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Progreso de participación</h4>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: '65%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          ¡A solo 20 puntos del siguiente nivel!
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Tu participación ha aumentado un 12% este mes
        </p>
      </div>
    </div>
  );
};