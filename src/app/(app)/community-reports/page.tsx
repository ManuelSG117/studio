"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, startAfter, doc, getDoc, runTransaction } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MapPin, CalendarDays, ArrowUp, ArrowDown, Loader2, UserCog, TriangleAlert } from 'lucide-react'; // Ensure all used icons are imported
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import type { Report } from '@/app/(app)/welcome/page'; // Assuming Report type is exported from welcome

const CommunityReportsPage: FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth(); // Use the auth context
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [votingState, setVotingState] = useState<{ [reportId: string]: boolean }>({});

  const ITEMS_PER_PAGE = 10; // Adjust as needed

    // Function to fetch user's vote for a specific report
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

  const fetchReports = useCallback(async (loadMore: boolean = false) => {
    // Ensure user is authenticated before fetching
    if (!isAuthenticated) {
       console.log("User not authenticated, skipping fetch.");
       setIsLoading(false); // Stop loading if not authenticated
       router.replace("/login"); // Redirect if not authenticated
       return;
    }

     if (!user) {
         console.log("User object not yet available, waiting...");
         setIsLoading(true); // Keep loading until user object is available
         return;
     }

    setIsLoading(true);
    setIsFetchingMore(loadMore);

    try {
      let q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedReports: Report[] = [];

       for (const reportDoc of querySnapshot.docs) { // Renamed variable
         const data = reportDoc.data();
          // Fetch the current user's vote for this report
          const userVote = await fetchUserVote(user.uid, reportDoc.id); // Pass correct user ID

          const createdAtDate = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();

          fetchedReports.push({
              id: reportDoc.id,
              userId: data.userId, // Make sure userId is fetched
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
              userVote: userVote, // Include the fetched vote
          });
       }

      setReports(prevReports => loadMore ? [...prevReports, ...fetchedReports] : fetchedReports);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch community reports." });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [isAuthenticated, user, router, toast, fetchUserVote, lastDoc]); // Added user and fetchUserVote


    useEffect(() => {
        if (isAuthenticated !== null) { // Wait until authentication status is determined
             fetchReports();
        }
    }, [fetchReports, isAuthenticated]); // Depend on isAuthenticated status

  const loadMoreReports = () => {
    if (hasMore && lastDoc) {
      fetchReports(true);
    }
  };

 // Handle Voting Logic - Reused from welcome/page.tsx
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
        toast({ variant: "destructive", title: "Error", description: "No puedes votar en tus propios reportes." });
        return;
    }

    if (votingState[reportId]) return; // Prevent multiple clicks while processing

    setVotingState(prev => ({ ...prev, [reportId]: true }));

    const currentVote = currentReport.userVote;
    const originalReport = { ...currentReport }; // Store original state for rollback

    // Optimistic UI Update
    let optimisticUpvotes = currentReport.upvotes;
    let optimisticDownvotes = currentReport.downvotes;
    let optimisticUserVote: 'up' | 'down' | null = null;

    if (currentVote === voteType) { // Removing vote
        optimisticUserVote = null;
        if (voteType === 'up') optimisticUpvotes--; else optimisticDownvotes--;
    } else { // Adding or changing vote
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

    // --- Firestore Update ---
    try {
        const reportRef = doc(db, "reports", reportId);
        const voteRef = doc(db, `reports/${reportId}/votes/${user.uid}`);

        await runTransaction(db, async (transaction) => {
            const reportSnap = await transaction.get(reportRef);
            if (!reportSnap.exists()) throw new Error("El reporte ya no existe.");

            const voteDocSnap = await transaction.get(voteRef);
            const existingVote = voteDocSnap.exists() ? voteDocSnap.data().type : null;

            const reportData = reportSnap.data();
            let newUpvotes = reportData.upvotes || 0;
            let newDownvotes = reportData.downvotes || 0;

            if (existingVote === voteType) { // Removing vote
                if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);
                transaction.delete(voteRef);
            } else { // Adding or changing vote
                if (voteType === 'up') {
                    newUpvotes++;
                    if (existingVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
                    transaction.set(voteRef, { type: 'up', timestamp: Timestamp.now() });
                } else {
                    newDownvotes++;
                    if (existingVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                    transaction.set(voteRef, { type: 'down', timestamp: Timestamp.now() });
                }
            }
            transaction.update(reportRef, { upvotes: newUpvotes, downvotes: newDownvotes });
        });
        console.log("Vote updated successfully for report:", reportId);
    } catch (error: any) {
        console.error("Error updating vote:", error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
        // Revert optimistic update on error
        setReports(prevReports => prevReports.map(rep => rep.id === reportId ? originalReport : rep));
    } finally {
        setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
};


  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary min-h-screen">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-foreground text-center mb-4">Reportes de la Comunidad</h1>

        {isLoading ? (
           [...Array(5)].map((_, i) => ( // Show more skeletons initially
            <Card key={i} className="shadow-sm bg-card">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="h-3 w-[90%] mt-2" />
                <Skeleton className="h-3 w-[50%] mt-1" />
              </CardContent>
            </Card>
          ))
        ) : reports.length > 0 ? (
           reports.map((report) => (
             <Card key={report.id} className="shadow-sm bg-card">
               <CardContent className="p-4">
                  {/* Link to details page */}
                 <Link href={`/reports/${report.id}`} className="block">
                     <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                             {report.reportType === 'funcionario' ? (
                               <UserCog className="h-4 w-4 text-primary flex-shrink-0" />
                             ) : (
                               <TriangleAlert className="h-4 w-4 text-destructive flex-shrink-0" />
                             )}
                            <h3 className="font-medium text-foreground leading-tight">{report.title}</h3>
                        </div>
                         <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {format(report.createdAt, "PPP", { locale: es })} {/* Format date */}
                         </span>
                     </div>
                     <p className="text-sm text-muted-foreground line-clamp-2 my-2">{report.description}</p>
                     <div className="flex items-center text-xs text-muted-foreground/80">
                        <MapPin size={12} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{report.location}</span>
                     </div>
                  </Link>
                  {/* Voting Section */}
                  <div className="flex justify-end items-center space-x-3 w-full mt-3 pt-3 border-t border-border/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-green-600 hover:bg-green-100/50 dark:hover:bg-green-900/20",
                                report.userVote === 'up' && "text-green-600 bg-green-100/60 dark:bg-green-900/30",
                                votingState[report.id] && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => handleVote(report.id, 'up')}
                            disabled={votingState[report.id] || user?.uid === report.userId} // Disable if voting or user owns report
                            aria-pressed={report.userVote === 'up'}
                            title="Votar positivamente"
                        >
                            {votingState[report.id] && report.userVote !== 'up' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowUp className="h-4 w-4"/>}
                             <span>{report.upvotes}</span>
                        </Button>
                         <Button
                             variant="ghost"
                             size="sm"
                             className={cn(
                                "flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20",
                                report.userVote === 'down' && "text-red-600 bg-red-100/60 dark:bg-red-900/30",
                                votingState[report.id] && "opacity-50 cursor-not-allowed"
                             )}
                            onClick={() => handleVote(report.id, 'down')}
                            disabled={votingState[report.id] || user?.uid === report.userId} // Disable if voting or user owns report
                            aria-pressed={report.userVote === 'down'}
                            title="Votar negativamente"
                         >
                            {votingState[report.id] && report.userVote !== 'down' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                            <span>{report.downvotes}</span>
                        </Button>
                  </div>
               </CardContent>
             </Card>
           ))
        ) : (
           <Card className="shadow-sm bg-card">
             <CardContent className="p-6 text-center">
               <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
               <CardTitle className="text-xl font-semibold mb-2">No hay reportes de la comunidad</CardTitle>
               <CardDescription className="text-muted-foreground">
                 Aún no se han creado reportes por otros usuarios. ¡Sé el primero en crear uno!
               </CardDescription>
             </CardContent>
           </Card>
        )}

        {hasMore && !isLoading && reports.length > 0 && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={loadMoreReports}
              disabled={isFetchingMore}
            >
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cargar más reportes
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default CommunityReportsPage;