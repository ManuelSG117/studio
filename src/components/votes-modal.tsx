"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, User, CalendarDays, Thermometer, Info, ArrowUp, ArrowDown } from "lucide-react";
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoteInfo {
  userId: string;
  reportId: string;
  reportTitle: string;
  type: 'up' | 'down';
  timestamp: Timestamp;
  userEmail?: string;
}

interface VotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
  upvotes: number;
  downvotes: number;
}

export function VotesModal({ open, onOpenChange, reportId, reportTitle, upvotes, downvotes }: VotesModalProps) {
  const [votes, setVotes] = useState<VoteInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'up' | 'down'>('up');
  
  // Calcular la temperatura del reporte basada en los votos
  const totalVotes = upvotes + downvotes;
  const voteRatio = totalVotes > 0 ? upvotes / totalVotes : 0.5;
  const temperature = Math.round(voteRatio * 100);
  
  // Determinar el color y mensaje basado en la temperatura
  const getTemperatureColor = () => {
    if (temperature >= 75) return "text-green-500";
    if (temperature >= 50) return "text-yellow-500";
    if (temperature >= 25) return "text-orange-500";
    return "text-red-500";
  };
  
  const getTemperatureMessage = () => {
    if (temperature >= 75) return "Reporte muy confiable";
    if (temperature >= 50) return "Reporte confiable";
    if (temperature >= 25) return "Reporte poco confiable";
    return "Reporte no confiable";
  };

  useEffect(() => {
    if (open && reportId) {
      fetchVotes();
    }
  }, [open, reportId, activeTab]);

  const fetchVotes = async () => {
    if (!reportId) return;
    
    setIsLoading(true);
    try {
      // Consulta a la colección userVotes para obtener los votos del reporte
      const votesQuery = query(
        collection(db, 'userVotes'),
        where('reportId', '==', reportId),
        where('type', '==', activeTab),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(votesQuery);
      const votesData: VoteInfo[] = [];
      
      querySnapshot.forEach((doc) => {
        votesData.push(doc.data() as VoteInfo);
      });

      setVotes(votesData);
    } catch (error) {
      console.error('Error al obtener los votos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center mb-2">Confiabilidad del Reporte</DialogTitle>
          <DialogDescription className="text-center text-sm">
            {reportTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Termómetro de confiabilidad */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className={cn("h-5 w-5", getTemperatureColor())} />
            <span className={cn("font-medium", getTemperatureColor())}>
              {getTemperatureMessage()}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">La confiabilidad se calcula en base a los votos de la comunidad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Barra de temperatura */}
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full", 
                temperature >= 75 ? "bg-green-500" : 
                temperature >= 50 ? "bg-yellow-500" : 
                temperature >= 25 ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ width: `${temperature}%` }}
            />
          </div>
          
          {/* Contador de votos */}
          <div className="flex justify-between w-full mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3.5 w-3.5 text-red-500" />
              <span>{downvotes}</span>
            </div>
            <div>
              <span className="font-medium">{temperature}%</span> positivos
            </div>
            <div className="flex items-center gap-1">
              <span>{upvotes}</span>
              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
            </div>
          </div>

          {/* Información sobre el sistema de votos */}
          <div className="mt-4 space-y-2 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <p>Tu voto determina la confiabilidad del reporte</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              <p>No hay límite para la cantidad de votos</p>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <p>Puedes votar en cualquier reporte de la comunidad</p>
            </div>
          </div>
        </div>

        {/* Pestañas de votos */}
        <div className="flex justify-center space-x-2 mb-4">
          <Button 
            variant={activeTab === 'up' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab('up')}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>Votos positivos ({upvotes})</span>
          </Button>
          <Button 
            variant={activeTab === 'down' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab('down')}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="h-4 w-4" />
            <span>Votos negativos ({downvotes})</span>
          </Button>
        </div>

        {/* Lista de votos */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 p-2 border rounded-md">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : votes.length > 0 ? (
            votes.map((vote, index) => (
              <div key={index} className="flex items-center gap-3 mb-3 p-2 border rounded-md">
                <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {vote.userEmail || 'Usuario'}
                    </p>
                    <Badge variant={vote.type === 'up' ? 'default' : 'destructive'} className="text-xs">
                      {vote.type === 'up' ? 'Positivo' : 'Negativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {vote.timestamp && format(vote.timestamp.toDate(), 'PPp', { locale: es })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No hay votos {activeTab === 'up' ? 'positivos' : 'negativos'} para este reporte.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}