
"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, startAfter, doc, getDoc, runTransaction } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MapPin, CalendarDays, ThumbsUp, ThumbsDown, Loader2, UserCog, TriangleAlert, Plus, Ellipsis } from 'lucide-react'; // Updated icons
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

// Define report type including optional status
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
    status?: string; // Optional status
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
  const [votingState, setVotingState] = useState<{ [reportId: string]: boolean }>({});

  const ITEMS_PER_PAGE = 5; // Define items per page

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
        const status = ['Nuevo', 'En Revisión', 'Verificado', 'Resuelto'][Math.floor(Math.random() * 4)];

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
            status: status, // Add placeholder status

        });
      }

      setReports(prevReports => loadMore ? [...prevReports, ...fetchedReports] : fetchedReports);
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);
      setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
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
            if (isLoading) {
                 console.log("Auth confirmed, user available. Fetching initial reports.");
                 fetchReports();
            } else {
                 console.log("Auth confirmed, user available, but not fetching (isLoading is false).");
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
  }, [authLoading, isAuthenticated, user, fetchReports, router, isLoading]);


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

    // Prevent voting on own reports (already handled in the community page logic, but good to keep)
     if (user.uid === currentReport.userId) {
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

     // Helper function to determine badge color based on status (same as community)
    const getStatusBadgeVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
        case 'Verificado':
        case 'Resuelto':
            return 'default';
        case 'En Revisión':
            return 'secondary';
        case 'Nuevo':
            return 'outline';
        default:
            return 'secondary';
        }
    };

    // Helper function to determine badge color for report type (same as community)
    const getTypeBadgeVariant = (type: 'incidente' | 'funcionario'): 'destructive' | 'default' => {
        return type === 'incidente' ? 'destructive' : 'default';
    };
    const getTypeBadgeText = (type: 'incidente' | 'funcionario'): string => {
        return type === 'incidente' ? 'Incidente' : 'Funcionario';
    };

  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-4xl mx-auto space-y-6"> {/* Adjusted max-width */}
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
            <Card key={i} className="shadow-sm bg-card rounded-lg">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-[60%] mb-2" />
                <Skeleton className="h-3 w-[90%] mb-1" />
                <Skeleton className="h-3 w-[80%] mb-3" />
                <Skeleton className="h-3 w-[50%] mb-3" />
                 <Skeleton className="h-3 w-[40%]" />
              </CardContent>
               <CardFooter className="p-3 bg-muted/50 flex justify-between items-center">
                    <div className="flex gap-3">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-6" />
                    </div>
                    <Skeleton className="h-5 w-5" />
              </CardFooter>
            </Card>
          ))
        ) : reports.length > 0 ? (
          reports.map((report) => (
             <Card key={report.id} className="shadow-sm bg-card rounded-lg overflow-hidden">
                <CardContent className="p-4 space-y-3">
                    {/* Top Section: Type, Title, Status */}
                    <div className="flex justify-between items-start w-full gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                           <Badge variant={getTypeBadgeVariant(report.reportType)} className="text-xs capitalize flex-shrink-0">
                             {getTypeBadgeText(report.reportType)}
                           </Badge>
                           <Link href={`/reports/${report.id}`} className="flex-1 min-w-0">
                             <h3 className="font-medium text-foreground leading-tight truncate hover:text-primary transition-colors">{report.title}</h3>
                           </Link>
                        </div>
                         <Badge variant={getStatusBadgeVariant(report.status)} className="text-xs flex-shrink-0">
                            {report.status || 'Desconocido'}
                         </Badge>
                    </div>
                     {/* Report Details */}
                     <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-muted-foreground/80 gap-1 sm:gap-3">
                        <div className="flex items-center min-w-0 gap-1.5">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span className="truncate">{formatLocation(report.location)}</span>
                        </div>
                        <div className="flex items-center flex-shrink-0 gap-1.5">
                            <CalendarDays size={12} className="flex-shrink-0" />
                            <span>{formatDistanceToNow(report.createdAt, { addSuffix: true, locale: es })}</span>
                        </div>
                     </div>
                 </CardContent>
                 {/* Reverted Footer with Counts */}
                 <CardFooter className="p-3 bg-muted/50 flex justify-between items-center border-t">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <ThumbsUp size={14} className="text-blue-600"/>
                         <span>{report.upvotes}</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <ThumbsDown size={14} className="text-destructive"/>
                         <span>{report.downvotes}</span>
                       </div>

                    </div>
                    {/* Options Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <Ellipsis size={16} />
                          <span className="sr-only">Opciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(`/reports/${report.id}`)}>
                          Ver Detalles
                        </DropdownMenuItem>
                         <DropdownMenuItem>Editar</DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 </CardFooter>
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

        {/* Pagination Placeholder (use loadMore logic or implement full pagination) */}
        {hasMore && !isLoading && reports.length >= ITEMS_PER_PAGE && (
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
        {/* Optional: Add full pagination if needed */}
        {/* {reports.length > 0 && (
            <div className="mt-8 flex justify-center">
                <Pagination> ... </Pagination>
            </div>
        )} */}

      </div>
    </main>
  );
};

export default WelcomePage;
    
