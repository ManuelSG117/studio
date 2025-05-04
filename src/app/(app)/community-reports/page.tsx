
"use client";

import type { FC } from "react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore"; // Removed 'where' as we fetch all reports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Search, UserCog, TriangleAlert, MapPin, User as UserIcon, Plus, Loader2, CalendarDays, Globe } from "lucide-react"; // Added Globe icon
import Image from "next/image"; // Import Image
import { format } from 'date-fns'; // Import format for date display
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting
import type { Report } from '@/app/(app)/welcome/page'; // Reuse Report type from welcome page

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [reports, setReports] = useState<Report[]>([]); // State for fetched reports
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'Todos' | 'Funcionarios' | 'Incidentes'>('Todos');

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

          const fetchedReports: Report[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAtDate = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();

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
            } as Report;
          });
          console.log("Fetched community reports:", fetchedReports.length);
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching community reports: ", error);
          // Optionally show a toast message
        } finally {
           setIsLoading(false); // Stop loading after fetch attempt
        }
      } else {
        router.replace("/login"); // Redirect to login if not authenticated
        setIsLoading(false); // Stop loading if no user
      }
    });

    return () => unsubscribe();
  }, [router]);

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


  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 bg-secondary">
        <div className="w-full max-w-2xl space-y-4">
           {/* Header Skeleton */}
           <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                 <Skeleton className="h-8 w-2/5" /> {/* Adjust width for title */}
              </div>
              {/* Optional: Add skeleton for profile/logout button if needed */}
           </div>
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
        {/* Header */}
        <header className="flex justify-between items-center mb-4 gap-4">
          <h1 className="text-2xl font-semibold text-primary flex items-center gap-2">
            <Globe className="h-6 w-6" /> Reportes de la Comunidad
          </h1>
          {/* Optional: Add profile/logout button here if needed */}
        </header>

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
              <Link key={report.id} href={`/reports/${report.id}`} className="block hover:bg-card/50 rounded-lg transition-colors duration-150">
                <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border cursor-pointer bg-card">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5 relative">
                      <div className="flex items-center space-x-2 flex-1 pr-4">
                         {report.reportType === 'funcionario' ? (
                           <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                         ) : (
                           <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                         )}
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-1">{report.title}</CardTitle>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5">
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
                </Card>
              </Link>
            ))
          ) : (
            <Card className="w-full shadow-sm rounded-lg border border-border bg-card">
               <CardContent className="p-6 text-center text-muted-foreground">
                 {isLoading ? (
                   <span className="flex items-center justify-center">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando reportes...
                   </span>
                 ) : (
                   `No se encontraron reportes ${searchTerm ? `que coincidan con "${searchTerm}"` : ''}${filter !== 'Todos' ? ` en la categoría "${filter}"` : ''}.`
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
    