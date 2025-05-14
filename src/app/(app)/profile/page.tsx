"use client";

import type { FC, ReactNode } from 'react'; 
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase/client'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Edit, Mail, Home, Phone, Cake, ChevronRight, Award, FilePlus, CheckSquare, TrendingUp, Star, Users, ThumbsUp, ShieldCheck, Target, CalendarClock, Sparkles, HelpCircle, MapPin, Activity, ShieldQuestion } from 'lucide-react'; 
import { format, differenceInDays, isAfter, subDays } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useToast } from '@/hooks/use-toast';
import { VotingStats } from '@/components/profile/voting-stats'; 
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Report as WelcomeReportType } from '@/app/(app)/welcome/page';

// Copied Achievement structure from achievements/page.tsx for calculation
interface AchievementDefinition {
  id: string;
  target?: number;
  comingSoon?: boolean;
}
// Copied achievement list for calculation logic from achievements/page.tsx
const achievementsDefinitionList: AchievementDefinition[] = [
  { id: 'first_report', target: 1 },
  { id: 'active_voter', target: 10 },
  { id: 'detailed_reporter', target: 5 },
  { id: 'community_guardian', target: 10 },
  { id: 'pioneer', target: 1 },
  { id: 'consistent_contributor', target: 25 },
  { id: 'public_eye', target: 3 },
  { id: 'incident_alert', target: 5 },
  { id: 'trust_builder', target: 50 },
  { id: 'timely_reporter', target: 7 },
  // "Coming soon" achievements are not relevant for level calculation
];


export interface UserProfile { 
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  gender?: 'masculino' | 'femenino' | 'otro';
  dob?: Date; 
  photoURL?: string | null; 
  upvotesGiven?: number; 
  downvotesGiven?: number; 
  memberSince?: Date;
  lastActivity?: Date; // Added lastActivity
}

// Report type for achievement calculation
interface ReportForAchievements extends WelcomeReportType {
    // ensure all necessary fields are present
}

// Copied from achievements page for consistency in display
const achievementsListDisplay: Array<{ id: string; title: string; description: string; icon: ReactNode; unlocked?: boolean;}> = [
  {
    id: 'first_report',
    title: 'Primer Reporte',
    description: '¡Bienvenido! Has dado el primer paso.',
    icon: <FilePlus className="h-5 w-5 text-yellow-700" />,
  },
  {
    id: 'community_guardian',
    title: 'Guardián Comunitario',
    description: 'Has ayudado a verificar información.',
    icon: <ShieldCheck className="h-5 w-5 text-blue-700" />,
  },
  {
    id: 'pioneer',
    title: 'Pionero +Seguro',
    description: 'De los primeros en unirse.',
    icon: <Award className="h-5 w-5 text-green-700" />,
  },
];


export const getUserProfileData = async (userId: string): Promise<UserProfile | null> => { 
    if (!userId) return null; 
    console.log("Fetching profile for user:", userId);
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("Profile data found:", data);
          return {
              fullName: data.fullName,
              address: data.address,
              phoneNumber: data.phoneNumber,
              gender: data.gender,
              dob: data.dob instanceof Timestamp ? data.dob.toDate() : undefined,
              photoURL: data.photoURL, 
              upvotesGiven: data.upvotesGiven || 0, 
              downvotesGiven: data.downvotesGiven || 0, 
              memberSince: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
              lastActivity: data.lastActivity instanceof Timestamp ? data.lastActivity.toDate() : undefined,
          };
        } else {
           console.log("No profile document found for user:", userId);
            const defaultProfile: UserProfile = {
                fullName: auth.currentUser?.displayName || '',
                address: '',
                phoneNumber: '',
                gender: undefined,
                dob: undefined,
                photoURL: auth.currentUser?.photoURL || null,
                upvotesGiven: 0,
                downvotesGiven: 0,
                memberSince: auth.currentUser?.metadata.creationTime ? new Date(auth.currentUser.metadata.creationTime) : undefined,
                lastActivity: undefined, // No lastActivity for default
            };
            return defaultProfile;
        }
    } catch (error) {
       console.error("Error fetching user profile data:", error);
       return null; 
    }
};


const ProfilePage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEnhancements, setIsLoadingEnhancements] = useState(true);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [isCitizenActive, setIsCitizenActive] = useState(false);
  const [displayAchievements, setDisplayAchievements] = useState<Array<{ id: string; title: string; description: string; icon: ReactNode; unlocked?: boolean;}>>([]);


  useEffect(() => {
    setIsLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileData = await getUserProfileData(currentUser.uid);
        setUserProfile(profileData);

        if (profileData?.lastActivity) {
            const sevenDaysAgo = subDays(new Date(), 7);
            setIsCitizenActive(isAfter(profileData.lastActivity, sevenDaysAgo));
        }

        if (profileData?.photoURL !== currentUser.photoURL) {
           setUser({ ...currentUser, photoURL: profileData?.photoURL || null });
           console.log("Syncing auth photoURL with Firestore data");
        }
      } else {
        setUser(null);
        setUserProfile(null);
        router.replace("/auth"); 
      }
      setIsLoading(false); 
    });
    return () => unsubscribe();
  }, [router]); 

  const calculateUserLevelAndAchievements = useCallback(async (currentUser: User) => {
    setIsLoadingEnhancements(true);
    try {
        const userUid = currentUser.uid;
        const reportsQuery = query(collection(db, "reports"), where("userId", "==", userUid));
        const reportsSnapshot = await getDocs(reportsQuery);
        const userReports: ReportForAchievements[] = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId, reportType: data.reportType, title: data.title,
                description: data.description, location: data.location,
                mediaUrl: data.mediaUrl || null, latitude: data.latitude || null,
                longitude: data.longitude || null,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                upvotes: data.upvotes || 0, downvotes: data.downvotes || 0,
            } as ReportForAchievements;
        });

        const votesGivenQuery = query(collection(db, "userVotes"), where("userId", "==", userUid));
        const votesGivenSnapshot = await getDocs(votesGivenQuery);
        const userVotesGivenCount = votesGivenSnapshot.size;
        
        const registrationTime = currentUser?.metadata.creationTime;
        const registrationDate = registrationTime ? new Date(registrationTime) : null;

        let unlockedCount = 0;
        const processedDisplayAchievements = achievementsListDisplay.map(dispAch => {
            const defAch = achievementsDefinitionList.find(d => d.id === dispAch.id);
            if (!defAch || defAch.comingSoon) return {...dispAch, unlocked: false};

            let current = 0;
            const target = defAch.target || 1;

            switch (defAch.id) {
                case 'first_report': current = userReports.length; break;
                case 'active_voter': current = userVotesGivenCount; break;
                case 'detailed_reporter': current = userReports.filter(r => !!r.mediaUrl).length; break;
                case 'community_guardian': current = userReports.reduce((sum, r) => sum + r.upvotes, 0); break;
                case 'pioneer':
                    if (registrationDate) {
                        const launchDate = new Date('2024-05-01T00:00:00Z'); // Example launch date
                        if (differenceInDays(registrationDate, launchDate) <= 7 && differenceInDays(registrationDate, launchDate) >= 0) current = 1;
                    }
                    break;
                case 'consistent_contributor': current = userReports.length; break;
                case 'public_eye': current = userReports.filter(r => r.reportType === 'funcionario').length; break;
                case 'incident_alert': current = userReports.filter(r => r.reportType === 'incidente').length; break;
                case 'trust_builder': current = userReports.reduce((sum, r) => sum + (r.upvotes - r.downvotes), 0); break;
                case 'timely_reporter':
                    const oneMonthAgo = subDays(new Date(), 30);
                    const recentReports = userReports.filter(r => r.createdAt && isAfter(new Date(r.createdAt), oneMonthAgo));
                    const distinctDays = new Set(recentReports.map(r => format(new Date(r.createdAt), 'yyyy-MM-dd'))).size;
                    current = distinctDays;
                    break;
            }
            const isUnlocked = target > 0 ? (current >= target) : (current > 0);
            if (isUnlocked) unlockedCount++;
            return {...dispAch, unlocked: isUnlocked};
        });

        setDisplayAchievements(processedDisplayAchievements.filter(a => a.unlocked).slice(0,3));


        if (unlockedCount >= 8) setUserLevel(5);
        else if (unlockedCount >= 6) setUserLevel(4);
        else if (unlockedCount >= 4) setUserLevel(3);
        else if (unlockedCount >= 2) setUserLevel(2);
        else setUserLevel(1);

    } catch (error) {
        console.error("Error calculating user level/achievements:", error);
        setUserLevel(1); // Default to level 1 on error
        setDisplayAchievements(achievementsListDisplay.slice(0,3).map(a => ({...a, unlocked: false })));
    } finally {
        setIsLoadingEnhancements(false);
    }
  }, []);


  useEffect(() => {
    if (user && !isLoading) { // Ensure user is loaded before calculating level
      calculateUserLevelAndAchievements(user);
    }
  }, [user, isLoading, calculateUserLevelAndAchievements]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      router.push("/"); 
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Error al Cerrar Sesión",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      });
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
    return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
  };

  const displayPhotoURL = userProfile?.photoURL ?? user?.photoURL ?? undefined;


  if (isLoading || isLoadingEnhancements) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary min-h-screen">
        <Card className="w-full max-w-7xl shadow-lg border-none rounded-xl bg-card">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column Skeleton */}
            <div className="md:col-span-1 space-y-4 p-6 bg-muted/30 rounded-lg">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full mb-3" />
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right Column Skeleton */}
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" /> 
              <Skeleton className="h-40 w-full" /> 
              <Skeleton className="h-28 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end items-center p-6 gap-3 border-t border-border">
            <Skeleton className="h-10 w-full sm:w-32 rounded-full" />
            <Skeleton className="h-10 w-full sm:w-32 rounded-full" />
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-secondary">
            <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center bg-card">
                 <CardHeader>
                     <CardTitle className="text-xl text-destructive">Error de Autenticación</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-muted-foreground mb-6">
                         No estás autenticado. Redirigiendo a inicio de sesión...
                     </p>
                 </CardContent>
            </Card>
       </main>
    );
  }

  return (
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
      <Card className="w-full max-w-7xl shadow-xl border-none rounded-2xl bg-card overflow-hidden"> 
        <CardContent className="p-0 sm:p-0 md:grid md:grid-cols-12">
          <div className="md:col-span-4 bg-muted/40 p-6 space-y-5 border-r border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <Avatar className="w-24 h-24 border-2 border-primary">
                  <AvatarImage src={displayPhotoURL} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                    {getInitials(userProfile?.fullName || user.displayName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  aria-label="Editar perfil"
                  onClick={() => router.push('/profile/edit')}
                  className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full border-2 border-card cursor-pointer transition-all duration-200 hover:bg-green-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <Edit className="h-4 w-4 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                 {userProfile?.fullName || user.displayName || 'Usuario +Seguro'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Miembro desde {userProfile?.memberSince ? format(userProfile.memberSince, "MMMM yyyy", { locale: es }) : 'N/A'}
              </p>
              <div className="flex gap-2 mt-3">
                {isCitizenActive && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Ciudadano Activo
                  </Badge>
                )}
                {userLevel !== null && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">Nivel {userLevel}</Badge>
                )}
                 {!isCitizenActive && userLevel === null && ( // Show if neither are determined yet or false
                    <Badge variant="outline" className="border-dashed flex items-center gap-1">
                        <ShieldQuestion className="h-3 w-3" /> Verificando actividad...
                    </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-5 border-t border-border/30 mt-5">
              {userProfile?.address && (
                <div className="flex items-start space-x-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-foreground">{userProfile.address}</p>
                  </div>
                </div>
              )}
               {userProfile?.phoneNumber && (
                <div className="flex items-start space-x-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">{userProfile.phoneNumber}</p>
                </div>
              )}
              {user.email && (
                  <div className="flex items-start space-x-2.5 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{user.email}</p>
                  </div>
              )}
              {userProfile?.dob && (
                <div className="flex items-start space-x-2.5 text-sm">
                  <Cake className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">
                    {format(userProfile.dob, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              )}
              
              {(!userProfile?.address || !userProfile?.phoneNumber || !userProfile.dob) && (
                  <p className="text-xs text-muted-foreground italic text-center pt-2">
                    Completa tu perfil para una mejor experiencia.
                  </p>
                )}
            </div>
          </div>

          <div className="md:col-span-8 p-6 space-y-8">
            {user && <VotingStats userId={user.uid} />}
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" /> Logros Desbloqueados
                </h3>
                <Link href="/achievements" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center">
                    Ver todos
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
              {displayAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayAchievements.map((achievement) => (
                    <Card key={achievement.id} className={cn(
                        "p-3 rounded-lg border flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow",
                         achievement.id === 'first_report' ? 'bg-yellow-200 dark:bg-yellow-900/80 border-yellow-300 dark:border-yellow-900' : 
                         achievement.id === 'community_guardian' ? 'bg-blue-200 dark:bg-blue-900/80 border-blue-300 dark:border-blue-900' :
                         achievement.id === 'pioneer' ? 'bg-green-200 dark:bg-green-900/80 border-green-300 dark:border-green-900' :
                         'bg-gray-200 dark:bg-gray-900/80 border-gray-300 dark:border-gray-900' // Default for other unlocked achievements if any
                        )}>
                      <div className={cn(
                          "p-2 rounded-full",
                           achievement.id === 'first_report' ? 'bg-yellow-300 dark:bg-yellow-800/80' : 
                           achievement.id === 'community_guardian' ? 'bg-blue-300 dark:bg-blue-800/80' :
                           achievement.id === 'pioneer' ? 'bg-green-300 dark:bg-green-800/80' :
                           'bg-gray-300 dark:bg-gray-800/80'
                          )}>
                        {achievement.icon}
                      </div>
                      <div>
                        <p className={cn(
                            "text-sm font-semibold",
                             achievement.id === 'first_report' ? 'text-yellow-900 dark:text-yellow-100' : 
                             achievement.id === 'community_guardian' ? 'text-blue-900 dark:text-blue-100' :
                             achievement.id === 'pioneer' ? 'text-green-900 dark:text-green-100' :
                             'text-gray-900 dark:text-gray-100'
                            )}>{achievement.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{achievement.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-3 bg-muted/30 rounded-md">
                  Aún no has desbloqueado ningún logro. ¡Sigue participando!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default ProfilePage;

