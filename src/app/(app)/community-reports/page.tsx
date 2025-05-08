
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
import { Input } from "@/components/ui/input"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Badge } from "@/components/ui/badge"; // Import Badge
import { FileText, MapPin, CalendarDays, Loader2, UserCog, TriangleAlert, Video, Image as ImageIcon, Search, Ellipsis, ChevronLeft, ChevronRight, Plus, ArrowUp, ArrowDown } from 'lucide-react'; // Added necessary icons, ArrowUp, ArrowDown
import { format, formatDistanceToNow } from 'date-fns'; // Import formatDistanceToNow
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn, formatLocation } from "@/lib/utils"; // Import formatLocation
import type { Report } from '@/app/(app)/welcome/page'; // Assuming Report type is exported from welcome
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

  const ITEMS_PER_PAGE = 9; // Adjust to fit 3 columns

    // Function to fetch user's vote for a specific report (remains the same)
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

  // Function to fetch reports (remains largely the same, adjust limit)
  const fetchReports = useCallback(async (loadMore: boolean = false) => {
    if (!user) {
        console.error("fetchReports (Community) called without a valid user.");
        setIsLoading(false);
        return;
    }
    console.log("Fetching community reports. Load More:", loadMore);

    if (!loadMore) {
        setIsLoading(true);
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


       for (const reportDoc of querySnapshot.docs) {
         const data = reportDoc.data();
         const userVote = await fetchUserVote(user.uid, reportDoc.id);

          const createdAtDate = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();



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
      console.log("Community fetch complete. Has More:", fetchedReports.length === ITEMS_PER_PAGE, "New Last Doc:", newLastDoc?.id);

    } catch (error) {
      console.error("Error fetching community reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch community reports." });
    } finally {
      console.log("Setting isLoading to false in community finally block.");
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [user, toast, fetchUserVote, lastDoc]);


    // useEffect for initial load and auth check (remains the same)
    useEffect(() => {
        console.log("CommunityReports useEffect triggered. AuthLoading:", authLoading, "IsAuthenticated:", isAuthenticated, "User:", !!user);
        if (!authLoading) {
            if (isAuthenticated && user) {
                if (isLoading) {
                    console.log("Auth confirmed, user available. Fetching initial community reports.");
                    fetchReports();
                } else {
                     console.log("Auth confirmed, user available, but not fetching community (isLoading is false).");
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
         console.log("Load more community reports triggered.");
         fetchReports(true);
     } else {
         console.log("Load more community reports skipped. HasMore:", hasMore, "LastDoc:", !!lastDoc, "isFetchingMore:", isFetchingMore);
     }
  };

 // Handle Voting Logic (remains the same for now, could be removed if not needed on this view)
 const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para votar." });
        return;
    }
    // ... (rest of the handleVote logic remains the same) ...
     const currentReport = reports.find(report => report.id === reportId);
    if (!currentReport) {
        toast({ variant: "destructive", title: "Error", description: "Reporte no encontrado." });
        setVotingState(prev => ({ ...prev, [reportId]: false }));
        return;
    }

    if (user.uid === currentReport.userId) {
        toast({ variant: "destructive", title: "Error", description: "No puedes votar en tus propios reportes." });
        return;
    }

    if (votingState[reportId]) return;

    setVotingState(prev => ({ ...prev, [reportId]: true }));

    const currentVote = currentReport.userVote;
    const originalReport = { ...currentReport };

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
        console.log("Vote updated successfully for report:", reportId);
    } catch (error: any) {
        console.error("Error updating vote:", error);
        toast({ variant: "destructive", title: "Error", description: `No se pudo registrar el voto: ${error.message}` });
        setReports(prevReports => prevReports.map(rep => rep.id === reportId ? originalReport : rep));
    } finally {
        setVotingState(prev => ({ ...prev, [reportId]: false }));
    }
};


  // Helper function to determine badge color for report type
  const getTypeBadgeVariant = (type: 'incidente' | 'funcionario'): 'destructive' | 'default' => {
     return type === 'incidente' ? 'destructive' : 'default'; // Destructive for incident, primary for funcionario
  };
   const getTypeBadgeText = (type: 'incidente' | 'funcionario'): string => {
     return type === 'incidente' ? 'Incidente' : 'Funcionario';
   };

  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-7xl mx-auto space-y-6"> {/* Use wider max-width */}

        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground mb-1">Reportes Comunitarios <span className="text-primary">+SEGURO</span></h1>
          <p className="text-muted-foreground">Visualización de reportes y denuncias ciudadanas para promover la seguridad en nuestra comunidad</p>
        </div>

        {/* Search and Filters Bar - Updated Styling */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 bg-card rounded-full shadow-md border border-border"> {/* Use rounded-full and shadow-md */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /> {/* Adjusted padding */}
            <Input placeholder="Buscar reportes..." className="pl-11 h-11 rounded-full border-none focus-visible:ring-0 bg-transparent" /> {/* Rounded-full, border-none */}
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-full"> {/* Container for filters */}
            <span className="text-sm font-medium text-muted-foreground hidden md:inline pl-2">Filtrar por:</span>
            {/* Filter Selects with rounded-full */}
            <Select defaultValue="todos">
              <SelectTrigger className="w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4"> {/* Adjusted styling */}
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="incidente">Incidente</SelectItem>
                <SelectItem value="funcionario">Funcionario</SelectItem>
              </SelectContent>
            </Select>
             <Select defaultValue="cualquier">
              <SelectTrigger className="w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4"> {/* Adjusted styling */}
                <SelectValue placeholder="Cualquier ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cualquier">Cualquier ubicación</SelectItem>
                {/* Add location options here */}
              </SelectContent>
            </Select>
            <Select defaultValue="recientes">
              <SelectTrigger className="w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4"> {/* Adjusted styling */}
                <SelectValue placeholder="Más recientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recientes">Más recientes</SelectItem>
                <SelectItem value="antiguos">Más antiguos</SelectItem>
                <SelectItem value="populares">Más populares</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <Card key={i} className="shadow-sm bg-card rounded-lg overflow-hidden">
                  <Skeleton className="h-40 w-full bg-muted" /> {/* Image Placeholder */}
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-5/6 mb-3" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>

              </Card>
            ))}
           </div>
        ) : reports.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {reports.map((report) => (
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
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/reports/${report.id}`}>
                                        Ver detalles
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Compartir
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
                   <div className="flex items-center justify-between pt-1"> {/* Adjusted padding */}
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
                           <span className="text-sm font-medium text-foreground tabular-nums w-6 text-center">
                               {report.upvotes - report.downvotes}
                            </span>
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
             ))}
           </div>
        ) : (
           <Card className="shadow-sm bg-card col-span-full"> {/* Span full width if no reports */}
             <CardContent className="p-6 text-center">
               <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
               <CardTitle className="text-xl font-semibold mb-2">No hay reportes de la comunidad</CardTitle>
               <CardDescription className="text-muted-foreground">
                 Aún no se han creado reportes por otros usuarios. ¡Sé el primero en crear uno!
               </CardDescription>
                <Button asChild className="mt-4">
                  <Link href="/reports/new">
                    <Plus className="mr-2 h-4 w-4" /> Reportar Incidente
                  </Link>
                </Button>
             </CardContent>
           </Card>
        )}

         {/* Pagination (Placeholder) */}
        {reports.length > 0 && (
         <div className="mt-8 flex justify-center">
           <Pagination>
             <PaginationContent>
               <PaginationItem>
                 <PaginationPrevious href="#" />
               </PaginationItem>
               <PaginationItem>
                 <PaginationLink href="#" isActive>1</PaginationLink>
               </PaginationItem>
               <PaginationItem>
                 <PaginationLink href="#">2</PaginationLink>
               </PaginationItem>
               <PaginationItem>
                 <PaginationLink href="#">3</PaginationLink>
               </PaginationItem>
               <PaginationItem>
                 <PaginationEllipsis />
               </PaginationItem>
               <PaginationItem>
                 <PaginationLink href="#">8</PaginationLink>
               </PaginationItem>
               <PaginationItem>
                 <PaginationNext href="#" />
               </PaginationItem>
             </PaginationContent>
           </Pagination>
         </div>
        )}

         {/* Report Incident Button */}
        <div className="mt-8 text-center">
          <Button size="lg" asChild className="rounded-full shadow-md hover:shadow-lg transition-shadow">
            <Link href="/reports/new">
                <Plus className="mr-2 h-5 w-5" /> Reportar Incidente
            </Link>
          </Button>
        </div>

      </div>
      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default CommunityReportsPage;


