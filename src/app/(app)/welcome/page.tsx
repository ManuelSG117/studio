
"use client";

import type { FC } from "react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore"; // Import Firestore functions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Search, UserCog, TriangleAlert, MapPin, User as UserIcon, Plus, Loader2 } from "lucide-react"; // Added Loader2
import Image from "next/image"; // Import Image
import { format } from 'date-fns'; // Import format for date display
import { es } from 'date-fns/locale'; // Import Spanish locale for date formatting

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
  status: 'Pendiente' | 'En proceso' | 'Resuelto';
  createdAt: Date; // Store as Date object
}

// Removed placeholder data
// const placeholderReports: Report[] = [...];

// Removed getReportById as it's specific to placeholder data.
// Fetching specific report will be handled in the detail page.

const WelcomePage: FC = () => {
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
        // Fetch reports from Firestore after authentication
        try {
          console.log("Fetching reports from Firestore...");
          // Query reports collection, ordered by creation date descending
          // Consider adding 'where' clauses for filtering (e.g., by user, status, location) if needed
          const reportsCollectionRef = collection(db, "reports");
          const q = query(reportsCollectionRef, orderBy("createdAt", "desc")); // Order by newest first
          const querySnapshot = await getDocs(q);

          const fetchedReports: Report[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure createdAt is converted from Timestamp to Date
            const createdAtDate = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(); // Fallback if conversion fails

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
              status: data.status,
              createdAt: createdAtDate,
            } as Report; // Assert type
          });
          console.log("Fetched reports:", fetchedReports.length);
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching reports: ", error);
          // Optionally show a toast message to the user
          // toast({ variant: "destructive", title: "Error", description: "No se pudiero cargar los reportes." });
        } finally {
           setIsLoading(false); // Stop loading after fetch attempt
        }
      } else {
        router.replace("/login"); // Redirect to login if not authenticated
        setIsLoading(false); // Stop loading if no user
      }
      // Removed timeout based loading stop
    });

    return () => unsubscribe();
  }, [router]);

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

  // Function to get status badge variant (remains the same)
  const getStatusVariant = (status: Report['status']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
      switch (status) {
          case 'Pendiente':
              return 'default';
          case 'En proceso':
              return 'secondary';
          case 'Resuelto':
              return 'outline';
          default:
              return 'default';
      }
  }

   // Function to get status badge colors (remains the same)
   const getStatusClasses = (status: Report['status']): string => {
       switch (status) {
           case 'Pendiente':
               return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
           case 'En proceso':
               return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
           case 'Resuelto':
               return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
           default:
               return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'; // Fallback
       }
   }


  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 bg-secondary">
        <div className="w-full max-w-2xl space-y-4">
           {/* Header Skeleton */}
           <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <Skeleton className="h-8 w-1/3" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full ml-2 flex-shrink-0" />
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
               <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5">
                  <div className="flex items-center space-x-2 flex-1">
                     <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                     <Skeleton className="h-5 w-3/5" />
                  </div>
                 <Skeleton className="h-4 w-1/4" />
               </CardHeader>
               <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-4/5" />
                 <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-20 rounded-full" />
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
        {/* Header */}
        <header className="flex justify-between items-center mb-4 gap-4"> {/* Added gap */}
          <h1 className="text-2xl font-semibold text-primary flex-1">Mis Reportes</h1>
          <div className="flex items-center space-x-2"> {/* Container for right-side buttons */}
               {/* Profile Link Button */}
               <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                    aria-label="Ver Perfil"
                >
                  <Link href="/profile">
                    <UserIcon className="h-5 w-5" />
                  </Link>
              </Button>
          </div>
        </header>

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
              <Link key={report.id} href={`/reports/${report.id}`} className="block hover:bg-card/50 rounded-lg transition-colors duration-150">
                <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border cursor-pointer bg-card">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5">
                      <div className="flex items-center space-x-2">
                         {report.reportType === 'funcionario' ? (
                           <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                         ) : (
                           <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                         )}
                        <CardTitle className="text-base font-semibold text-foreground">{report.title}</CardTitle>
                      </div>
                     {/* Format the date */}
                     <p className="text-xs text-muted-foreground pt-1">
                         {format(report.createdAt, "PPP", { locale: es })}
                     </p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1 pb-4 px-4 sm:px-5">
                    <CardDescription className="text-sm text-foreground/90 leading-relaxed line-clamp-2">{report.description}</CardDescription> {/* Added line-clamp */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                      <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5"/>
                          {report.location}
                      </div>
                       <Badge
                           variant={getStatusVariant(report.status)}
                           className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusClasses(report.status)}`}
                       >
                        {report.status}
                      </Badge>
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
// Removed export type { Report }; - It's already exported inline

