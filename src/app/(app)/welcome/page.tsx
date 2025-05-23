"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, startAfter, doc, getDoc, runTransaction, endBefore, limitToLast, type DocumentSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle  } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MapPin, CalendarDays, Loader2, UserCog, TriangleAlert, Plus, Ellipsis, Image as ImageIcon, Video, ArrowUp, ArrowDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn, formatLocation } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { VotesModal } from "@/components/votes-modal";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog";

// Add window.FB type declaration
declare global {
  interface Window {
    FB?: any;
  }
}

export type Report = {
    id: string;
    userId: string;
    userEmail?: string | null;
    reportType: 'incidente' | 'funcionario';
    title: string;
    description: string;
    location: string;
    mediaUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
};

const WelcomePage: FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<DocumentSnapshot | null>(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [votingState, setVotingState] = useState<{ [reportId: string]: boolean }>({});
  const [votesModalOpen, setVotesModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);

  const ITEMS_PER_PAGE = 6;

  const fetchUserVote = useCallback(async (userId: string, reportId: string) => {
      try {
          const voteDocRef = doc(db, `reports/${reportId}/votes/${userId}`);
          const voteDocSnap = await getDoc(voteDocRef);
          if (voteDocSnap.exists()) {
              return voteDocSnap.data().type as 'up' | 'down';
          }
      } catch (error) {
          console.error("Error fetching user vote: ", error);
      }
      return null;
  }, []);

  const fetchReports = useCallback(async (direction: 'initial' | 'next' | 'previous') => {
    if (!user) {
      console.error("fetchReports called without a valid user.");
      setIsLoading(false);
      return;
    }
    console.log("Fetching reports for user:", user.uid, "Direction:", direction, "Current Page:", currentPage);
    setIsLoading(true);

    try {
      const reportsCollectionRef = collection(db, "reports");
      let q;

      if (direction === 'initial') {
        q = query(
          reportsCollectionRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(ITEMS_PER_PAGE)
        );
      } else if (direction === 'next' && lastVisibleDoc) {
        q = query(
          reportsCollectionRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          startAfter(lastVisibleDoc),
          limit(ITEMS_PER_PAGE)
        );
      } else if (direction === 'previous' && firstVisibleDoc) {
        q = query(
          reportsCollectionRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          endBefore(firstVisibleDoc),
          limitToLast(ITEMS_PER_PAGE)
        );
      } else {
        // Fallback or handle invalid state
        setIsLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const fetchedReports: Report[] = [];
      console.log(`Found ${querySnapshot.docs.length} reports in this batch for WelcomePage.`);

      for (const reportDoc of querySnapshot.docs) {
        const data = reportDoc.data();
        const userVote = await fetchUserVote(user.uid, reportDoc.id);
        const createdAtDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
        fetchedReports.push({
            id: reportDoc.id, userId: data.userId, userEmail: data.userEmail || null,
            reportType: data.reportType, title: data.title, description: data.description,
            location: data.location, mediaUrl: data.mediaUrl || null,
            latitude: data.latitude || null, longitude: data.longitude || null,
            createdAt: createdAtDate, upvotes: data.upvotes || 0, downvotes: data.downvotes || 0,
            userVote: userVote,
        });
      }
      
      setReports(fetchedReports);

      if (querySnapshot.docs.length > 0) {
        setFirstVisibleDoc(querySnapshot.docs[0]);
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        if (direction === 'next') setHasMore(false);
      }
      
      if (direction === 'initial') {
        setCurrentPage(1);
        setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
      } else if (direction === 'next') {
        if (fetchedReports.length > 0) setCurrentPage(prev => prev + 1);
        setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
      } else if (direction === 'previous') {
        if (fetchedReports.length > 0) setCurrentPage(prev => prev - 1);
        setHasMore(true); // After going previous, there's likely more next
      }
      
    } catch (error) {
      console.error("Error fetching reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch reports." });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, fetchUserVote, lastVisibleDoc, firstVisibleDoc, currentPage]); // Ensure currentPage is a dependency if logic depends on it directly

  useEffect(() => {
    if (!authLoading) {
        if (isAuthenticated && user) {
            if (reports.length === 0 && currentPage === 1) { // Only fetch initial if reports are empty and on page 1
                 console.log("Auth confirmed, fetching initial reports for WelcomePage.");
                 fetchReports('initial');
            }
        } else {
            console.log("Not authenticated or user not ready, redirecting to login.");
            setIsLoading(false);
            router.replace("/login");
        }
    } else {
        console.log("Auth state still loading...");
         setIsLoading(true);
    }
  }, [authLoading, isAuthenticated, user, router, fetchReports, reports.length, currentPage]);

  useEffect(() => {
    // Cargar el SDK de Facebook solo en cliente
    if (typeof window !== 'undefined' && !window.FB) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/es_ES/sdk.js#xfbml=1&version=v19.0&appId=3120155478148481';
      document.body.appendChild(script);
    }
  }, []);

  const handleNextPage = () => {
    if (hasMore && !isLoading) {
        fetchReports('next');
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
        fetchReports('previous');
    }
  };

  const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para votar." });
        return;
    }
    const currentReport = reports.find(report => report.id === reportId);
    if (!currentReport) {
        toast({ variant: "destructive", title: "Error", description: "Reporte no encontrado." });
        return;
    }
    if (user.uid === currentReport.userId) {
         toast({ variant: "destructive", title: "Error", description: "No puedes votar en tus propios reportes." });
         return;
     }
    if (votingState[reportId]) return;
    setVotingState(prev => ({ ...prev, [reportId]: true }));
    const originalReport = { ...currentReport };
    let optimisticUpvotes = currentReport.upvotes;
    let optimisticDownvotes = currentReport.downvotes;
    let optimisticUserVote: 'up' | 'down' | null = null;
    if (currentReport.userVote === voteType) {
        optimisticUserVote = null;
        if (voteType === 'up') optimisticUpvotes--; else optimisticDownvotes--;
    } else {
        optimisticUserVote = voteType;
        if (voteType === 'up') {
            optimisticUpvotes++;
            if (currentReport.userVote === 'down') optimisticDownvotes--;
        } else {
            optimisticDownvotes++;
            if (currentReport.userVote === 'up') optimisticUpvotes--;
        }
    }
    setReports(reports.map(rep => rep.id === reportId ? {
        ...rep, upvotes: optimisticUpvotes, downvotes: optimisticDownvotes, userVote: optimisticUserVote,
    } : rep));
    try {
        const reportRef = doc(db, "reports", reportId);
        const voteRef = doc(db, `reports/${reportId}/votes/${user.uid}`);
        const userVoteRef = doc(db, 'userVotes', `${user.uid}_${reportId}`);
        await runTransaction(db, async (transaction) => {
            const reportSnap = await transaction.get(reportRef);
            if (!reportSnap.exists()) throw new Error("El reporte ya no existe.");
            const voteDocSnap = await transaction.get(voteRef);
            const existingVote = voteDocSnap.exists() ? voteDocSnap.data().type : null;
            const reportData = reportSnap.data();
            let newUpvotes = reportData.upvotes || 0;
            let newDownvotes = reportData.downvotes || 0;
            const reportTitle = reportData.title || 'Reporte sin título';
            if (existingVote === voteType) {
                if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);
                transaction.delete(voteRef);
                transaction.delete(userVoteRef);
            } else {
                if (voteType === 'up') {
                    newUpvotes++;
                    if (existingVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
                    transaction.set(voteRef, { type: 'up' });
                    transaction.set(userVoteRef, { userId: user.uid, reportId: reportId, reportTitle: reportTitle, type: 'up', timestamp: Timestamp.now() });
                } else {
                    newDownvotes++;
                    if (existingVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                    transaction.set(voteRef, { type: 'down' });
                    transaction.set(userVoteRef, { userId: user.uid, reportId: reportId, reportTitle: reportTitle, type: 'down', timestamp: Timestamp.now() });
                }
            }
            transaction.update(reportRef, { upvotes: newUpvotes, downvotes: newDownvotes });
        });
    } catch (error: any) {
        console.error("Error updating vote:", error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
        setReports(prevReports => prevReports.map(rep => rep.id === reportId ? originalReport : rep));
    } finally {
        setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const getTypeBadgeVariant = (type: 'incidente' | 'funcionario'): 'destructive' | 'default' => {
      return type === 'incidente' ? 'destructive' : 'default';
  };
  const getTypeBadgeText = (type: 'incidente' | 'funcionario'): string => {
      return type === 'incidente' ? 'Incidente' : 'Funcionario';
  };

  const handleCreateReport = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setCheckingLimit(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const reportsRef = collection(db, "reports");
    const q = query(
      reportsRef,
      where("userId", "==", user.uid),
      where("createdAt", ">=", Timestamp.fromDate(today)),
      where("createdAt", "<", Timestamp.fromDate(tomorrow))
    );
    const snapshot = await getDocs(q);
    setCheckingLimit(false);
    if (snapshot.size >= 2) {
      setShowLimitDialog(true);
      return;
    }
    router.push("/reports/new");
  };

  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {selectedReport && (
          <VotesModal 
            open={votesModalOpen} 
            onOpenChange={setVotesModalOpen} 
            reportId={selectedReport.id}
            reportTitle={selectedReport.title}
            upvotes={selectedReport.upvotes}
            downvotes={selectedReport.downvotes}
          />
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground">Mis Reportes</h1>
                <p className="text-sm text-muted-foreground">Aquí puedes ver y gestionar los reportes que has creado.</p>
            </div>
            <Button onClick={handleCreateReport} className="w-full sm:w-auto rounded-full shadow hover:shadow-md transition-shadow">
              <Plus className="mr-2 h-4 w-4" />Reportar
            </Button>
        </div>

        {isLoading && reports.length === 0 ? (
          [...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Card key={i} className="shadow-sm bg-card rounded-lg overflow-hidden">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <Skeleton className="h-32 w-full bg-muted" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-[60%] mb-1" />
                <Skeleton className="h-3 w-[90%]" />
                <Skeleton className="h-3 w-[50%]" />
                <div className="flex justify-between items-center pt-2">
                   <Skeleton className="h-3 w-[40%]" />
                   <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : reports.length > 0 ? (
          reports.map((report) => (
             <Card key={report.id} className="shadow-md bg-card rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                 <div className="relative h-40 w-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden group">
                    {report.mediaUrl ? (
                        <>
                           {report.mediaUrl.includes('.mp4') || report.mediaUrl.includes('.webm') ? (
                              <video src={report.mediaUrl} className="h-full w-full object-cover" controls={false} preload="metadata" />
                           ) : (
                              <Image src={report.mediaUrl} alt={`Evidencia para ${report.title}`} fill style={{ objectFit: 'cover' }} className="transition-transform duration-300 group-hover:scale-105" data-ai-hint="report evidence"/>
                           )}
                           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Link href={`/reports/${report.id}`} className="text-white text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Ver Detalles</Link>
                           </div>
                         </>
                    ) : (
                        <div className="flex flex-col items-center text-center p-4">
                           <ImageIcon size={32} className="opacity-50 mb-2"/>
                           <span className="text-xs">Sin imagen adjunta</span>
                        </div>
                    )}
                   <div className="absolute top-2 left-2 z-10">
                      <Badge variant={getTypeBadgeVariant(report.reportType)} className="text-xs capitalize shadow">
                        {getTypeBadgeText(report.reportType)}
                      </Badge>
                   </div>
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 text-white hover:bg-black/60 rounded-full backdrop-blur-sm">
                                    <Ellipsis className="h-4 w-4" />
                                    <span className="sr-only">Abrir menú</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href={`/reports/${report.id}`} className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Ver detalles
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled className="text-muted-foreground flex items-center gap-2">
                                    <div
                                      className="fb-share-button ml-2"
                                      data-href={`https://tusitio.com/reports/${report.id}`}
                                      data-layout="button"
                                      data-size="small"
                                    >
                                      <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={`https://www.facebook.com/sharer/sharer.php?u=https://tusitio.com/reports/${report.id}&src=sdkpreparse`}
                                        className="fb-xfbml-parse-ignore"
                                      >
                                        Compartir en Facebook (Próximamente)
                                      </a>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                   {report.mediaUrl && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm z-10">
                        {report.mediaUrl.includes('.mp4') || report.mediaUrl.includes('.webm') ? (
                            <Video size={14} />
                         ) : (
                            <ImageIcon size={14} />
                         )}
                    </div>
                   )}
                 </div>
                 <CardContent className="p-4 flex-1 space-y-2">
                   <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                     <Link href={`/reports/${report.id}`} className="hover:text-primary transition-colors">
                       {report.title}
                     </Link>
                   </CardTitle>
                   <CardDescription className="text-xs text-muted-foreground line-clamp-3">
                     {report.description}
                   </CardDescription>
                   <div className="flex items-center text-xs text-muted-foreground gap-1.5 pt-1">
                     <MapPin size={12} className="flex-shrink-0" />
                     <span className="truncate">{formatLocation(report.location)}</span>
                   </div>
                   <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                         <CalendarDays size={12} className="flex-shrink-0" />
                         <span>{formatDistanceToNow(report.createdAt, { addSuffix: true, locale: es })}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-muted p-1 rounded-full">
                           <Button
                               variant="ghost" size="icon"
                               className={cn("h-6 w-6 rounded-full text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500", report.userVote === 'down' && "bg-blue-600/20 text-blue-600", votingState[report.id] && "opacity-50 cursor-not-allowed", user?.uid === report.userId && "cursor-not-allowed opacity-60")}
                              onClick={() => handleVote(report.id, 'down')}
                              disabled={votingState[report.id] || user?.uid === report.userId}
                              aria-pressed={report.userVote === 'down'}
                              title={user?.uid === report.userId ? "No puedes votar en tus propios reportes" : "Votar negativamente"}
                           >
                              {votingState[report.id] && report.userVote !== 'down' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                           </Button>
                           <Button 
                               variant="ghost" 
                               className="text-sm font-medium text-foreground tabular-nums w-6 text-center p-0 h-auto hover:bg-transparent hover:text-primary"
                               onClick={() => { setSelectedReport(report); setVotesModalOpen(true); }}
                               title="Ver detalles de votos"
                           >
                               {report.upvotes - report.downvotes}
                           </Button>
                           <Button
                              variant="ghost" size="icon"
                              className={cn("h-6 w-6 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500", report.userVote === 'up' && "bg-red-600/20 text-red-600", votingState[report.id] && "opacity-50 cursor-not-allowed", user?.uid === report.userId && "cursor-not-allowed opacity-60")}
                              onClick={() => handleVote(report.id, 'up')}
                              disabled={votingState[report.id] || user?.uid === report.userId}
                              aria-pressed={report.userVote === 'up'}
                              title={user?.uid === report.userId ? "No puedes votar en tus propios reportes" : "Votar positivamente"}
                           >
                              {votingState[report.id] && report.userVote !== 'up' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowUp className="h-4 w-4"/>}
                           </Button>
                       </div>
                   </div>
                 </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-sm bg-card">
            <CardContent className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">No has creado reportes aún</CardTitle>
              <CardDescription className="text-muted-foreground mb-4">
                ¡Empieza a contribuir creando tu primer reporte!
              </CardDescription>
              <Button onClick={handleCreateReport}>
                <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Reporte
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && reports.length > 0 && (hasMore || currentPage > 1) && (
          <div className="mt-8 flex justify-center">
            <Pagination>
             <PaginationContent>
               <PaginationItem>
                 <PaginationPrevious
                    onClick={handlePreviousPage}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50", isLoading && "pointer-events-none opacity-50")}
                    href="#" // Added href to make it a valid link for styling
                    aria-disabled={currentPage === 1 || isLoading}
                  />
               </PaginationItem>
               <PaginationItem>
                 <PaginationLink href="#" isActive>
                   {currentPage}
                 </PaginationLink>
               </PaginationItem>
               {hasMore && (
                 <PaginationItem>
                   <PaginationEllipsis />
                 </PaginationItem>
               )}
               <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPage}
                    className={cn(!hasMore && "pointer-events-none opacity-50", isLoading && "pointer-events-none opacity-50")}
                    href="#" // Added href to make it a valid link for styling
                    aria-disabled={!hasMore || isLoading}
                  />
               </PaginationItem>
             </PaginationContent>
           </Pagination>
          </div>
        )}
        
        {showLimitDialog && (
          <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
            <AlertDialogContent className="max-w-md text-center animate-bounce-in bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-2xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 mb-2 animate-pulse">
                  <TriangleAlert className="h-12 w-12 text-destructive" />
                </div>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-bold text-destructive mb-1">¡Límite de Reportes Alcanzado!</AlertDialogTitle>
                  <AlertDialogDescription className="text-base mt-2 text-foreground/80">
                    <span className="font-semibold text-destructive">Solo puedes crear <b>2 reportes por día</b></span>.<br/><br/>
                    <span className="text-foreground">Esta medida ayuda a:</span>
                    <ul className="text-left text-sm text-muted-foreground mt-2 mb-3 mx-auto max-w-xs list-disc list-inside">
                      <li>Evitar el <b>spam</b> y el uso indebido de la plataforma.</li>
                      <li>Garantizar que cada reporte sea <b>relevante y de calidad</b>.</li>
                      <li>Permitir que nuestro equipo revise y atienda los reportes de manera más eficiente.</li>
                      <li>Fomentar un uso responsable y colaborativo de la comunidad.</li>
                    </ul>
                    <span className="text-primary font-medium">Si tienes más incidentes, prioriza los más importantes.</span><br/>
                    <span className="text-muted-foreground">Podrás volver a reportar <b>mañana</b>. ¡Gracias por tu comprensión y por ayudar a mantener la comunidad segura! <span className="animate-wave inline-block">👋</span></span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={() => setShowLimitDialog(false)} className="mt-4 w-full py-3 rounded-full text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg">
                  Entendido
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default WelcomePage;

