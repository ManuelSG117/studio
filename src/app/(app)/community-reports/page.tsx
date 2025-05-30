"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; 
import { auth, db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, startAfter, doc, getDoc, runTransaction, endBefore, limitToLast, type DocumentSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Badge } from "@/components/ui/badge"; 
import { FileText, MapPin, CalendarDays, Loader2, UserCog, TriangleAlert, Video, Image as ImageIcon, Search, Ellipsis, ChevronLeft, ChevronRight, Plus, ArrowUp, ArrowDown, X, SlidersHorizontal, RotateCcw } from 'lucide-react'; 
import { VotesModal } from "@/components/votes-modal"; 
import { format, formatDistanceToNow } from 'date-fns'; 
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn, formatLocation } from "@/lib/utils"; 
import type { Report } from '@/app/(app)/welcome/page';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CommunityReportsPage: FC = () => {
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
  
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [currentFilterType, setCurrentFilterType] = useState<'todos' | 'incidente' | 'funcionario'>('todos');
  const [currentSortBy, setCurrentSortBy] = useState<'recientes' | 'antiguos' | 'populares'>('recientes');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term in mobile modal
  const [displayedSearchTerm, setDisplayedSearchTerm] = useState(''); // For desktop search input

  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

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

  const fetchReports = useCallback(async (
    direction: 'initial' | 'next' | 'previous' | 'filterOrSort',
    filterType = currentFilterType, 
    sortBy = currentSortBy,
    currentSearchTerm = displayedSearchTerm // Use displayedSearchTerm for actual fetching
  ) => {
    if (!user) {
        console.error("fetchReports (Community) called without a valid user.");
        setIsLoading(false);
        return;
    }

    // Set the appropriate loading state based on direction
    if (direction === 'initial' || direction === 'filterOrSort') {
      setIsLoading(true);
    } else {
      setIsPaginating(true);
    }

    try {
      const reportsCollectionRef = collection(db, "reports");
      let queryConstraints: any[] = [];

      if (filterType !== 'todos') {
        queryConstraints.push(where("reportType", "==", filterType));
      }

      // Search term filtering (basic example - consider more robust search for production)
      // Note: Firestore does not support case-insensitive search or partial string matches directly on fields without third-party solutions or more complex data structuring.
      // This example assumes you might have a 'keywords' array field in your reports for searching.
      if (currentSearchTerm.trim() !== '') {
        // Example: If you have a 'title_lowercase' field for searching
        // queryConstraints.push(where("title_lowercase", ">=", currentSearchTerm.toLowerCase()));
        // queryConstraints.push(where("title_lowercase", "<=", currentSearchTerm.toLowerCase() + '\uf8ff'));
        // For now, this part of the query is commented out as it depends on your Firestore data structure.
        // You'd typically filter client-side after fetching if full-text search isn't set up in Firestore.
      }


      let orderByField = "createdAt";
      let firestoreOrderByDirection: "desc" | "asc" = "desc";

      if (sortBy === 'antiguos') {
        firestoreOrderByDirection = "asc";
      } else if (sortBy === 'populares') {
        orderByField = "upvotes"; 
        firestoreOrderByDirection = "desc";
      }
      // Apply orderBy after all where filters for non-equality/range filters if any were added for search
      queryConstraints.push(orderBy(orderByField, firestoreOrderByDirection));
      
      if (direction === 'next' && lastVisibleDoc) {
        queryConstraints.push(startAfter(lastVisibleDoc));
      } else if (direction === 'previous' && firstVisibleDoc) {
        queryConstraints.push(endBefore(firstVisibleDoc));
        queryConstraints.push(limitToLast(ITEMS_PER_PAGE));
      } else {
        queryConstraints.push(limit(ITEMS_PER_PAGE));
      }
      
      if (direction !== 'previous') {
          queryConstraints.push(limit(ITEMS_PER_PAGE));
      }

      const q = query(reportsCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      let fetchedReports: Report[] = [];
      console.log(`Found ${querySnapshot.docs.length} community reports in this batch.`);

       for (const reportDoc of querySnapshot.docs) {
         const data = reportDoc.data();
         const userVote = await fetchUserVote(user.uid, reportDoc.id);
          const createdAtDate = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();
          fetchedReports.push({
              id: reportDoc.id, userId: data.userId, userEmail: data.userEmail || null,
              reportType: data.reportType, title: data.title, description: data.description,
              location: data.location, mediaUrl: data.mediaUrl || null,
              latitude: data.latitude || null, longitude: data.longitude || null,
              createdAt: createdAtDate, upvotes: data.upvotes || 0, downvotes: data.downvotes || 0,
              userVote: userVote,
          });
       }

      // Client-side search filtering if Firestore query for search is not sufficient
      if (currentSearchTerm.trim() !== '') {
        fetchedReports = fetchedReports.filter(report => 
            report.title.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            report.location.toLowerCase().includes(currentSearchTerm.toLowerCase())
        );
      }

      setReports(fetchedReports);
      
      if (querySnapshot.docs.length > 0) {
        setFirstVisibleDoc(querySnapshot.docs[0]);
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
         if(direction === 'next') setHasMore(false);
         if(direction === 'previous') setCurrentPage(1);
      }

      if (direction === 'initial' || direction === 'filterOrSort') {
        setCurrentPage(1);
        setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE && fetchedReports.length > 0); // Adjust hasMore based on filtered results too
      } else if (direction === 'next') {
        if (fetchedReports.length > 0) setCurrentPage(prev => prev + 1);
        setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE && fetchedReports.length > 0);
      } else if (direction === 'previous') {
        if (fetchedReports.length > 0) setCurrentPage(prev => prev - 1);
        setHasMore(true); 
      }
      console.log("Community fetch complete. Has More:", hasMore, "New First Doc:", firstVisibleDoc?.id, "New Last Doc:", lastVisibleDoc?.id, "Current Page:", currentPage);

    } catch (error) {
      console.error("Error fetching community reports: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch community reports." });
    } finally {
      setIsLoading(false);
      setIsPaginating(false);
    }
  }, [user, toast, fetchUserVote, lastVisibleDoc, firstVisibleDoc, currentFilterType, currentSortBy, displayedSearchTerm, currentPage, hasMore]);


    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated && user) {
                if (reports.length === 0 && currentPage === 1) {
                    console.log("Auth confirmed, fetching initial community reports.");
                    fetchReports('initial', currentFilterType, currentSortBy, displayedSearchTerm);
                }
            } else {
                setIsLoading(false);
                router.replace("/login");
            }
        } else {
             setIsLoading(true);
        }
    }, [authLoading, isAuthenticated, user, router, reports.length, fetchReports, currentFilterType, currentSortBy, displayedSearchTerm, currentPage]);


  const handleFilterChange = (newFilterType: 'todos' | 'incidente' | 'funcionario') => {
    setCurrentFilterType(newFilterType);
    fetchReports('filterOrSort', newFilterType, currentSortBy, displayedSearchTerm);
  };

  const handleSortChange = (newSortBy: 'recientes' | 'antiguos' | 'populares') => {
    setCurrentSortBy(newSortBy);
    fetchReports('filterOrSort', currentFilterType, newSortBy, displayedSearchTerm);
  };
  
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayedSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault(); // Prevent form submission if used in a form
    // `displayedSearchTerm` is already used in `fetchReports`
    fetchReports('filterOrSort', currentFilterType, currentSortBy, displayedSearchTerm);
  };

  const handleApplyMobileFilters = () => {
    setDisplayedSearchTerm(searchTerm); // Apply search term from modal state
    fetchReports('filterOrSort', currentFilterType, currentSortBy, searchTerm);
    setFilterModalOpen(false);
  };

  const handleClearMobileFilters = () => {
    setCurrentFilterType('todos');
    setCurrentSortBy('recientes');
    setSearchTerm('');
    setDisplayedSearchTerm('');
    fetchReports('filterOrSort', 'todos', 'recientes', '');
    setFilterModalOpen(false);
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

    const handlePreviousPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (currentPage > 1 && !isLoading) {
            fetchReports('previous', currentFilterType, currentSortBy, displayedSearchTerm);
        }
    };

    const handleNextPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (hasMore && !isLoading) {
            fetchReports('next', currentFilterType, currentSortBy, displayedSearchTerm);
        }
    };

    const isAnyFilterActive = displayedSearchTerm !== '' || currentFilterType !== 'todos' || currentSortBy !== 'recientes';


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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-foreground mb-1">Reportes Comunitarios <span className="text-primary">+SEGURO</span></h1>
                <p className="text-muted-foreground">Visualización de reportes y denuncias ciudadanas para promover la seguridad en nuestra comunidad</p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full shadow-md hover:shadow-lg transition-shadow">
                <Link href="/reports/new">
                    <Plus className="mr-2 h-5 w-5" />Reportar
                </Link>
            </Button>
        </div>
        <div className="mb-8">
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn("rounded-full p-3 shadow-sm border border-border", isAnyFilterActive && "border-primary text-primary bg-primary/5")}
              onClick={() => setFilterModalOpen(true)}
              aria-label="Filtrar"
            >
              <SlidersHorizontal className={cn("h-5 w-5", isAnyFilterActive && "text-primary")} />
            </Button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
                <Input 
                    placeholder="Buscar..." 
                    className="h-10 rounded-full border-none focus-visible:ring-0 bg-card"
                    value={searchTerm} // Use temporary searchTerm for modal input
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </form>
          </div>
          <div className="hidden md:flex flex-row items-center gap-4 p-4 bg-card rounded-full shadow-md border border-border">
             <form onSubmit={handleSearchSubmit} className="relative w-full md:flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Buscar reportes..." 
                    className={cn(
                        "pl-11 h-11 rounded-full border-none focus-visible:ring-0 bg-transparent",
                        displayedSearchTerm && "border-primary/50 ring-1 ring-primary/30" // Active search style
                    )}
                    value={displayedSearchTerm}
                    onChange={handleSearchInputChange}
                />
            </form>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-full">
              <span className="text-sm font-medium text-muted-foreground hidden md:inline pl-2">Filtrar por:</span>
              <Select value={currentFilterType} onValueChange={(value) => handleFilterChange(value as 'todos' | 'incidente' | 'funcionario')}>
                <SelectTrigger 
                    className={cn(
                        "w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4",
                        currentFilterType !== 'todos' && "bg-primary/10 text-primary border border-primary/30"
                    )}
                >
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="incidente">Incidente</SelectItem>
                  <SelectItem value="funcionario">Funcionario</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="cualquier">
                <SelectTrigger className="w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4">
                  <SelectValue placeholder="Cualquier ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cualquier">Cualquier ubicación</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currentSortBy} onValueChange={(value) => handleSortChange(value as 'recientes' | 'antiguos' | 'populares')}>
                <SelectTrigger 
                    className={cn(
                        "w-full md:w-auto h-9 rounded-full border-none bg-background shadow-sm px-4",
                        currentSortBy !== 'recientes' && "bg-primary/10 text-primary border border-primary/30"
                    )}
                >
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
          <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
            <DialogContent className="p-0 max-w-sm w-full rounded-2xl">
              <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                <DialogTitle className="text-lg font-semibold">Filtrar</DialogTitle>
              </DialogHeader>
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Buscar</label>
                  <Input 
                    placeholder="Título, descripción, ubicación..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 rounded-full border-none bg-background shadow-sm px-4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tipo</label>
                   <Select value={currentFilterType} onValueChange={(value) => setCurrentFilterType(value as 'todos' | 'incidente' | 'funcionario')}>
                    <SelectTrigger className="h-10 rounded-full border-none bg-background shadow-sm px-4">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="funcionario">Funcionario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ubicación</label>
                  <Select defaultValue="cualquier">
                    <SelectTrigger className="h-10 rounded-full border-none bg-background shadow-sm px-4">
                      <SelectValue placeholder="Cualquier ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cualquier">Cualquier ubicación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ordenar por</label>
                   <Select value={currentSortBy} onValueChange={(value) => setCurrentSortBy(value as 'recientes' | 'antiguos' | 'populares')}>
                    <SelectTrigger className="h-10 rounded-full border-none bg-background shadow-sm px-4">
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
              <DialogFooter className="grid grid-cols-2 gap-2 px-4 pb-4 sm:flex sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="ghost" className="w-full rounded-full flex items-center gap-2" onClick={handleClearMobileFilters}>
                  <RotateCcw className="h-4 w-4" /> Limpiar
                </Button>
                <Button className="w-full rounded-full" onClick={handleApplyMobileFilters}>
                  Aplicar filtros
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {(isLoading && reports.length === 0) || isPaginating ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <Card key={i} className="shadow-sm bg-card rounded-lg overflow-hidden">
                  <Skeleton className="h-40 w-full bg-muted" />
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
                               onClick={() => { setSelectedReport(report); setVotesModalOpen(true);}}
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
             ))}
           </div>
        ) : (
           <Card className="shadow-sm bg-card col-span-full rounded-lg">
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

        {/* Modify pagination section to reflect loading state */}
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
                    "Anterior"
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
                      !hasMore && "pointer-events-none opacity-50",
                      (isLoading || isPaginating) && "pointer-events-none opacity-50"
                    )}
                    href="#"
                    aria-disabled={!hasMore || isLoading || isPaginating}
                  >
                  {isPaginating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Siguiente"
                  )}
                 </PaginationNext>
               </PaginationItem>
             </PaginationContent>
           </Pagination>
         </div>
        )}
       
      </div>
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default CommunityReportsPage;





