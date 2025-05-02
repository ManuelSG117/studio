"use client";

import type { FC } from "react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// Updated icons, added Plus for the new button
import { LogOut, Search, UserCog, TriangleAlert, MapPin, User as UserIcon, Plus } from "lucide-react";
import Image from "next/image"; // Import Image

// Define the report type
export interface Report { // Export Report type
  id: string;
  type: 'funcionario' | 'incidente';
  title: string;
  description: string;
  date: string; // Keep as string for simplicity, format as needed
  location: string;
  status: 'Pendiente' | 'En proceso' | 'Resuelto';
  mediaUrl?: string; // Optional: URL for image or video evidence
  latitude?: number; // Added latitude
  longitude?: number; // Added longitude
}

// Placeholder data (replace with actual data fetching later)
const placeholderReports: Report[] = [
  {
    id: '1',
    type: 'funcionario',
    title: 'Funcionario municipal',
    description: 'Funcionario municipal solicitando soborno en trámite de licencia',
    date: '2025-04-22',
    location: 'Col. Centro',
    status: 'Pendiente',
    mediaUrl: 'https://picsum.photos/600/400', // Example media URL
    latitude: 19.4326,
    longitude: -99.1332,
  },
  {
    id: '2',
    type: 'incidente',
    title: 'Robo a transeúnte',
    description: 'Robo en la zona centro, dos individuos en motocicleta',
    date: '2025-04-21',
    location: 'Av. Principal',
    status: 'En proceso',
    latitude: 19.4300,
    longitude: -99.1400,
    // No media URL for this one
  },
    {
    id: '3',
    type: 'incidente',
    title: 'Vandalismo en parque',
    description: 'Graffiti en juegos infantiles y bancas dañadas.',
    date: '2025-04-20',
    location: 'Parque Morelos',
    status: 'Resuelto',
    mediaUrl: 'https://picsum.photos/600/401', // Example media URL (different size for variety)
    latitude: 19.4250,
    longitude: -99.1500,
  },
   {
    id: '4',
    type: 'funcionario',
    title: 'Abuso de autoridad',
    description: 'Agente de tránsito detuvo vehículo sin motivo aparente.',
    date: '2025-04-19',
    location: 'Blvd. Insurgentes',
    status: 'Pendiente',
     mediaUrl: 'https://picsum.photos/600/402', // Example media URL
     latitude: 19.4100,
     longitude: -99.1600,
  },
];

// Make placeholder data accessible outside the component for the details page
export const getReportById = (id: string): Report | undefined => {
    return placeholderReports.find(report => report.id === id);
}


const WelcomePage: FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]); // Initialize with empty array
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'Todos' | 'Funcionarios' | 'Incidentes'>('Todos');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Simulate fetching reports after authentication
        // TODO: Fetch actual reports from Firestore/backend
        setReports(placeholderReports);
      } else {
        router.replace("/login"); // Redirect to login if not authenticated
      }
       setTimeout(() => setIsLoading(false), 500); // Slightly longer delay for demo data
    });

    return () => unsubscribe();
  }, [router]);

  // Memoize filtered reports to avoid recalculation on every render
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesFilter =
        filter === 'Todos' ||
        (filter === 'Funcionarios' && report.type === 'funcionario') ||
        (filter === 'Incidentes' && report.type === 'incidente');

      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [reports, searchTerm, filter]);

  // Function to get status badge variant
  const getStatusVariant = (status: Report['status']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
      switch (status) {
          case 'Pendiente':
              return 'default'; // Using default for yellow-ish theme color
          case 'En proceso':
              return 'secondary'; // Using secondary for blue-ish theme color
          case 'Resuelto':
              return 'outline'; // Using outline for green-ish or completed look
          default:
              return 'default';
      }
  }

   // Function to get status badge colors (Tailwind classes)
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
                <Skeleton className="h-10 w-1/2" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full ml-4 flex-shrink-0" />
              <Skeleton className="h-9 w-9 rounded-full ml-2 flex-shrink-0" />
           </div>
           <Skeleton className="h-10 w-full mb-4" />
           <div className="flex space-x-3 mb-6">
             <Skeleton className="h-9 w-24 rounded-full" />
             <Skeleton className="h-9 w-32 rounded-full" />
             <Skeleton className="h-9 w-28 rounded-full" />
           </div>
           {/* Report Card Skeletons */}
           {[1, 2, 3].map((i) => (
             <Card key={i} className="w-full shadow-sm mb-4 bg-card">
               <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                 <Skeleton className="h-4 w-1/4" />
               </CardHeader>
               <CardContent className="space-y-2 pt-2">
                 <Skeleton className="h-4 w-full" />
                 <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
               </CardContent>
             </Card>
           ))}
        </div>
      </main>
    );
  }


  return (
    <main className="flex flex-col items-center p-4 sm:p-6 bg-secondary">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-4 gap-4"> {/* Added gap */}
          <h1 className="text-2xl font-semibold text-primary flex-1">Reportes</h1>
          <div className="flex items-center space-x-2"> {/* Container for right-side buttons */}
                {/* Add New Report Button */}
                <Button
                    asChild
                    variant="default" // Primary button style
                    size="icon" // Icon button size
                    className="rounded-full shadow-md" // Circular style
                    aria-label="Crear Nuevo Reporte"
                >
                    <Link href="/reports/new"> {/* Link to the new report page */}
                        <Plus className="h-5 w-5" />
                    </Link>
                </Button>

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
            placeholder="Buscar reportes..."
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
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`} className="block hover:bg-card/50 rounded-lg transition-colors duration-150">
                <Card className="w-full shadow-sm rounded-lg overflow-hidden border border-border cursor-pointer bg-card">
                  {/* Use CardHeader for better structure */}
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 pt-4 px-4 sm:px-5">
                      <div className="flex items-center space-x-2">
                         {report.type === 'funcionario' ? (
                           <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" /> // Icon color can be customized
                         ) : (
                           <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" /> // Icon color can be customized
                         )}
                        <CardTitle className="text-base font-semibold text-foreground">{report.title}</CardTitle>
                      </div>
                     <p className="text-xs text-muted-foreground pt-1">{report.date}</p>
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
                 No se encontraron reportes {searchTerm ? `que coincidan con "${searchTerm}"` : ''}
                 {filter !== 'Todos' ? ` en la categoría "${filter}"` : ''}.
               </CardContent>
            </Card>
          )}
        </div>

      </div>
    </main>
  );
};

export default WelcomePage;
// Removed export type { Report }; - It's already exported inline
