"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";

const WelcomePage: FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // If no user is logged in, redirect to registration
        router.replace("/register");
      }
       // Only set loading to false after checking auth state
       // Add a small delay to prevent flicker if auth resolves quickly
       setTimeout(() => setIsLoading(false), 300);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/"); // Redirect to home or login after logout
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally show a toast message for logout error
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="text-center space-y-4">
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-10 w-24 mx-auto" />
          </CardContent>
        </Card>
      </main>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome!</CardTitle>
          <CardDescription>You have successfully registered.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-foreground">
            Welcome, {user?.email || "User"}!
          </p>
           <Button
            onClick={handleLogout}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default WelcomePage;
