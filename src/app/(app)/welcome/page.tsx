"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, startAfter, doc, getDoc, runTransaction } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle  } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MapPin, CalendarDays, Loader2, UserCog, TriangleAlert, Plus, Ellipsis, Image as ImageIcon, Video, ArrowUp, ArrowDown } from 'lucide-react'; // Updated icons, ArrowUp, ArrowDown
import { format, formatDistanceToNow } from 'date-fns'; // Added formatDistanceToNow
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image'; // Keep Image import
import { cn, formatLocation } from "@/lib/utils"; // Import formatLocation
import { Badge } from "@/components/ui/badge"; // Import Badge
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination" // Import Pagination
import { VotesModal } from "@/components/votes-modal"; // Import VotesModal component

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
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Use authLoading from context
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Combined data loading state
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null); // Type any as it's a Firestore DocumentSnapshot
  const [hasMore, setHasMore] = useState(true);
  const [votingState, setVotingState = useState<{ [reportId: string]: boolean }>({});
  const [votesModalOpen, setVotesModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // For display purposes primarily

  const ITEMS_PER_PAGE = 6; // Define items per page, changed from 5 to 6

  // Function to fetch user's vote for this specific report (remains the same)
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
      return null; // Indicate no vote or an error
  }, []);

  // Fetch reports logic (remains the same, but adds placeholder status/comments)
  const fetchReports = useCallback(async (loadMore: boolean = false) => {
    if (!user) {
      console.error("fetchReports called without a valid user.");
      setIsLoading(false);
      return;
    }
    console.log("Fetching reports for user:", user.uid, "Load More:", loadMore);

    if (!loadMore) {
        setIsLoading(true);
        setLastDoc(null); // Reset lastDoc for new initial fetches
        setReports([]); // Clear current reports for a fresh fetch
        setHasMore(true); // Assume there are more reports initially
        setCurrentPage(1); // Reset page to 1 on initial fetch or filter change
    }
    setIsFetchingMore(loadMore);

    try {
      let q = query(
        collection(db, "reports"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
         console.log("Fetching more reports starting after:", lastDoc.id);
        q = query(
          collection(db, "reports"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedReports: Report[] = [];
      console.log(`Found ${querySnapshot.docs.length} reports in this batch.`);

      for (const reportDoc of querySnapshot.docs) {
        const data = reportDoc.data();
        const userVote = await fetchUserVote(user.uid, reportDoc.id);

        const createdAtDate = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date();

        // Placeholder status - replace with actual logic if status is added

        fetchedReports.push({
            id: reportDoc.id,
            userId: data.userId,
            userEmail: data.userEmail || null,
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
            userVote: userVote,

        });
      }

      setReports(prevReports => loadMore ? [...prevReports, ...fetchedReports] : fetchedReports);
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);
      setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
      if (loadMore && fetchedReports.length > 0) {
        setCurrentPage(prev => prev + 1);
      }
      console.log("Fetch complete. Has More:", fetchedReports.length === ITEMS_PER_PAGE, "New Last Doc:", newLastDoc?.id);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch reports." });
    } finally {
      console.log("Setting isLoading to false in finally block.");
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [user, toast, fetchUserVote, lastDoc]);

  // useEffect for initial load and auth check (remains the same)
  useEffect(() => {
    console.log("WelcomePage useEffect triggered. AuthLoading:", authLoading, "IsAuthenticated:", isAuthenticated, "User:", !!user);
    if (!authLoading) {
        if (isAuthenticated && user) {
            // Fetch initial reports only if reports array is empty and not currently loading
            if (reports.length === 0 && !isLoading && !isFetchingMore) {
                 console.log("Auth confirmed, user available. Fetching initial reports.");
                 fetchReports();
            } else {
                 console.log("Auth confirmed, user available, but not fetching (reports not empty or loading).");
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
  }, [authLoading, isAuthenticated, user, fetchReports, router, reports.length, isLoading, isFetchingMore]);


  const loadMoreReports = () => {
    if (hasMore && lastDoc && !isFetchingMore) {
        console.log("Load more reports triggered.");
        fetchReports(true);
    } else {
        console.log("Load more reports skipped. HasMore:", hasMore, "LastDoc:", !!lastDoc, "isFetchingMore:", isFetchingMore);
    }
  };

  // Handle Voting Logic (remains the same)
  const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para votar." });
        return;
    }

    const currentReport = reports.find(report => report.id === reportId);
    if (!currentReport) {
        toast({ variant: "destructive", title: "Error", description: "Reporte no encontrado." });
        setVotingState(prev => ({ ...prev, [reportId]: false }));
        return;
    }

    // Prevent voting on own reports
     if (user.uid === currentReport.userId) {
         // Do nothing, or show a disabled state / tooltip
         toast({ variant: "destructive", title: "Error", description: "No puedes votar en tus propios reportes." });
         return;
     }

    if (votingState[reportId]) return;

    setVotingState(prev => ({ ...prev, [reportId]: true }));


        const currentVote = currentReport.userVote;
        const originalReport = { ...currentReport };

        // Optimistic UI Update (same as community page)
        let optimisticUpvotes = currentReport.upvotes;
        let optimisticDownvotes = currentReport.downvotes;
        let optimisticUserVote: 'up' | 'down' | null = null;

        if (currentVote === voteType) {
            optimisticUserVote = null;
            if (voteType === 'up') optimisticUpvotes--; else optimisticDownvotes--;
        } else {
            optimisticUserVote = voteType;
            if (voteType === 'up') {
                optimisticUpvotes++;
                if (currentVote === 'down') optimisticDownvotes--;
            } else {
                optimisticDownvotes++;
                if (currentVote === 'up') optimisticUpvotes--;
            }
        }

        const optimisticReports = reports.map(rep => rep.id === reportId ? {
            ...rep,
            upvotes: optimisticUpvotes,
            downvotes: optimisticDownvotes,
            userVote: optimisticUserVote,
        } : rep);
        setReports(optimisticReports);

        // Firestore Update (same as community page)
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
            console.log("Vote transaction committed successfully for report:", reportId);

        } catch (error: any) {
            console.error("Error updating vote:", error);
            toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
            setReports(prevReports => prevReports.map(rep => rep.id === reportId ? originalReport : rep));
        } finally {
            setVotingState(prev => ({ ...prev, [reportId]: false }));
        }
    };



    // Helper function to determine badge color for report type (same as community)
    const getTypeBadgeVariant = (type: 'incidente' | 'funcionario'): 'destructive' | 'default' => {
        return type === 'incidente' ? 'destructive' : 'default';
    };
    const getTypeBadgeText = (type: 'incidente' | 'funcionario'): string => {
        return type === 'incidente' ? 'Incidente' : 'Funcionario';
    };

    const handlePreviousPage = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        toast({ title: "Info", description: "Función 'Anterior' no implementada aún para paginación real." });
        // To implement:
        // if (currentPage > 1) {
        //   setCurrentPage(prev => prev - 1);
        //   // Need logic to fetch previous page using cursors or by page number
        // }
    };

    const handleNextPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (hasMore && !isFetchingMore) {
            loadMoreReports(); // This loads the next set of items
        }
    };


  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-4xl mx-auto space-y-6"> {/* Adjusted max-width */}
        {/* Modal de votos */}
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
            <Button asChild className="w-full sm:w-auto rounded-full shadow hover:shadow-md transition-shadow">
              <Link href="/reports/new">
                <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Reporte
              </Link>
            </Button>
        </div>

        {isLoading ? ( // Use isLoading for initial load skeleton
          [...Array(3)].map((_, i) => (
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
                 {/* Media Preview Area */}
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

                   {/* Badges Overlay */}
                   <div className="absolute top-2 left-2 z-10">
                      <Badge variant={getTypeBadgeVariant(report.reportType)} className="text-xs capitalize shadow">
                        {getTypeBadgeText(report.reportType)}
                      </Badge>
                   </div>
                    {/* Dropdown Menu */}
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
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Compartir en Facebook (Próximamente)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                   {/* Media Type Icon */}
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
                      {/* Voting Section */}
                      <div className="flex items-center space-x-1 bg-muted p-1 rounded-full">
                           <Button
                               variant="ghost"
                               size="icon"
                               className={cn(
                                   "h-6 w-6 rounded-full text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500",
                                   report.userVote === 'down' && "bg-blue-600/20 text-blue-600",
                                   votingState[report.id] && "opacity-50 cursor-not-allowed",
                                   user?.uid === report.userId && "cursor-not-allowed opacity-60"
                               )}
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
                               onClick={() => {
                                   setSelectedReport(report);
                                   setVotesModalOpen(true);
                               }}
                               title="Ver detalles de votos"
                           >
                               {report.upvotes - report.downvotes}
                           </Button>
                           <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                  "h-6 w-6 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500",
                                  report.userVote === 'up' && "bg-red-600/20 text-red-600",
                                  votingState[report.id] && "opacity-50 cursor-not-allowed",
                                  user?.uid === report.userId && "cursor-not-allowed opacity-60"
                              )}
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
              <Button asChild>
                <Link href="/reports/new"> <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Reporte</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination: Show if not loading, there are reports, AND (there are more pages OR we are not on the first page) */}
        {!isLoading && reports.length > 0 && (hasMore || currentPage > 1) && (
          <div className="text-center mt-4">
            <Pagination>
             <PaginationContent>
               <PaginationItem>
                 <PaginationPrevious
                    onClick={handlePreviousPage}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  />
               </PaginationItem>
               {/* Page numbers are for display; actual navigation is cursor-based for next */}
               <PaginationItem>
                 <PaginationLink href="#" isActive={currentPage === 1}>1</PaginationLink>
               </PaginationItem>
               {currentPage > 2 && reports.length >= ITEMS_PER_PAGE && <PaginationItem><PaginationEllipsis /></PaginationItem>}
               {currentPage > 1 && currentPage < (reports.length / ITEMS_PER_PAGE + (reports.length % ITEMS_PER_PAGE > 0 ? 1 : 0)) && ( // A more dynamic way to show current page if not 1
                   <PaginationItem>
                       <PaginationLink href="#" isActive>{currentPage}</PaginationLink>
                   </PaginationItem>
               )}
                {/* Add more page numbers if needed, but true navigation is complex */}
               <PaginationItem>
                  <PaginationNext
                    onClick={handleNextPageClick}
                    className={cn(!hasMore && "pointer-events-none opacity-50")}
                  />
               </PaginationItem>
             </PaginationContent>
           </Pagination>
          </div>
        )}
        
        {/* Load More Button - DEPRECATED in favor of Pagination's Next button, but kept for reference or if pagination is removed.
        {hasMore && !isLoading && reports.length >= ITEMS_PER_PAGE && (lastDoc === null || reports.length < ITEMS_PER_PAGE * 2) && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={loadMoreReports}
              disabled={isFetchingMore}
              className="rounded-full"
            >
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cargar más reportes
            </Button>
          </div>
        )}
        */}

      </div>
       {/* Footer */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default WelcomePage;
