"use client";

import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Award, FilePlus, CheckSquare, TrendingUp, Star, Users, ThumbsUp, ShieldCheck, Target, CalendarClock, Sparkles, HelpCircle, ArrowLeft, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Report as WelcomeReportType } from '@/app/(app)/welcome/page'; // Use a different alias if Report is defined locally
import { differenceInDays, isAfter, subDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import Link from 'next/link'; // Import Link

// Define Report type locally or ensure it matches the imported one including necessary fields
interface Report extends WelcomeReportType {
    // Ensure fields used in calculations are present, e.g.:
    // upvotes: number;
    // downvotes: number;
    // createdAt: Date; // Assuming it's already a Date object after fetching
    // reportType: 'incidente' | 'funcionario';
    // mediaUrl: string | null;
}


interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  criteria?: string;
  target?: number; // Target value for the achievement
  progress?: number; // Calculated progress percentage
  unlocked?: boolean; // Calculated unlocked status
  comingSoon?: boolean;
  currentValue?: number; // Optional: to display "3/5 reports"
}

const initialAchievementsList: Achievement[] = [
  {
    id: 'first_report',
    title: 'Primer Reporte',
    description: '¡Bienvenido! Has dado el primer paso para un Uruapan más seguro.',
    icon: <FilePlus className="h-8 w-8 text-primary" />,
    criteria: 'Envía tu primer reporte',
    target: 1,
  },
  {
    id: 'active_voter',
    title: 'Votante Activo',
    description: 'Tu opinión cuenta. Has ayudado a validar la información de la comunidad.',
    icon: <CheckSquare className="h-8 w-8 text-green-500" />,
    criteria: 'Vota en 10 reportes',
    target: 10,
  },
  {
    id: 'detailed_reporter',
    title: 'Observador Detallista',
    description: 'Tus reportes son de calidad. ¡La evidencia ayuda mucho!',
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    criteria: 'Añade evidencia a 5 reportes',
    target: 5,
  },
  {
    id: 'community_guardian',
    title: 'Guardián Comunitario',
    description: 'Has ayudado a verificar información crucial para la seguridad.',
    icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
    criteria: 'Recibe 10 votos positivos en tus reportes',
    target: 10, // Target is 10 positive votes received
  },
  {
    id: 'pioneer',
    title: 'Pionero +Seguro',
    description: 'Uno de los primeros en unirse y fortalecer nuestra comunidad.',
    icon: <Award className="h-8 w-8 text-purple-500" />,
    criteria: 'Regístrate en los primeros 7 días del lanzamiento',
    target: 1, // Boolean achievement
  },
  {
    id: 'consistent_contributor',
    title: 'Colaborador Constante',
    description: 'Tu perseverancia hace la diferencia. ¡Sigue así!',
    icon: <TrendingUp className="h-8 w-8 text-indigo-500" />,
    criteria: 'Envía 25 reportes en total',
    target: 25,
  },
  {
    id: 'public_eye',
    title: 'Ojo Público',
    description: 'Atento a la conducta de los funcionarios. Tu supervisión es importante.',
    icon: <Users className="h-8 w-8 text-teal-500" />,
    criteria: 'Reporta 3 incidentes de funcionarios',
    target: 3,
  },
  {
    id: 'incident_alert',
    title: 'Alerta de Incidentes',
    description: 'Informando sobre delitos, ayudas a prevenir y proteger.',
    icon: <Target className="h-8 w-8 text-red-500" />,
    criteria: 'Reporta 5 delitos/incidentes',
    target: 5,
  },
  {
    id: 'trust_builder',
    title: 'Constructor de Confianza',
    description: 'Tus reportes son valorados positivamente por la comunidad.',
    icon: <ThumbsUp className="h-8 w-8 text-pink-500" />,
    criteria: 'Alcanza 50 votos positivos netos en tus reportes',
    target: 50, // Target is 50 net positive votes
  },
  {
    id: 'timely_reporter',
    title: 'Informador Oportuno',
    description: 'Reportando con frecuencia, mantienes a la comunidad actualizada.',
    icon: <CalendarClock className="h-8 w-8 text-cyan-500" />,
    criteria: 'Reporta durante 7 días distintos en un mes',
    target: 7,
  },
  {
    id: 'future_innovator',
    title: 'Innovador Futuro',
    description: 'Este logro está en desarrollo. ¡Prepárate para nuevas formas de contribuir!',
    icon: <Sparkles className="h-8 w-8 text-gray-400" />,
    criteria: 'Disponible próximamente',
    comingSoon: true,
    progress: 0,
    unlocked: false,
  },
  {
    id: 'community_expert',
    title: 'Experto de la Comunidad',
    description: 'Un nuevo desafío te espera. Conviértete en una referencia en +Seguro.',
    icon: <HelpCircle className="h-8 w-8 text-gray-400" />,
    criteria: 'Disponible próximamente',
    comingSoon: true,
    progress: 0,
    unlocked: false,
  },
];

const AchievementsPage: FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [processedAchievements, setProcessedAchievements] = useState<Achievement[]>(initialAchievementsList.map(ach => ({...ach, progress: ach.progress ?? 0, unlocked: ach.unlocked ?? false})));
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  useEffect(() => {
    if (authLoading) {
        setIsLoadingAchievements(true);
        return;
    }
    if (!user) {
        setIsLoadingAchievements(false);
        router.replace('/auth'); // Or your auth page
        return;
    }

    const fetchAchievementData = async () => {
        setIsLoadingAchievements(true);
        try {
            const userUid = user.uid;

            const reportsQuery = query(collection(db, "reports"), where("userId", "==", userUid));
            const reportsSnapshot = await getDocs(reportsQuery);
            const userReports: Report[] = reportsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    reportType: data.reportType,
                    title: data.title,
                    description: data.description,
                    location: data.location,
                    mediaUrl: data.mediaUrl || null,
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    upvotes: data.upvotes || 0,
                    downvotes: data.downvotes || 0,
                } as Report;
            });

            const votesGivenQuery = query(collection(db, "userVotes"), where("userId", "==", userUid));
            const votesGivenSnapshot = await getDocs(votesGivenQuery);
            const userVotesGivenCount = votesGivenSnapshot.size;

            const registrationTime = auth.currentUser?.metadata.creationTime;
            const registrationDate = registrationTime ? new Date(registrationTime) : null;

            const updatedAchievements = initialAchievementsList.map(ach => {
                if (ach.comingSoon) return {...ach, progress: 0, unlocked: false};

                let current = 0;
                const target = ach.target || 1;

                switch (ach.id) {
                    case 'first_report':
                        current = userReports.length;
                        break;
                    case 'active_voter':
                        current = userVotesGivenCount;
                        break;
                    case 'detailed_reporter':
                        current = userReports.filter(r => !!r.mediaUrl).length;
                        break;
                    case 'community_guardian':
                        current = userReports.reduce((sum, r) => sum + r.upvotes, 0);
                        break;
                    case 'pioneer':
                        if (registrationDate) {
                            const launchDate = new Date('2024-05-01T00:00:00Z');
                            const diff = differenceInDays(registrationDate, launchDate);
                            if (diff >= 0 && diff <= 7) current = 1;
                        }
                        break;
                    case 'consistent_contributor':
                        current = userReports.length;
                        break;
                    case 'public_eye':
                        current = userReports.filter(r => r.reportType === 'funcionario').length;
                        break;
                    case 'incident_alert':
                        current = userReports.filter(r => r.reportType === 'incidente').length;
                        break;
                    case 'trust_builder':
                        current = userReports.reduce((sum, r) => sum + (r.upvotes - r.downvotes), 0);
                        break;
                    case 'timely_reporter':
                        const oneMonthAgo = subDays(new Date(), 30);
                        const recentReports = userReports.filter(r => r.createdAt && isAfter(new Date(r.createdAt), oneMonthAgo));
                        const distinctDays = new Set(recentReports.map(r => format(new Date(r.createdAt), 'yyyy-MM-dd'))).size;
                        current = distinctDays;
                        break;
                }
                
                const progressPercentage = target > 0 ? Math.min(Math.floor((current / target) * 100), 100) : (current > 0 ? 100 : 0);
                return {
                    ...ach,
                    progress: progressPercentage,
                    unlocked: progressPercentage === 100,
                    currentValue: current,
                };
            });
            setProcessedAchievements(updatedAchievements);
        } catch (error) {
        //    console.error("Error fetching achievement data:", error);
        } finally {
            setIsLoadingAchievements(false);
        }
    };

    fetchAchievementData();
  }, [user, authLoading, router]);

  if (authLoading || isLoadingAchievements) {
    return (
      <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="text-center mb-10">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-md rounded-lg overflow-hidden bg-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <Skeleton className="h-6 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <Skeleton className="h-2 w-full mb-1" />
                  <Skeleton className="h-3 w-1/4 ml-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary rounded-full"
            onClick={() => router.push('/profile')}
            aria-label="Volver al Perfil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Mis Logros <span className="text-primary">+Seguro</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            ¡Tu participación es fundamental! Desbloquea logros contribuyendo a la seguridad de Uruapan.
          </p>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedAchievements.map((achievement) => (
              <Tooltip key={achievement.id} delayDuration={100}>
                <TooltipTrigger asChild>
                  <Card
                    className={`shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden
                      ${achievement.unlocked ? 'border-2 border-primary bg-primary/5' : 'bg-card'}
                      ${achievement.comingSoon ? 'opacity-60 cursor-default hover:shadow-md' : ''}`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
                      <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-primary/20' : achievement.comingSoon ? 'bg-muted/50' : 'bg-muted'}`}>
                        {achievement.icon}
                      </div>
                      {achievement.unlocked && !achievement.comingSoon && (
                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs">Desbloqueado</Badge>
                      )}
                      {!achievement.unlocked && achievement.progress !== undefined && !achievement.comingSoon && (
                         <Badge variant="outline" className="text-xs">En Progreso</Badge>
                      )}
                      {achievement.comingSoon && (
                        <Badge variant="outline" className="text-xs border-dashed">Próximamente</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <CardTitle className={`text-lg font-semibold mb-1 ${achievement.unlocked ? 'text-primary' : 'text-foreground'} ${achievement.comingSoon ? 'text-muted-foreground' : ''}`}>
                        {achievement.title}
                      </CardTitle>
                      <CardDescription className={`text-sm text-muted-foreground mb-3 min-h-[40px] ${achievement.comingSoon ? 'italic' : ''}`}>
                        {achievement.description}
                      </CardDescription>

                      {achievement.criteria && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground/80">Objetivo:</span> {achievement.criteria}
                          {achievement.target !== undefined && !achievement.comingSoon && achievement.id !== 'pioneer' && ( // Exclude target display for pioneer
                             <span className="text-muted-foreground"> ({achievement.currentValue ?? 0}/{achievement.target})</span>
                          )}
                        </p>
                      )}

                      {achievement.progress !== undefined && !achievement.unlocked && !achievement.comingSoon && (
                        <div className="mt-2">
                          <Progress value={achievement.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right mt-1">{achievement.progress}% completado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg text-xs">
                  {achievement.comingSoon ? (
                    <p>Este logro estará disponible pronto.</p>
                  ) : (
                    <>
                      <p>{achievement.unlocked ? '¡Logro conseguido!' : `Progreso: ${achievement.progress}%`}</p>
                      {achievement.criteria && <p>Objetivo: {achievement.criteria}</p>}
                    </>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <Card className="mt-12 text-center p-6 sm:p-8 bg-card rounded-xl shadow-lg border border-border">
            <CardHeader className="p-0 mb-4">
                <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
                    <Star className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-primary">¡Sigue Participando!</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <p className="text-muted-foreground text-base mb-6 max-w-xl mx-auto">
                    Cada reporte y cada voto cuenta. Juntos podemos hacer de Uruapan un lugar más seguro para todos.
                    ¡Explora la comunidad, reporta incidentes y desbloquea más logros!
                </p>
                <Button asChild size="lg" className="rounded-full shadow-md hover:shadow-lg transition-shadow">
                    <Link href="/reports/new">
                        <Plus className="mr-2 h-5 w-5" /> Crear Nuevo Reporte
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
      <footer className="mt-16 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} +SEGURO - Plataforma de reportes de seguridad y prevención de incidentes en Uruapan
      </footer>
    </main>
  );
};

export default AchievementsPage;
