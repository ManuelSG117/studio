
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getReportById, type Report } from '@/app/welcome/page'; // Import function and type
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarDays, MapPin, Tag, UserCog, TriangleAlert } from 'lucide-react';

const ReportDetailPage: FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string; // Get reportId from URL
    const [report, setReport] = useState<Report | null | undefined>(undefined); // Initial state undefined for loading
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [user, setUser] = useState(null); // To check if user is logged in

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace("/login"); // Redirect if not logged in
            } else {
                setUser(currentUser); // Set user if logged in
                 // Fetch report data after confirming authentication
                 const foundReport = getReportById(reportId);
                 setReport(foundReport); // Set report data or null if not found
            }
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [router, reportId]);


    // Function to get status badge variant (consistent with welcome page)
    const getStatusVariant = (status: Report['status']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
        switch (status) {
            case 'Pendiente': return 'default';
            case 'En proceso': return 'secondary';
            case 'Resuelto': return 'outline';
            default: return 'default';
        }
    }

     // Function to get status badge colors (consistent with welcome page)
    const getStatusClasses = (status: Report['status']): string => {
        switch (status) {
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'En proceso': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Resuelto': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

     // Loading state for authentication check and data fetching
    if (isAuthLoading || report === undefined) {
        return (
            <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-secondary">
                <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl">
                    <CardHeader className="relative pb-4 pt-8">
                        <Skeleton className="absolute left-4 top-6 h-8 w-8 rounded-full" />
                        <Skeleton className="h-7 w-3/5 mx-auto" />
                        <Skeleton className="h-4 w-2/5 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-5">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                         <div className="flex items-center space-x-3">
                             <Skeleton className="h-5 w-5 rounded-full" />
                             <Skeleton className="h-4 w-32" />
                         </div>
                         <div className="flex items-center space-x-3">
                             <Skeleton className="h-5 w-5 rounded-full" />
                             <Skeleton className="h-4 w-28" />
                         </div>
                         <Skeleton className="h-20 w-full mt-3" />
                         <div className="flex justify-end pt-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                         </div>
                    </CardContent>
                </Card>
            </main>
        );
    }

     // Report not found state
    if (report === null) {
         return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
                 <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center">
                     <CardHeader>
                         <CardTitle className="text-xl text-destructive">Reporte No Encontrado</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <p className="text-muted-foreground mb-6">
                             No pudimos encontrar el reporte que buscas. Puede que haya sido eliminado o el enlace sea incorrecto.
                         </p>
                         <Button asChild variant="outline" className="rounded-full">
                             <Link href="/welcome">
                                 <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Reportes
                             </Link>
                         </Button>
                     </CardContent>
                 </Card>
             </main>
         );
     }


    // Display report details
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-secondary">
            <Card className="w-full max-w-2xl shadow-lg border-none rounded-xl">
                <CardHeader className="relative pb-4 pt-8">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-6 text-muted-foreground hover:text-primary rounded-full"
                        onClick={() => router.push('/welcome')}
                        aria-label="Volver a Reportes"
                        type="button"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <CardTitle className="text-2xl font-bold text-primary text-center pt-2">{report.title}</CardTitle>
                    <CardDescription className="text-muted-foreground text-center">
                        Detalles del reporte #{report.id}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-5">
                    {/* Report Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="flex items-center space-x-3 text-foreground">
                            {report.type === 'funcionario' ? (
                              <UserCog className="h-5 w-5 text-blue-600 flex-shrink-0" />
                             ) : (
                              <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                             )}
                            <span className="font-medium capitalize">Tipo: {report.type === 'funcionario' ? 'Funcionario' : 'Incidente'}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-foreground">
                            <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">Fecha: {report.date}</span>
                        </div>
                         <div className="flex items-center space-x-3 text-foreground">
                             <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                             <span className="font-medium">Ubicación: {report.location}</span>
                         </div>
                         <div className="flex items-center space-x-3 text-foreground">
                            <Tag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex items-center">
                                <span className="font-medium mr-2">Estado:</span>
                                <Badge
                                     variant={getStatusVariant(report.status)}
                                     className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusClasses(report.status)}`}
                                >
                                    {report.status}
                                </Badge>
                            </div>
                         </div>
                    </div>

                    {/* Report Description */}
                    <div className="pt-4">
                        <h3 className="text-base font-semibold text-primary mb-2">Descripción</h3>
                        <p className="text-foreground/90 leading-relaxed">{report.description}</p>
                    </div>

                     {/* TODO: Add Actions (e.g., Edit, Change Status, Delete) if needed */}
                     {/* <CardFooter className="pt-6 justify-end">
                       <Button variant="outline" className="rounded-full">Editar</Button>
                     </CardFooter> */}
                </CardContent>
            </Card>
        </main>
    );
};

export default ReportDetailPage;
