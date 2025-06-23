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
import { useIsMobile } from '@/hooks/use-mobile';

// Add window.FB type declaration
declare global {
  interface Window {
    FB?: any; // Basic type for Facebook SDK
    fbAsyncInit?: () => void; // For SDK initialization
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
  const [isPaginating, setIsPaginating] = useState(false);
  const isMobile = useIsMobile();

  const ITEMS_PER_PAGE = 6;

  const fetchUserVote = useCallback(async (userId: string, reportId: string) => {
      try {
          const voteDocRef = doc(db, `reports/${reportId}/votes/${userId}`);
          const voteDocSnap = await getDoc(voteDocRef);
          if (voteDocSnap.exists()) {
              return voteDocSnap.data().type as 'up' | 'down';
          }
      } catch (error) {
    //      console.error("Error fetching user vote: ", error);
      }
      return null;
  }, []);

  const fetchReports = useCallback(async (direction: 'initial' | 'next' | 'previous') => {
    if (!user) {
   //   console.error("fetchReports called without a valid user.");
      setIsLoading(false);
      return;
    }

    // Prevent unnecessary API calls when we know there are no more results
    if (direction === 'next' && !hasMore) {
      return;
    }

    if (direction === 'initial') {
      setIsLoading(true);
    } else {
      setIsPaginating(true);
    }

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
        setIsLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      
      // If no results found and it's not the initial load, keep current state and disable hasMore
      if (querySnapshot.empty) {
        if (direction !== 'initial') {
          setHasMore(false);
        }
        setIsLoading(false);
        return;
      }

      const fetchedReports: Report[] = [];
   //   console.log(`Found ${querySnapshot.docs.length} reports in this batch for WelcomePage.`);

      for (const reportDoc of querySnapshot.docs) {
        const data = reportDoc.data();
        const userVote = await fetchUserVote(user.uid, reportDoc.id);
        const createdAtDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
        fetchedReports.push({
            id: reportDoc.id,
            userId: data.userId, userEmail: data.userEmail || null,
            reportType: data.reportType, title: data.title, description: data.description,
            location: data.location, mediaUrl: data.mediaUrl || null,
            latitude: data.latitude || null, longitude: data.longitude || null,
            createdAt: createdAtDate, upvotes: data.upvotes || 0, downvotes: data.downvotes || 0,
            userVote: userVote,
        });
      }
      
      // Update hasMore before setting the reports
      const newHasMore = querySnapshot.docs.length === ITEMS_PER_PAGE;
      setHasMore(newHasMore);
      
      if (fetchedReports.length > 0) {
        setReports(fetchedReports);
        setFirstVisibleDoc(querySnapshot.docs[0]);
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        
        if (direction === 'next') {
          setCurrentPage(prev => prev + 1);
        } else if (direction === 'previous') {
          setCurrentPage(prev => prev - 1);
        } else if (direction === 'initial') {
          setCurrentPage(1);
        }
      }

    } catch (error) {
      //console.error("Error fetching reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch reports." });
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  }, [user, toast, fetchUserVote, lastVisibleDoc, firstVisibleDoc, currentPage, hasMore]);

  useEffect(() => {
    if (!authLoading) {
        if (isAuthenticated && user) {
            if (reports.length === 0 && currentPage === 1) { 
            //     console.log("Auth confirmed, fetching initial reports for WelcomePage.");
                 fetchReports('initial');
            }
        } else {
         //   console.log("Not authenticated or user not ready, redirecting to login.");
            setIsLoading(false);
            router.replace("/auth");
        }
    } else {
     //   console.log("Auth state still loading...");
         setIsLoading(true);
    }
  }, [authLoading, isAuthenticated, user, router, fetchReports, reports.length, currentPage]);

  useEffect(() => {
    // Load the Facebook SDK only on the client side
    if (typeof window !== 'undefined' && !window.FB) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = "https://connect.facebook.net/es_LA/sdk.js"; // Or your preferred locale
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);

      window.fbAsyncInit = function() {
        window.FB.init({
          appId            : '3120155478148481', // Your App ID
          cookie           : true,
          xfbml            : true,
          version          : 'v19.0'
        });
      };
    }
  }, []);

  const handleFacebookShare = (reportId: string) => {
    const reportUrl = `${window.location.origin}/reports/${reportId}`;
    if (window.FB) {
      window.FB.ui({
        method: 'share',
        href: reportUrl,
      }, function(response: any){
        if (response && !response.error_message) {
          toast({ title: "Compartido", description: "El reporte se ha compartido en Facebook." });
        } else {
          // console.log('Facebook Share Error/Closed:', response); 
          // Optionally inform user if sharing was cancelled or failed, but be mindful of dialog closures
        }
      });
    } else {
      toast({ variant: "destructive", title: "Error", description: "El SDK de Facebook no está listo. Intenta de nuevo en un momento." });
    }
  };

  const handleNextPage = () => {
    if (hasMore && lastVisibleDoc && !isLoading) {
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
                } else {
                    newDownvotes++;
                    if (existingVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                }
                // Always set/update the vote document (both in reports/votes and userVotes)
                transaction.set(voteRef, { type: voteType });
                transaction.set(userVoteRef, { userId: user.uid, reportId: reportId, reportTitle: reportTitle, type: voteType, timestamp: Timestamp.now() });
            }
            transaction.update(reportRef, { upvotes: newUpvotes, downvotes: newDownvotes });
        });
    } catch (error: any) {
       // console.error("Error updating vote:", error);
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
      router.push("/auth");
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

  const handlePreviousPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPage > 1 && !isLoading) {
      fetchReports('previous');
    }
  };

  const handleNextPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (hasMore && lastVisibleDoc && !isLoading) {
      fetchReports('next');
    }
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
          
   
        <Button asChild size="lg" className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-shadow">
                <Link href="/reports/new">
                    <Plus className="mr-2 h-5 w-5" />Reportar
                </Link>
            </Button>
        </div>

        {(isLoading && reports.length === 0) || isPaginating ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
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
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {reports.map((report) => (
               <Card
                 key={report.id}
                 className="shadow-md bg-card rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                 {...(isMobile ? {
                   onClick: () => router.push(`/reports/${report.id}`),
                   style: { cursor: 'pointer' },
                 } : {})}
               >
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-black/40 text-white hover:bg-black/60 rounded-full backdrop-blur-sm"
                                    onClick={e => isMobile && e.stopPropagation()}
                                  >
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
                                  <DropdownMenuItem onClick={() => handleFacebookShare(report.id)} className="flex items-center gap-2 cursor-pointer">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-facebook h-4 w-4" viewBox="0 0 16 16">
                                         <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0 0 3.592 0 8.049 0 12.069 2.91 15.275 6.75 15.979V10.37H4.849V8.05h1.9V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.32H9.25V15.97A8.025 8.025 0 0 0 16 8.049z"/>
                                     </svg>
                                     Compartir en Facebook
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
                                 variant="ghost"
                                 size="icon"
                                 className={cn("h-6 w-6 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500", report.userVote === 'down' && "bg-red-600/20 text-red-600", votingState[report.id] && "opacity-50 cursor-not-allowed", user?.uid === report.userId && "cursor-not-allowed opacity-60")}
                                onClick={e => { e.stopPropagation(); handleVote(report.id, 'down'); }}
                                disabled={votingState[report.id] || user?.uid === report.userId}
                                aria-pressed={report.userVote === 'down'}
                                title={user?.uid === report.userId ? "No puedes votar en tus propios reportes" : "Votar negativamente"}
                             >
                                {votingState[report.id] && report.userVote !== 'down' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                             </Button>
                             <Button 
                                 variant="ghost" 
                                 className="text-sm font-medium text-foreground tabular-nums w-6 text-center p-0 h-auto hover:bg-transparent hover:text-primary"
                                 onClick={e => { e.stopPropagation(); setSelectedReport(report); setVotesModalOpen(true); }}
                                 title="Ver detalles de votos"
                             >
                                 {report.upvotes - report.downvotes}
                             </Button>
                             <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6 rounded-full text-muted-foreground hover:bg-green-500/10 hover:text-green-500", report.userVote === 'up' && "bg-green-600/20 text-green-600", votingState[report.id] && "opacity-50 cursor-not-allowed", user?.uid === report.userId && "cursor-not-allowed opacity-60")}
                                onClick={e => { e.stopPropagation(); handleVote(report.id, 'up'); }}
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
            ))}
          </div>
        ) : (
          <Card className="shadow-sm bg-card col-span-full rounded-lg"> {/* Added col-span-full for when it's inside a grid */}
            <CardContent className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">No has creado reportes aún</CardTitle>
              <CardDescription className="text-muted-foreground mb-4">
                ¡Empieza a contribuir creando tu primer reporte!
              </CardDescription>
              <Button  size="lg" className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-shadow"  onClick={handleCreateReport}>
                <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Reporte
              </Button>
            </CardContent>
          </Card>
        )}
        

        {/* Modify the pagination controls to show loading state */}
        {!isLoading && !isPaginating && reports.length > 0 && (hasMore || currentPage > 1) && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePreviousPageClick}
                    className={cn(
                      currentPage === 1 && "pointer-events-none opacity-50",
                      (isLoading || isPaginating) && "pointer-events-none opacity-50"
                    )}
                    href="#"
                    aria-disabled={currentPage === 1 || isLoading || isPaginating}
                  >
                    {isPaginating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Previous"
                    )}
                  </PaginationPrevious>
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
                    onClick={handleNextPageClick}
                    className={cn(
                      (!hasMore || !lastVisibleDoc) && "pointer-events-none opacity-50",
                      (isLoading || isPaginating) && "pointer-events-none opacity-50"
                    )}
                    href="#"
                    aria-disabled={!hasMore || !lastVisibleDoc || isLoading || isPaginating}
                  >
                    {isPaginating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Next"
                    )}
                  </PaginationNext>
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
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes de seguridad y prevención de incidentes en Uruapan
      </footer>
    </main>
  );
};

export default WelcomePage;

