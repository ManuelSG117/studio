
"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, Timestamp, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, CalendarDays, Image as ImageIcon, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatLocation } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/app/(app)/welcome/page'; // Using existing Report type

export const RecentCommunityReports: FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecentReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const reportsCollectionRef = collection(db, "reports");
      const q = query(
        reportsCollectionRef,
        orderBy("createdAt", "desc"),
        limit(3) // Fetch 3 most recent reports
      );
      const querySnapshot = await getDocs(q);
      const fetchedReports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAtDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
        fetchedReports.push({
          id: doc.id,
          userId: data.userId,
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
          // userVote is not strictly needed for display here but kept for type consistency
        });
      });
      setReports(fetchedReports);
    } catch (error) {
      console.error("Error fetching recent community reports: ", error);
      // Optionally set an error state to display to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentReports();
  }, [fetchRecentReports]);

  const getTypeBadgeVariant = (type: 'incidente' | 'funcionario'): 'destructive' | 'default' => {
    return type === 'incidente' ? 'destructive' : 'default';
  };
  const getTypeBadgeText = (type: 'incidente' | 'funcionario'): string => {
    return type === 'incidente' ? 'Incidente' : 'Funcionario';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-sm bg-card rounded-lg overflow-hidden">
            <Skeleton className="h-32 w-full bg-muted" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileText className="mx-auto h-10 w-10 opacity-50 mb-2" />
        <p>No hay reportes recientes en la comunidad.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {reports.map((report) => (
        <Card key={report.id} className="shadow-md bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <div className="relative h-32 w-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden group">
            {report.mediaUrl ? (
              <>
                {report.mediaUrl.includes('.mp4') || report.mediaUrl.includes('.webm') ? (
                  <video src={report.mediaUrl} className="h-full w-full object-cover" controls={false} preload="metadata" />
                ) : (
                  <Image src={report.mediaUrl} alt={`Evidencia para ${report.title}`} fill style={{ objectFit: 'cover' }} className="transition-transform duration-300 group-hover:scale-105" data-ai-hint="recent report evidence"/>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Link href={`/reports/${report.id}`} className="text-white text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Ver Detalles</Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-4">
                <ImageIcon size={28} className="opacity-50 mb-1"/>
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
            <div className="absolute top-2 left-2 z-10">
              <Badge variant={getTypeBadgeVariant(report.reportType)} className="text-xs capitalize shadow">
                {getTypeBadgeText(report.reportType)}
              </Badge>
            </div>
            {report.mediaUrl && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm z-10">
                {report.mediaUrl.includes('.mp4') || report.mediaUrl.includes('.webm') ? (
                  <Video size={12} />
                ) : (
                  <ImageIcon size={12} />
                )}
              </div>
            )}
          </div>
          <CardContent className="p-3 flex-1 space-y-1.5">
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
              <Link href={`/reports/${report.id}`} className="hover:text-primary transition-colors">
                {report.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
              {report.description}
            </CardDescription>
            <div className="flex items-center text-xs text-muted-foreground gap-1 pt-0.5">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{formatLocation(report.location)}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1 pt-0.5">
              <CalendarDays size={11} className="flex-shrink-0" />
              <span>{formatDistanceToNow(report.createdAt, { addSuffix: true, locale: es })}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
