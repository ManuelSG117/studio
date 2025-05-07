
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
import { cn, formatLocation } from "@/lib/utils"; // Import formatLocation
import type { Report } from '@/app/(app)/welcome/page'; // Assuming Report type is exported from welcome

const CommunityReportsPage: FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Use the auth context and loading state
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Combined data loading state
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
    // We need the user to fetch votes, so ensure user exists here too
     if (!user) {
         console.error("fetchReports (Community) called without a valid user.");
         setIsLoading(false); // Ensure loading stops
         return;
     }
    console.log("Fetching community reports. Load More:", loadMore);


    if (!loadMore) {
        setIsLoading(true); // Set loading true only for initial fetch
    }
    setIsFetchingMore(loadMore);

    try {
      let q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
         console.log("Fetching more community reports starting after:", lastDoc.id);
        q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedReports: Report[] = [];
      console.log(`Found ${querySnapshot.docs.length} community reports in this batch.`);


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
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);
      setHasMore(fetchedReports.length === ITEMS_PER_PAGE);
      console.log("Community fetch complete. Has More:", fetchedReports.length === ITEMS_PER_PAGE, "New Last Doc:", newLastDoc?.id);

    } catch (error) {
      console.error("Error fetching community reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch community reports." });
    } finally {
      console.log("Setting isLoading to false in community finally block.");
      setIsLoading(false); // Ensure loading is always set to false
      setIsFetchingMore(false);
    }
  }, [user, toast, fetchUserVote, lastDoc]); // Added user and fetchUserVote


    useEffect(() => {
        console.log("CommunityReports useEffect triggered. AuthLoading:", authLoading, "IsAuthenticated:", isAuthenticated, "User:", !!user);
        // Wait for auth loading to complete
        if (!authLoading) {
            if (isAuthenticated && user) {
                // User is authenticated, fetch reports if not already loading
                if (isLoading) { // Check internal isLoading state before fetching
                    console.log("Auth confirmed, user available. Fetching initial community reports.");
                    fetchReports();
                } else {
                     console.log("Auth confirmed, user available, but not fetching community (isLoading is false).");
                }
            } else {
                // Not authenticated or user object not yet ready after auth check
                console.log("Not authenticated or user not ready, redirecting to login.");
                setIsLoading(false); // Ensure loading is stopped if redirecting
                router.replace("/login");
            }
        } else {
            console.log("Auth state still loading...");
             setIsLoading(true); // Keep loading while auth is resolving
        }
    }, [authLoading, isAuthenticated, user, fetchReports, router, isLoading]); // Added isLoading


  const loadMoreReports = () => {
     if (hasMore && lastDoc && !isFetchingMore) {
         console.log("Load more community reports triggered.");
         fetchReports(true);
     } else {
         console.log("Load more community reports skipped. HasMore:", hasMore, "LastDoc:", !!lastDoc, "isFetchingMore:", isFetchingMore);
     }
  };

 // Handle Voting Logic - Reused from welcome/page.tsx (remains the same)
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

            // Referencia a la colección de votos del usuario
            const userVoteRef = doc(db, 'userVotes', `${user.uid}_${reportId}`);
            
            if (existingVote === voteType) { // Removing vote
                if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);
                transaction.delete(voteRef);
                transaction.delete(userVoteRef); // Eliminar también de userVotes
            } else { // Adding or changing vote
                // Obtener título del reporte para guardar en userVotes
                const reportTitle = reportData.title || 'Reporte sin título';
                
                if (voteType === 'up') {
                    newUpvotes++;
                    if (existingVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
                    transaction.set(voteRef, { type: 'up' });
                    // Guardar en userVotes con timestamp
                    transaction.set(userVoteRef, {
                        userId: user.uid,
                        reportId: reportId,
                        reportTitle: reportTitle,
                        type: 'up',
                        timestamp: Timestamp.now()
                    });
                } else {
                    newDownvotes++;
                    if (existingVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                    transaction.set(voteRef, { type: 'down' });
                    // Guardar en userVotes con timestamp
                    transaction.set(userVoteRef, {
                        userId: user.uid,
                        reportId: reportId,
                        reportTitle: reportTitle,
                        type: 'down',
                        timestamp: Timestamp.now()
                    });
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

        {isLoading ? ( // Use isLoading for initial load skeleton
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
             <Card key={report.id} className="shadow-md bg-card hover:shadow-lg transition-shadow">
               <CardContent className="p-6 space-y-4"> {/* Aumentado padding y espaciado vertical */}
                    {/* Top Section: Title and Voting */}
                    <div className="flex justify-between items-center w-full border-b border-border/50 pb-4 mb-1"> {/* Aumentado padding bottom */}
                        {/* Title and Type */}
                        <Link href={`/reports/${report.id}`} className="flex items-center gap-3 flex-1 min-w-0 mr-4"> {/* Aumentado gap y margen */}
                            {report.reportType === 'funcionario' ? (
                               <UserCog className="h-5 w-5 text-primary flex-shrink-0" /> /* Aumentado tamaño de icono */
                             ) : (
                               <TriangleAlert className="h-5 w-5 text-destructive flex-shrink-0" /> /* Aumentado tamaño de icono */
                             )}
                            <h3 className="font-medium text-foreground text-lg leading-tight truncate">{report.title}</h3> {/* Aumentado tamaño de texto */}
                        </Link>
                         {/* Voting Buttons */}
                        <div className="flex items-center space-x-2 bg-muted p-1.5 rounded-full flex-shrink-0"> {/* Aumentado padding y espaciado */}
                             <Button
                                 variant="ghost"
                                 size="icon"
                                 className={cn(
                                    "h-7 w-7 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive", /* Aumentado tamaño de botón */
                                    report.userVote === 'down' && "bg-destructive/20 text-destructive",
                                    votingState[report.id] && "opacity-50 cursor-not-allowed"
                                 )}
                                onClick={() => handleVote(report.id, 'down')}
                                disabled={votingState[report.id] || user?.uid === report.userId}
                                aria-pressed={report.userVote === 'down'}
                                title="Votar negativamente"
                             >
                                {votingState[report.id] && report.userVote !== 'down' ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                             </Button>
                             <span className="text-sm font-medium text-foreground tabular-nums w-7 text-center"> {/* Aumentado ancho */}
                                 {report.upvotes - report.downvotes}
                              </span>
                             <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 rounded-full text-muted-foreground hover:bg-blue-600/10 hover:text-blue-600", /* Aumentado tamaño de botón */
                                    report.userVote === 'up' && "bg-blue-600/20 text-blue-600",
                                    votingState[report.id] && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => handleVote(report.id, 'up')}
                                disabled={votingState[report.id] || user?.uid === report.userId}
                                aria-pressed={report.userVote === 'up'}
                                title="Votar positivamente"
                             >
                                {votingState[report.id] && report.userVote !== 'up' ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowUp className="h-4 w-4"/>}
                             </Button>
                        </div>
                  </div>

                  {/* Report Details (Link) */}
                 <Link href={`/reports/${report.id}`} className="block py-1"> {/* Añadido padding vertical */}
                     {/* Description */}
                     <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{report.description}</p> {/* Aumentado líneas visibles y margen */}
                      {/* Location and Date */}
                     <div className="flex justify-between items-center text-xs text-muted-foreground/80 mt-2"> {/* Añadido margen superior */}
                        <div className="flex items-center min-w-0 mr-3"> {/* Aumentado margen */}
                            <MapPin size={14} className="mr-2 flex-shrink-0" /> {/* Aumentado tamaño de icono y margen */}
                            <span className="truncate">{formatLocation(report.location)}</span>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            <CalendarDays size={14} className="mr-2 flex-shrink-0" /> {/* Aumentado tamaño de icono y margen */}
                            <span>{format(report.createdAt, "PPP", { locale: es })}</span>
                        </div>
                     </div>
                  </Link>
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

        {/* Load More Button */}
        {hasMore && !isLoading && reports.length >= ITEMS_PER_PAGE && ( // Show only if there are enough items to potentially load more
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


    
