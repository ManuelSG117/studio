"use client";

import type { FC, ReactNode } from 'react'; 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase/client'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Edit, User as UserIcon, Mail, Home, Phone, Cake, VenetianMask, ChevronRight, Award, FilePlus, CheckSquare, TrendingUp, Star, Users, ThumbsUp, ShieldCheck, Target, CalendarClock, Sparkles, HelpCircle, MapPin } from 'lucide-react'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useToast } from '@/hooks/use-toast';
import { VotingStats } from '@/components/profile/voting-stats'; 
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface UserProfile { 
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  gender?: 'masculino' | 'femenino' | 'otro';
  dob?: Date; 
  photoURL?: string | null; 
  upvotesGiven?: number; 
  downvotesGiven?: number; 
  memberSince?: Date; // Added memberSince
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  criteria?: string;
  progress?: number;
  unlocked?: boolean;
  comingSoon?: boolean;
}

const achievementsList: Achievement[] = [
  {
    id: 'first_report',
    title: 'Primer Reporte',
    description: '¡Bienvenido! Has dado el primer paso para un Uruapan más seguro.',
    icon: <FilePlus className="h-5 w-5 text-primary" />, // Adjusted icon size
    criteria: 'Envía tu primer reporte',
    progress: 100,
    unlocked: true,
  },
  {
    id: 'active_voter',
    title: 'Votante Activo',
    description: 'Tu opinión cuenta. Has ayudado a validar la información de la comunidad.',
    icon: <CheckSquare className="h-5 w-5 text-green-500" />, // Adjusted icon size
    criteria: 'Vota en 10 reportes',
    progress: 70,
    unlocked: false,
  },
  {
    id: 'detailed_reporter',
    title: 'Observador Detallista',
    description: 'Tus reportes son de calidad. ¡La evidencia ayuda mucho!',
    icon: <Star className="h-5 w-5 text-yellow-500" />, // Adjusted icon size
    criteria: 'Añade evidencia a 5 reportes',
    progress: 40,
    unlocked: false,
  },
   {
    id: 'community_guardian',
    title: 'Guardián Comunitario',
    description: 'Has ayudado a verificar información crucial para la seguridad.',
    icon: <ShieldCheck className="h-5 w-5 text-blue-500" />,
    criteria: 'Recibe 10 votos positivos en tus reportes',
    progress: 80,
    unlocked: true, // Example, changed for visual consistency with image
  },
  {
    id: 'pioneer',
    title: 'Pionero +Seguro',
    description: 'Uno de los primeros en unirse y fortalecer nuestra comunidad.',
    icon: <Award className="h-5 w-5 text-purple-500" />,
    criteria: 'Regístrate en los primeros 7 días',
    progress: 100,
    unlocked: true, 
  },
  {
    id: 'consistent_contributor',
    title: 'Colaborador Constante',
    description: 'Tu perseverancia hace la diferencia. ¡Sigue así!',
    icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
    criteria: 'Envía 25 reportes en total',
    progress: 15,
    unlocked: false,
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
              memberSince: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined, // Assuming createdAt is memberSince
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

  const unlockedAchievements = achievementsList.filter(ach => ach.unlocked && !ach.comingSoon).slice(0, 3); // Show max 3

  useEffect(() => {
    setIsLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileData = await getUserProfileData(currentUser.uid);
        setUserProfile(profileData);
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


  if (isLoading) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary min-h-screen">
        <Card className="w-full max-w-4xl shadow-lg border-none rounded-xl bg-card">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column Skeleton */}
            <div className="md:col-span-1 space-y-4 p-6 bg-muted/30 rounded-lg">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full mb-3" />
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
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
      <Card className="w-full max-w-4xl shadow-xl border-none rounded-2xl bg-card overflow-hidden"> 
        <CardContent className="p-0 sm:p-0 md:grid md:grid-cols-12"> {/* Removed default padding, use grid for layout */}
          {/* Left Column: User Info */}
          <div className="md:col-span-4 bg-muted/40 p-6 space-y-5 border-r border-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <Avatar className="w-24 h-24 border-2 border-primary">
                  <AvatarImage src={displayPhotoURL} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                    {getInitials(userProfile?.fullName || user.displayName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full border-2 border-card">
                    <CheckSquare className="h-3 w-3 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                 {userProfile?.fullName || user.displayName || 'Usuario +Seguro'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Miembro desde {userProfile?.memberSince ? format(userProfile.memberSince, "MMM yyyy", { locale: es }) : 'N/A'}
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">Ciudadano Activo</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">Nivel 3</Badge>
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
                    {format(userProfile.dob, "dd/MM/yyyy", { locale: es })}
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

          {/* Right Column: Stats, Activity, Achievements */}
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
              {unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.map((achievement) => (
                    <Card key={achievement.id} className={cn(
                        "p-3 rounded-lg border flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow",
                        achievement.id === 'first_report' ? 'bg-yellow-50 border-yellow-200' : 
                        achievement.id === 'community_guardian' ? 'bg-blue-50 border-blue-200' :
                        'bg-green-50 border-green-200' // Default to green for others or pioneer
                        )}>
                      <div className={cn(
                          "p-2 rounded-full",
                           achievement.id === 'first_report' ? 'bg-yellow-100' : 
                           achievement.id === 'community_guardian' ? 'bg-blue-100' :
                           'bg-green-100'
                          )}>
                        {achievement.icon}
                      </div>
                      <div>
                        <p className={cn(
                            "text-sm font-semibold",
                             achievement.id === 'first_report' ? 'text-yellow-700' : 
                             achievement.id === 'community_guardian' ? 'text-blue-700' :
                             'text-green-700'
                            )}>{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
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

        <CardFooter className="flex flex-col sm:flex-row justify-end items-center p-6 gap-3 border-t border-border">
          <Button variant="outline" className="w-full sm:w-auto rounded-full" onClick={() => router.push('/profile/edit')}>
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto rounded-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default ProfilePage;

