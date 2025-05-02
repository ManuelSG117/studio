
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Edit, User as UserIcon, Mail, Home, Phone, Cake, VenetianMask } from 'lucide-react'; // Removed ArrowLeft as back nav is handled by bottom bar
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale
import { useToast } from '@/hooks/use-toast';

// TODO: Define a type for detailed user profile data fetched from Firestore
interface UserProfile {
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  gender?: 'masculino' | 'femenino' | 'otro';
  dob?: Date; // Store as Date object
}

// Placeholder function to get user profile data (replace with Firestore fetch)
const getUserProfileData = async (userId: string): Promise<UserProfile | null> => {
    // Simulate fetching data - replace with actual Firestore call
    console.log("Fetching profile for user:", userId);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    // In a real app, you'd fetch from Firestore:
    // const userDocRef = doc(db, 'users', userId);
    // const userDocSnap = await getDoc(userDocRef);
    // if (userDocSnap.exists()) {
    //   const data = userDocSnap.data();
    //   return {
    //      ...data,
    //      dob: data.dob?.toDate(), // Convert Firestore Timestamp to Date
    //   };
    // }
    // Return placeholder data for now
    return {
      fullName: "Nombre Completo (Ejemplo)",
      address: "Dirección de Ejemplo 123",
      phoneNumber: "+56 9 8765 4321",
      gender: "masculino",
      dob: new Date(1995, 5, 15), // Example DOB
    };
};


const ProfilePage: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch additional profile data
        const profileData = await getUserProfileData(currentUser.uid);
        setUserProfile(profileData);
      } else {
        router.replace("/login"); // Redirect if not logged in
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

  // Get initials for Avatar Fallback
  const getInitials = (name?: string | null): string => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
    return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
  };

  // Display Loading Skeletons
  if (isLoading) {
    return (
      <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary">
        <Card className="w-full max-w-lg shadow-lg border-none rounded-xl bg-card">
          <CardHeader className="relative pb-4 pt-8 items-center text-center">
             {/* Removed back button skeleton */}
            <Skeleton className="h-20 w-20 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 pb-8 px-6 sm:px-8 gap-3">
            <Skeleton className="h-10 w-full sm:w-auto sm:flex-1 rounded-full" />
            <Skeleton className="h-10 w-full sm:w-auto sm:flex-1 rounded-full" />
          </CardFooter>
        </Card>
      </main>
    );
  }

  // If user data failed to load (shouldn't happen if redirected correctly)
  if (!user) {
    return (
       <main className="flex flex-col items-center justify-center p-4 bg-secondary">
            <Card className="w-full max-w-md shadow-lg border-none rounded-xl text-center bg-card">
                 <CardHeader>
                     <CardTitle className="text-xl text-destructive">Error</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-muted-foreground mb-6">
                         No se pudo cargar la información del usuario.
                     </p>
                     {/* Changed button to redirect to login */}
                     <Button onClick={() => router.push('/login')} variant="outline" className="rounded-full">
                         Ir a Inicio de Sesión
                     </Button>
                 </CardContent>
            </Card>
       </main>
    );
  }

  // Display Profile
  return (
    <main className="flex flex-col items-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-lg shadow-lg border-none rounded-xl bg-card">
        <CardHeader className="relative pb-4 pt-8 items-center text-center">
           {/* Back Button removed, navigation handled by bottom bar */}

          <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
             {/* Use user.photoURL if available, otherwise fallback */}
            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Foto de perfil" data-ai-hint="user profile avatar"/>
            <AvatarFallback className="text-xl bg-muted text-muted-foreground">
               {/* Use initials from Firestore profile if available, else from auth display name, else from email */}
              {getInitials(userProfile?.fullName || user.displayName || user.email)}
            </AvatarFallback>
          </Avatar>
           {/* Display full name from profile if available, else display name from auth, else 'Usuario' */}
          <CardTitle className="text-xl font-bold text-primary">
             {userProfile?.fullName || user.displayName || 'Usuario'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pt-4 pb-6 space-y-4">
          <h3 className="text-base font-semibold text-primary border-b pb-2 mb-4">Información Personal</h3>

           {/* Display Full Name if different from Title */}
           {userProfile?.fullName && userProfile.fullName !== (user.displayName || 'Usuario') && (
             <div className="flex items-start space-x-3 text-sm">
               <UserIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                 <span className="font-medium text-foreground/80">Nombre Completo:</span>
                 <p className="text-foreground">{userProfile.fullName}</p>
               </div>
             </div>
           )}

           {/* Address */}
           {userProfile?.address && (
              <div className="flex items-start space-x-3 text-sm">
                 <Home className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <span className="font-medium text-foreground/80">Dirección:</span>
                    <p className="text-foreground">{userProfile.address}</p>
                </div>
              </div>
           )}

            {/* Phone Number */}
           {userProfile?.phoneNumber && (
              <div className="flex items-start space-x-3 text-sm">
                 <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <span className="font-medium text-foreground/80">Teléfono:</span>
                    <p className="text-foreground">{userProfile.phoneNumber}</p>
                 </div>
              </div>
           )}

           {/* Gender */}
           {userProfile?.gender && (
              <div className="flex items-start space-x-3 text-sm">
                 <VenetianMask className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                 <div className="flex-1">
                   <span className="font-medium text-foreground/80">Género:</span>
                   <p className="text-foreground capitalize">{userProfile.gender}</p>
                 </div>
              </div>
           )}

            {/* Date of Birth */}
           {userProfile?.dob && (
              <div className="flex items-start space-x-3 text-sm">
                 <Cake className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <span className="font-medium text-foreground/80">Fecha de Nacimiento:</span>
                    <p className="text-foreground">
                        {format(userProfile.dob, "PPP", { locale: es })} {/* Format date */}
                    </p>
                </div>
              </div>
           )}

             {/* Fallback if no extra profile data */}
             {!userProfile && (
                 <p className="text-sm text-muted-foreground italic text-center pt-2">
                     Información adicional del perfil no disponible.
                 </p>
             )}

        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 pb-8 px-6 sm:px-8 gap-3 border-t border-border">
          <Button variant="outline" className="w-full sm:w-auto rounded-full" onClick={() => toast({ title: "Próximamente", description: "La edición del perfil estará disponible pronto."})}>
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto rounded-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export default ProfilePage;
