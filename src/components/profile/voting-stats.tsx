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

interface VotingStatsProps {
  userId: string;
}

export const VotingStats: FC<VotingStatsProps> = ({ userId }) => {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ upvotes: 0, downvotes: 0 });

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

        setVotes(votesData);
        setStats({ upvotes: upCount, downvotes: downCount });
      } catch (error) {
        console.error('Error al obtener estadísticas de votos:', error);
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
    <div className="space-y-4">
      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Votos Positivos</p>
              <p className="text-xl font-semibold text-foreground">{stats.upvotes}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Votos Negativos</p>
              <p className="text-xl font-semibold text-foreground">{stats.downvotes}</p>
            </div>
            <ThumbsDown className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>
      </div>

      {/* Lista de votos recientes */}
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Votos Recientes</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {votes.slice(0, 5).map((vote, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs">
              <div className="flex items-center">
                {vote.type === 'up' ? (
                  <ThumbsUp className="h-3 w-3 text-blue-500 mr-2" />
                ) : (
                  <ThumbsDown className="h-3 w-3 text-destructive mr-2" />
                )}
                <span className="truncate max-w-[150px]">{vote.reportTitle}</span>
              </div>
              <span className="text-muted-foreground text-[10px]">
                {format(vote.timestamp, "dd MMM, HH:mm", { locale: es })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};