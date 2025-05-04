"use client";

import type { FC } from "react";
import { useEffect, useState, useMemo, useCallback } from "react"; // Added useCallback
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, Timestamp, where, doc, runTransaction, writeBatch } from "firebase/firestore"; // Import Firestore functions including transaction
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge"; // Badge removed
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Search, UserCog, TriangleAlert, MapPin, Plus, Loader2, CalendarDays, ThumbsUp, ThumbsDown, ArrowUp, ArrowDown } from "lucide-react"; // Added ThumbsUp, ThumbsDown, ArrowUp, ArrowDown
import Image from "next/image"; // Import Image
import { format } from 'date-fns'; // Import format for date display
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { cn } from "@/lib/utils"; // Import cn

// Define the report type (consider moving to a shared types file if used elsewhere)
export interface Report {
  id: string;
  userId: string;
  userEmail: string | null;
  reportType: 'funcionario' | 'incidente';
  title: string;
  description: string;
  location: string;
  mediaUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date; // Store as Date object
  upvotes: number; // Add upvotes field
  downvotes: number; // Add downvotes field
  // Add userVote to track current user's vote locally for UI feedback
  userVote?: 'up' | 'down' | null;
}

// Removed placeholder data

const WelcomePage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [reports, setReports] = useState<Report[]>([]); // State for fetched reports
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'Todos' | 'Funcionarios' | 'Incidentes'>('Todos');
  const [votingState, setVotingState] = useState<Record<string, boolean>>({}); // Track voting status per report

  // Function to fetch user's votes
  const fetchUserVotes = useCallback(async (userId: string, reportIds: string[]) => {
    const votes: Record<string, 'up' | 'down'> = {};
    // In a real app, you'd fetch this from a 'votes' subcollection or similar
    // For now, we'll simulate this being empty or fetched from somewhere
    console.log("Simulating fetch for user votes for reports:", reportIds);
    // Example: Fetch from Firestore 'votes' subcollection for each report
    // const votePromises = reportIds.map(async (reportId) => {
    //   const voteDocRef = doc(db, `reports/${reportId}/votes/${userId}`);
    //   const voteDocSnap = await getDoc(voteDocRef);
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
        // Fetch reports from Firestore after authentication
        try {
          console.log("Fetching reports for user:", currentUser.uid);
          // Query reports collection, filtered by user ID and ordered by creation date descending
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, where("userId", "==", currentUser.uid), orderBy("createdAt", "desc")); // Filter by user ID and Order by newest first
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
              upvotes: data.upvotes || 0, // Default to 0 if not present
              downvotes: data.downvotes || 0, // Default to 0 if not present
              userVote: null, // Initialize userVote as null
            } as Report;
          });

          // Fetch user votes for the fetched reports
          const userVotes = await fetchUserVotes(currentUser.uid, reportIds);

          // Merge user votes into the fetched reports
          const reportsWithVotes = fetchedReports.map(report => ({
            ...report,
            userVote: userVotes[report.id] || null,
          }));


          console.log("Fetched user reports:", reportsWithVotes.length);
          setReports(reportsWithVotes);
        } catch (error) {
          console.error("Error fetching user reports: ", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los reportes." });
        } finally {
           setIsLoading(false); // Stop loading after fetch attempt
        }
      } else {
        router.replace("/login"); // Redirect to login if not authenticated
        setIsLoading(false); // Stop loading if no user
      }
    });

    return () => unsubscribe();
  }, [router, toast, fetchUserVotes]); // Added fetchUserVotes dependency

  // Memoize filtered reports to avoid recalculation on every render
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


   // Helper function to extract street and neighborhood from location string
   const formatLocation = (location: string): string => {
        if (!location) return "Ubicación no disponible";
        const parts = location.split(',').map(part => part.trim());
        // Try to get street (part 0) and neighborhood (part 1)
        if (parts.length >= 2) {
            // Basic check if the first part looks like Lat/Lon coordinates
            if (/^Lat: .+ Lon: .+$/.test(parts[0])) {
               return parts[0]; // Return coordinates if that's all we have
            }
            return `${parts[0]}, ${parts[1]}`; // Street, Neighborhood
        }
        return location; // Fallback to the full string if parsing fails
    };

    // Handle Voting Logic
    const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para votar." });
            return;
        }
        if (votingState[reportId]) return; // Prevent multiple clicks while processing

        setVotingState(prev => ({ ...prev, [reportId]: true }));

        const reportIndex = reports.findIndex(r => r.id === reportId);
        if (reportIndex === -1) return;

        const currentReport = reports[reportIndex];
        const currentVote = currentReport.userVote;

        // Optimistic UI Update
        const originalReport = { ...currentReport };
        let optimisticUpvotes = currentReport.upvotes;
        let optimisticDownvotes = currentReport.downvotes;
        let optimisticUserVote: 'up' | 'down' | null = null;

        if (currentVote === voteType) { // User is removing their vote
            optimisticUserVote = null;
            if (voteType === 'up') optimisticUpvotes--;
            else optimisticDownvotes--;
        } else { // New vote or changing vote
            optimisticUserVote = voteType;
            if (voteType === 'up') {
                optimisticUpvotes++;
                if (currentVote === 'down') optimisticDownvotes--; // Decrement opposite if changing
            } else { // voteType === 'down'
                optimisticDownvotes++;
                if (currentVote === 'up') optimisticUpvotes--; // Decrement opposite if changing
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
            // In a real app, also update a `votes` subcollection document:
            // const voteRef = doc(db, `reports/${reportId}/votes/${user.uid}`);

            await runTransaction(db, async (transaction) => {
                const reportSnap = await transaction.get(reportRef);
                if (!reportSnap.exists()) {
                    throw new Error("El reporte ya no existe.");
                }

                const reportData = reportSnap.data();
                let newUpvotes = reportData.upvotes || 0;
                let newDownvotes = reportData.downvotes || 0;

                // Logic to determine actual increments/decrements based on currentVote
                // This should ideally fetch the user's current vote from the subcollection
                // For simplicity, we use the state `currentVote` which might not be perfectly in sync
                 if (currentVote === voteType) { // Removing vote
                    if (voteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                    else newDownvotes = Math.max(0, newDownvotes - 1);
                     // In real app: transaction.delete(voteRef);
                } else { // Adding or changing vote
                    if (voteType === 'up') {
                       newUpvotes++;
                       if (currentVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
                        // In real app: transaction.set(voteRef, { type: 'up', timestamp: Timestamp.now() });
                    } else { // voteType === 'down'
                       newDownvotes++;
                       if (currentVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
                        // In real app: transaction.set(voteRef, { type: 'down', timestamp: Timestamp.now() });
                    }
                }

                transaction.update(reportRef, {
                    upvotes: newUpvotes,
                    downvotes: newDownvotes,
                });
            });

            console.log("Vote updated successfully for report:", reportId);
            // Update local state *again* after successful transaction only if needed
            // (usually optimistic update is enough, but refetch or merge if complex)
            // Example: Refetch the specific report or the whole list if needed

        } catch (error: any) {
            console.error("Error updating vote:", error);
            toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
            // Revert optimistic update on error
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
               <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5 relative"> {/* Added relative */}
                  <div className="flex items-center space-x-2 flex-1 pr-16"> {/* Add padding-right to avoid overlap */}
                     <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                     <Skeleton className="h-5 w-3/5" />
                  </div>
               </CardHeader>
               <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-4/5" />
                 <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" /> {/* Skeleton for Date */}
                  </div>
                   {/* Vote Skeletons */}
                   <div className="flex justify-end items-center space-x-3 pt-2">
                     <Skeleton className="h-6 w-12 rounded-md" />
                     <Skeleton className="h-6 w-12 rounded-md" />
                   </div>
               </CardContent>
             </Card>
           ))}
           {/* FAB Skeleton */}
            <Skeleton className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-full shadow-lg z-40" />
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
            placeholder="Buscar por título, descripción, ubicación..."
            className="w-full rounded-full bg-background pl-9 pr-4 h-11 shadow-sm" // Rounded full
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-3 mb-6 overflow-x-auto pb-2">
          {(['Todos', 'Funcionarios', 'Incidentes'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'} // Use default for active, outline for inactive
              size="sm" // Smaller buttons
              className={`rounded-full px-5 h-9 shrink-0 ${
                filter === filterType
                  ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90' // Active style
                  : 'bg-card border border-border text-foreground hover:bg-muted' // Inactive style
              }`}
              onClick={() => setFilter(filterType)}
            >
              {filterType}
            </Button>
          ))}
        </div>

        {/* Report List */}
        <div className="space-y-4 pb-20"> {/* Add padding-bottom to avoid FAB overlap */}
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card key={report.id} className="w-full shadow-sm rounded-lg overflow-hidden border border-border bg-card transition-colors duration-150">
                <Link href={`/reports/${report.id}`} className="block hover:bg-card/50 ">
                   <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5 relative cursor-pointer"> {/* Cursor pointer on header too */}
                       <div className="flex items-center space-x-2 flex-1 pr-4"> {/* Adjusted padding-right */}
                          {report.reportType === 'funcionario' ? (
                            <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )}
                         <CardTitle className="text-base font-semibold text-foreground line-clamp-1">{report.title}</CardTitle> {/* Added line-clamp */}
                       </div>
                        {/* Removed Badge */}
                   </CardHeader>
                   <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5 cursor-pointer"> {/* Cursor pointer on content */}
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
                 {/* Voting Section - Separate from Link */}
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
                            report.userVote === 'down' && "text-red-600 bg-red-100/60 dark:bg-red-900/30",
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
                   `No has creado ningún reporte todavía ${searchTerm ? `que coincidan con "${searchTerm}"` : ''}${filter !== 'Todos' ? ` en la categoría "${filter}"` : ''}.`
                 )}
                 <Button asChild variant="link" className="mt-2">
                     <Link href="/reports/new">Crea tu primer reporte</Link>
                 </Button>
               </CardContent>
            </Card>
          )}
        </div>

      </div>

       {/* Floating Action Button (FAB) for New Report */}
       <Button
          asChild
          variant="default"
          className="fixed bottom-20 right-4 sm:right-6 h-14 w-14 rounded-full shadow-lg z-40 flex items-center justify-center p-0 bg-primary hover:bg-primary/90" // Ensure consistent background
          aria-label="Crear Nuevo Reporte"
        >
          <Link href="/reports/new">
             <Plus className="h-6 w-6 text-primary-foreground" /> {/* Ensure icon color contrasts */}
          </Link>
        </Button>
    </main>
  );
};

export default WelcomePage;
