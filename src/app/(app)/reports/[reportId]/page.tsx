
"use client";

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, Timestamp, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, MapPin, UserCog, TriangleAlert, Image as ImageIcon, Loader2, ArrowLeft, ArrowUp, ArrowDown, Share2, Printer, ShieldAlert, Eye, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Report } from '@/app/(app)/welcome/page';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { VotesModal } from '@/components/votes-modal';
import { ReportsMap } from '@/components/reports-map';
import { useToast } from '@/hooks/use-toast';
import { cn, formatLocation } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge'; 
import { Separator } from '@/components/ui/separator';

interface ReporterProfile {
  displayName?: string;
  photoURL?: string | null;
  memberSince?: Date;
  reportCount?: number;
  credibility?: number; // Percentage 0-100
}

const ReportDetailPage: FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string;
    const { toast } = useToast();
    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [votingState, setVotingState] = useState<boolean>(false);
    const [votesModalOpen, setVotesModalOpen] = useState(false);
    const [reporterProfile, setReporterProfile] = useState<ReporterProfile | null>(null);
    const [isLoadingReporter, setIsLoadingReporter] = useState(true);

    const getInitials = (name?: string | null): string => {
        if (!name) return "?";
        const names = name.trim().split(' ');
        if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
        return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
    };

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

    useEffect(() => {
        setIsClient(true);
        setIsLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.replace("/login");
            } else {
                setUser(currentUser);
                if (reportId) {
                    try {
                         const reportDocRef = doc(db, "reports", reportId);
                         const reportDocSnap = await getDoc(reportDocRef);

                         if (reportDocSnap.exists()) {
                            const data = reportDocSnap.data();
                            const createdAtDate = data.createdAt instanceof Timestamp
                              ? data.createdAt.toDate()
                              : new Date();
                            const userVote = await fetchUserVote(currentUser.uid, reportId);
                            const fetchedReport: Report = {
                                 id: reportDocSnap.id, userId: data.userId, userEmail: data.userEmail || null,
                                 reportType: data.reportType, title: data.title, description: data.description,
                                 location: data.location, mediaUrl: data.mediaUrl || null,
                                 latitude: data.latitude || null, longitude: data.longitude || null,
                                 createdAt: createdAtDate, upvotes: data.upvotes || 0, downvotes: data.downvotes || 0,
                                 userVote: userVote,
                            };
                            setReport(fetchedReport);

                            if (fetchedReport.userId) {
                                setIsLoadingReporter(true);
                                try {
                                    const reporterDocRef = doc(db, "users", fetchedReport.userId);
                                    const reporterDocSnap = await getDoc(reporterDocRef);
                                    if (reporterDocSnap.exists()) {
                                        const reporterData = reporterDocSnap.data();
                                        const reportCountQuery = query(collection(db, "reports"), where("userId", "==", fetchedReport.userId));
                                        const reportCountSnapshot = await getDocs(reportCountQuery);
                                        setReporterProfile({
                                            displayName: reporterData.fullName || reporterData.displayName || "Usuario Anónimo",
                                            photoURL: reporterData.photoURL || null,
                                            memberSince: reporterData.createdAt instanceof Timestamp ? reporterData.createdAt.toDate() : (auth.currentUser?.metadata.creationTime ? new Date(auth.currentUser.metadata.creationTime) : undefined),
                                            reportCount: reportCountSnapshot.size,
                                            credibility: Math.min(90 + reportCountSnapshot.size, 99), 
                                        });
                                    } else {
                                       setReporterProfile({ displayName: "Usuario Anónimo", reportCount: 0, credibility: 50 });
                                    }
                                } catch (err) {
                                    console.error("Error fetching reporter profile:", err);
                                    setReporterProfile({ displayName: "Usuario Anónimo", reportCount: 0, credibility: 50 });
                                } finally {
                                    setIsLoadingReporter(false);
                                }
                            } else {
                                setIsLoadingReporter(false);
                                setReporterProfile({ displayName: "Usuario Anónimo", reportCount: 0, credibility: 50 });
                            }

                         } else {
                             setReport(null);
                         }
                    } catch (error) {
                        console.error("Error fetching report details:", error);
                        setReport(null);
                        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el reporte." });
                    } finally {
                         setIsLoading(false);
                    }
                } else {
                    setReport(null);
                    setIsLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, [router, reportId, toast, fetchUserVote]);

    const handleVote = async (voteType: 'up' | 'down') => {
        if (!user || !report) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión y el reporte debe cargarse para votar." });
            return;
        }
        if (votingState) return; 
        if (user.uid === report.userId) {
            toast({ variant: "destructive", title: "Error", description: "No puedes votar en tus propios reportes." });
            return;
        }
        setVotingState(true);
        const currentVote = report.userVote;
        const originalReport = { ...report };
        let optimisticUpvotes = report.upvotes;
        let optimisticDownvotes = report.downvotes;
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
        setReport(prevReport => prevReport ? { ...prevReport, upvotes: optimisticUpvotes, downvotes: optimisticDownvotes, userVote: optimisticUserVote } : null);

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
            setReport(originalReport);
        } finally {
            setVotingState(false);
        }
    };

    if (isLoading || !isClient || isLoadingReporter) {
        return (
            <main className="flex flex-col items-center p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
                 <div className="w-full max-w-4xl mb-4 self-start"> {/* Ensure back button is aligned to the start */}
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Card className="shadow-lg border-none rounded-xl bg-card">
                            <CardHeader className="relative pt-6 pb-4 px-6">
                                <Skeleton className="h-8 w-3/4 mb-2" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </CardHeader>
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="px-6 pt-6 pb-6 space-y-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Skeleton className="h-8 w-16 rounded-md" />
                                        <Skeleton className="h-8 w-16 rounded-md" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Skeleton className="h-8 w-24 rounded-md" />
                                        <Skeleton className="h-8 w-24 rounded-md" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-48 w-full rounded-lg" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                                <div className="space-y-2">
                                   <Skeleton className="h-5 w-1/3" />
                                   <Skeleton className="h-4 w-1/2" />
                                   <Skeleton className="h-4 w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </main>
        );
    }

    if (report === null) {
         return (
             <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-secondary">
                 <div className="w-full max-w-md mb-4 self-start"> {/* Align back button to start */}
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" onClick={() => router.back()} aria-label="Volver">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </div>
                 <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center bg-card">
                     <CardHeader>
                         <CardTitle className="text-xl text-destructive">Reporte No Encontrado</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <p className="text-muted-foreground mb-6">
                             No pudimos encontrar el reporte que buscas (ID: {reportId}). Puede que haya sido eliminado o el enlace sea incorrecto.
                         </p>
                         <Button asChild variant="outline" className="rounded-full">
                             <Link href="/welcome">Volver a Mis Reportes</Link>
                         </Button>
                     </CardContent>
                 </Card>
             </main>
         );
    }
    
    const isOwnReport = user?.uid === report.userId;

    return (
        <main className="flex flex-col items-center p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
            {report && (
                <VotesModal 
                    open={votesModalOpen} 
                    onOpenChange={setVotesModalOpen} 
                    reportId={report.id}
                    reportTitle={report.title}
                    upvotes={report.upvotes}
                    downvotes={report.downvotes}
                />
            )}
             <div className="w-full max-w-4xl mb-4 self-start"> {/* Moved back button container here */}
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" onClick={() => router.back()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card className="w-full shadow-lg border-none rounded-xl bg-card">
                        <CardHeader className="pt-6 pb-4 px-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                                <h1 className="text-2xl font-bold text-foreground flex-grow">{report.title}</h1>
                                <Badge variant={report.reportType === 'incidente' ? 'destructive' : 'default'} className="ml-0 sm:ml-2 mt-1 sm:mt-0 capitalize self-start sm:self-center">
                                    {report.reportType === 'incidente' ? 'Delito' : 'Funcionario'}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                {reporterProfile && (
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={reporterProfile.photoURL || undefined} alt={reporterProfile.displayName || "Avatar del reportante"} data-ai-hint="reporter avatar"/>
                                        <AvatarFallback className="text-xs">{getInitials(reporterProfile.displayName)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <span>{reporterProfile?.displayName || 'Reporte Anónimo'}</span>
                                <span>&bull;</span>
                                <span>Publicado {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: es })}</span>
                            </div>
                        </CardHeader>

                        {report.mediaUrl && (
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                {/\.(mp4|webm|ogg|mov)$/i.test(report.mediaUrl) ? (
                                    <video controls src={report.mediaUrl} className="absolute inset-0 w-full h-full object-cover" preload="metadata">
                                        Tu navegador no soporta videos HTML5.
                                    </video>
                                ) : (
                                    <Image src={report.mediaUrl} alt={`Evidencia para reporte ${report.id}`} fill style={{ objectFit: 'cover' }} data-ai-hint="report evidence media" className="bg-muted" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                )}
                            </div>
                        )}
                         {!report.mediaUrl && (
                            <div className="aspect-video w-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
                                <ImageIcon size={48} className="opacity-50 mb-2"/>
                                <p className="text-sm">Sin evidencia multimedia adjunta.</p>
                            </div>
                        )}


                        <CardContent className="px-6 pt-6 space-y-6">
                             <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Descripción del incidente</h3>
                                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                            </div>
                            
                            <Separator />

                             <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-1 bg-muted p-1 rounded-full">
                                   <Button
                                       variant="ghost" size="icon"
                                       className={cn("h-8 w-8 rounded-full", report.userVote === 'down' && "bg-destructive/20 text-destructive", votingState && "opacity-50", isOwnReport && "cursor-not-allowed opacity-60")}
                                      onClick={() => handleVote('down')}
                                      disabled={votingState || isOwnReport}
                                      aria-pressed={report.userVote === 'down'}
                                      title={isOwnReport ? "No puedes votar en tus propios reportes" : "Votar negativamente"}
                                   >
                                      {votingState && report.userVote !== 'down' && !isOwnReport ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowDown className="h-4 w-4"/>}
                                   </Button>
                                   <Button 
                                       variant="ghost" 
                                       className="text-sm font-medium text-foreground tabular-nums w-10 text-center p-0 h-auto hover:bg-transparent hover:text-primary"
                                       onClick={() => setVotesModalOpen(true)}
                                       title="Ver detalles de votos"
                                   >
                                       {report.upvotes - report.downvotes}
                                   </Button>
                                   <Button
                                      variant="ghost" size="icon"
                                      className={cn("h-8 w-8 rounded-full", report.userVote === 'up' && "bg-primary/20 text-primary", votingState && "opacity-50", isOwnReport && "cursor-not-allowed opacity-60")}
                                      onClick={() => handleVote('up')}
                                      disabled={votingState || isOwnReport}
                                      aria-pressed={report.userVote === 'up'}
                                      title={isOwnReport ? "No puedes votar en tus propios reportes" : "Votar positivamente"}
                                   >
                                      {votingState && report.userVote !== 'up' && !isOwnReport ? <Loader2 className="h-4 w-4 animate-spin"/> : <ThumbsUp className="h-4 w-4"/>}
                                   </Button>
                               </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" className="rounded-full">
                                        <Share2 className="mr-2 h-4 w-4" /> Compartir
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-full">
                                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                                    </Button>
                                </div>
                            </div>
                            
                            <Separator />

                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Ubicación</h3>
                                <div className="h-64 w-full bg-muted border border-border rounded-lg overflow-hidden mb-2">
                                    {isClient && report.latitude && report.longitude ? (
                                        <ReportsMap reports={[report]} defaultZoom={16} defaultCenter={{ lat: report.latitude, lng: report.longitude }} />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                                            <MapPin className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                                            <p className="text-sm text-muted-foreground">{isClient ? "Coordenadas no disponibles." : "Cargando mapa..."}</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4 flex-shrink-0" /> {formatLocation(report.location)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-3">Detalles adicionales</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    <div className="flex items-center">
                                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span className="text-muted-foreground mr-1">Fecha del incidente:</span>
                                        <span className="text-foreground font-medium">{format(report.createdAt, "PPP", { locale: es })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span className="text-muted-foreground mr-1">Hora aproximada:</span>
                                        <span className="text-foreground font-medium">{format(report.createdAt, "p", { locale: es })}</span>
                                    </div>
                                    <div className="flex items-center sm:col-span-2">
                                        {report.reportType === 'incidente' ? <TriangleAlert className="h-4 w-4 mr-2 text-muted-foreground" /> : <UserCog className="h-4 w-4 mr-2 text-muted-foreground" />}
                                        <span className="text-muted-foreground mr-1">Tipo de incidente:</span>
                                        <span className="text-foreground font-medium capitalize">{report.reportType === 'incidente' ? 'Delito' : 'Funcionario'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-card shadow-lg rounded-xl border-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Sobre el reportante</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {reporterProfile ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={reporterProfile.photoURL || undefined} alt={reporterProfile.displayName || "Avatar del reportante"} data-ai-hint="reporter avatar profile"/>
                                            <AvatarFallback>{getInitials(reporterProfile.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-foreground">{reporterProfile.displayName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Miembro desde {reporterProfile.memberSince ? format(reporterProfile.memberSince, "MMMM yyyy", { locale: es }) : 'hace tiempo'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                                        <div>
                                            <p className="text-xl font-bold text-primary">{reporterProfile.reportCount}</p>
                                            <p className="text-xs text-muted-foreground">Reportes</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-green-600">{reporterProfile.credibility}%</p>
                                            <p className="text-xs text-muted-foreground">Credibilidad</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Información de contacto</p>
                                        <Button variant="outline" className="w-full rounded-full" disabled>
                                            <MessageSquare className="mr-2 h-4 w-4" /> Próximamente
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Información del reportante no disponible.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card shadow-lg rounded-xl border-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Reportes similares cercanos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6">
                                <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Funcionalidad de reportes similares no disponible aún.
                                </p>
                            </div>
                             <Button asChild variant="outline" className="w-full mt-4 rounded-full">
                                <Link href="/danger-zones">
                                    <MapPin className="mr-2 h-4 w-4" /> Ver mapa de incidentes
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
};

export default ReportDetailPage;
