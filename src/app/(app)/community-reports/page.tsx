"use client";

import type { FC } from "react";
import { useEffect, useState, useMemo, useCallback } from "react"; // Added useCallback
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, Timestamp, doc, runTransaction } from "firebase/firestore"; // Removed 'where', added doc, runTransaction
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge"; // Badge removed
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Search, UserCog, TriangleAlert, MapPin, Plus, Loader2, CalendarDays, Globe, ArrowUp, ArrowDown } from "lucide-react"; // Added Globe icon, ArrowUp, ArrowDown
import Image from "next/image"; // Import Image
import { format } from 'date-fns'; // Import format for date display
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting
import type { Report } from '@/app/(app)/welcome/page'; // Reuse Report type from welcome page
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { cn } from "@/lib/utils"; // Import cn

// Helper function to extract street and neighborhood from location string (same as welcome page)
const formatLocation = (location: string): string => {
    if (!location) return "Ubicación no disponible";
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
        if (/^Lat: .+ Lon: .+$/.test(parts[0])) {
           return parts[0];
        }
        return `${parts[0]}, ${parts[1]}`;
    }
    return location;
};


const CommunityReportsPage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [reports, setReports] = useState<Report[]>([]); // State for fetched reports
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'Todos' | 'Funcionarios' | 'Incidentes'>('Todos');
  const [votingState, setVotingState] = useState<Record<string, boolean>>({}); // Track voting status per report

   // Function to fetch user's votes (same as welcome page)
   const fetchUserVotes = useCallback(async (userId: string, reportIds: string[]) => {
     const votes: Record<string, 'up' | 'down'> = {};
     console.log("Simulating fetch for user votes for community reports:", reportIds);
     // In a real app, fetch from Firestore 'votes' subcollection for each report
     // Example:
     // const batch = writeBatch(db); // Consider batch reads if performance is critical
     // const votePromises = reportIds.map(async (reportId) => {
     //   const voteDocRef = doc(db, `reports/${reportId}/votes/${userId}`);
     //   const voteDocSnap = await getDoc(voteDocRef); // Use getDoc directly for individual reads
     //   if (voteDocSnap.exists()) {
     //     votes[reportId] = voteDocSnap.data().type as 'up' | 'down';
     //   }
     // });
     // await Promise.all(votePromises);
     return votes;
   }, []);


  useEffect(() => {
    setIsLoading(true); // Start loading
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch ALL reports from Firestore
        try {
          console.log("Fetching all community reports from Firestore...");
          const reportsCollectionRef = collection(db, "reports");
          // Query all reports, ordered by creation date descending
          const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          const reportIds: string[] = [];
          const fetchedReports: Report[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAtDate = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();
            reportIds.push(doc.id); // Collect report IDs

            return {
              id: doc.id,
              userId: data.userId,
              userEmail: data.userEmail,
              reportType: data.reportType,
              title: data.title,
              description: data.description,
              location: data.location,
              mediaUrl: data.mediaUrl || null,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              createdAt: createdAtDate,
              upvotes: data.upvotes || 0, // Default to 0
              downvotes: data.downvotes || 0, // Default to 0
              userVote: null, // Initialize userVote
            } as Report;
          });

          // Fetch user votes for the fetched community reports
          const userVotes = await fetchUserVotes(currentUser.uid, reportIds);

          // Merge user votes into the fetched reports
          const reportsWithVotes = fetchedReports.map(report => ({
            ...report,
            userVote: userVotes[report.id] || null,
          }));

          console.log("Fetched community reports:", reportsWithVotes.length);
          setReports(reportsWithVotes);
        } catch (error) {
          console.error("Error fetching community reports: ", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los reportes de la comunidad." });
        } finally {
           setIsLoading(false); // Stop loading after fetch attempt
        }
      } else {
        router.replace("/login"); // Redirect to login if not authenticated
        setIsLoading(false); // Stop loading if no user
      }
    });

    return () => unsubscribe();
  }, [router, toast, fetchUserVotes]); // Added dependencies

  // Memoize filtered reports (same logic as welcome page)
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesFilter =
        filter === 'Todos' ||
        (filter === 'Funcionarios' && report.reportType === 'funcionario') ||
        (filter === 'Incidentes' && report.reportType === 'incidente');

      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [reports, searchTerm, filter]);

   // Handle Voting Logic (same as welcome page)
   const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para votar." });
        return;
    }
    if (votingState[reportId]) return;

    setVotingState(prev => ({ ...prev, [reportId]: true }));

    const reportIndex = reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return;

    const currentReport = reports[reportIndex];
    const currentVote = currentReport.userVote;
    const originalReport = { ...currentReport };

    // Optimistic UI Update
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

    const optimisticReports = [...reports];
    optimisticReports[reportIndex] = {
        ...currentReport,
        upvotes: optimisticUpvotes,
        downvotes: optimisticDownvotes,
        userVote: optimisticUserVote,
    };
    setReports(optimisticReports);

    // --- Firestore Update ---
    try {
        const reportRef = doc(db, "reports", reportId);
        // const voteRef = doc(db, `reports/${reportId}/votes/${user.uid}`); // For real implementation

        await runTransaction(db, async (transaction) => {
            const reportSnap = await transaction.get(reportRef);
            if (!reportSnap.exists()) throw new Error("El reporte ya no existe.");

            const reportData = reportSnap.data();
            let newUpvotes = reportData.upvotes || 0;
            let newDownvotes = reportData.downvotes || 0;

            // Logic based on assumed `currentVote` (ideally fetch from subcollection)
            if (currentVote === voteType) {
                if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                else newDownvotes = Math.max(0, newDownvotes - 1);
                 // In real app: transaction.delete(voteRef);
            } else {
                if (voteType === 'up') {
                   newUpvotes++;
                   if (currentVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
                    // In real app: transaction.set(voteRef, { type: 'up', timestamp: Timestamp.now() });
                } else {
                   newDownvotes++;
                   if (currentVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                    // In real app: transaction.set(voteRef, { type: 'down', timestamp: Timestamp.now() });
                }
            }
            transaction.update(reportRef, { upvotes: newUpvotes, downvotes: newDownvotes });
        });
        console.log("Vote updated successfully for community report:", reportId);
    } catch (error: any) {
        console.error("Error updating vote:", error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
        // Revert optimistic update
        setReports(prevReports => {
            const revertedReports = [...prevReports];
            revertedReports[reportIndex] = originalReport;
            return revertedReports;
        });
    } finally {
        setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
};


  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 bg-secondary">
        <div className="w-full max-w-2xl space-y-4">
           {/* Header Skeleton Removed */}
           <Skeleton className="h-11 w-full mb-4 rounded-full" />
           <div className="flex space-x-3 mb-6">
             <Skeleton className="h-9 w-24 rounded-full" />
             <Skeleton className="h-9 w-32 rounded-full" />
             <Skeleton className="h-9 w-28 rounded-full" />
           </div>
           {/* Report Card Skeletons */}
           {[1, 2, 3].map((i) => (
             <Card key={i} className="w-full shadow-sm mb-4 bg-card rounded-lg border border-border">
               <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5 relative">
                  <div className="flex items-center space-x-2 flex-1 pr-16">
                     <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                     <Skeleton className="h-5 w-3/5" />
                  </div>
               </CardHeader>
               <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-4/5" />
                 <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                   {/* Vote Skeletons */}
                   <div className="flex justify-end items-center space-x-3 pt-2">
                     <Skeleton className="h-6 w-12 rounded-md" />
                     <Skeleton className="h-6 w-12 rounded-md" />
                   </div>
               </CardContent>
             </Card>
           ))}
           {/* FAB Skeleton (if applicable to this view) */}
           {/* <Skeleton className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-full shadow-lg z-40" /> */}
        </div>
      </main>
    );
  }


  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary">
      <div className="w-full max-w-2xl">
        {/* Header Removed */}

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar reportes en la comunidad..."
            className="w-full rounded-full bg-background pl-9 pr-4 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-3 mb-6 overflow-x-auto pb-2">
          {(['Todos', 'Funcionarios', 'Incidentes'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full px-5 h-9 shrink-0 ${
                filter === filterType
                  ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
              onClick={() => setFilter(filterType)}
            >
              {filterType}
            </Button>
          ))}
        </div>

        {/* Report List */}
        <div className="space-y-4 pb-20"> {/* Add padding-bottom if using bottom nav */}
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              // Link to the same detail page as welcome reports
               <Card key={report.id} className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card transition-colors duration-150">
                <Link href={`/reports/${report.id}`} className="block hover:bg-card/50">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5 relative cursor-pointer">
                      <div className="flex items-center space-x-2 flex-1 pr-4">
                         {report.reportType === 'funcionario' ? (
                           <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                         ) : (
                           <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                         )}
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-1">{report.title}</CardTitle>
                      </div>
                       {/* Removed Badge */}
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5 cursor-pointer">
                    <CardDescription className="text-sm text-foreground/90 leading-relaxed line-clamp-2">{report.description}</CardDescription>
                     <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                       {/* Formatted Location */}
                       <div className="flex items-center">
                           <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0"/>
                           <span className="line-clamp-1">{formatLocation(report.location)}</span>
                       </div>
                       {/* Date */}
                       <div className="flex items-center text-xs">
                           <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                           <span>{format(report.createdAt, "PPP", { locale: es })}</span>
                       </div>
                     </div>
                  </CardContent>
                 </Link>
                  {/* Voting Section */}
                  <div className="flex justify-end items-center space-x-3 px-4 pb-3 pt-1 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                           "flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-green-600 hover:bg-green-100/50 dark:hover:bg-green-900/20",
                           report.userVote === 'up' && "text-green-600 bg-green-100/60 dark:bg-green-900/30",
                           votingState[report.id] && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleVote(report.id, 'up')}
                        disabled={votingState[report.id]}
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
                             report.userVote === 'down' && "text-red-600 bg-green-100/60 dark:bg-red-900/30",
                             votingState[report.id] && "opacity-50 cursor-not-allowed"
                           )}
                          onClick={() => handleVote(report.id, 'down')}
                          disabled={votingState[report.id]}
                          aria-pressed={report.userVote === 'down'}
                          title="Votar negativamente"
                     >
                          {votingState[report.id] && report.userVote !== 'down' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                          <span>{report.downvotes}</span>
                     </Button>
                  </div>
                </Card>
            ))
          ) : (
            <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
               <CardContent className="p-6 text-center text-muted-foreground">
                 {isLoading ? (
                   <span className="flex items-center justify-center">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando reportes...
                   </span>
                 ) : (
                   `No se encontraron reportes en la comunidad ${searchTerm ? `que coincidan con "${searchTerm}"` : ''}${filter !== 'Todos' ? ` en la categoría "${filter}"` : ''}.`
                 )}
               </CardContent>
            </Card>
          )}
        </div>

      </div>
       {/* FAB removed as it's less relevant here, users create reports from their 'welcome' page */}
    </main>
  );
};

export default CommunityReportsPage;
