"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link"; // Import Link
import { useAuth } from '@/context/AuthContext';
import { signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, type AuthError, signInWithEmailAndPassword, browserSessionPersistence, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from '@/lib/firebase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from '@/components/icons/google-icon';
import { Mail, Loader2, Terminal, UserPlus, LogIn, Check, X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Separator } from "@/components/ui/separator"; // Import Separator
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"; // Import Form components
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import Script from "next/script";

// --- Schemas ---
const loginSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  rememberMe: z.boolean().default(false).optional(), // Added rememberMe
});

// Password validation criteria
const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const registerSchema = z.object({
    registerEmail: z.string().email({ message: "Dirección de correo inválida." }),
    registerPassword: z.string()
      .min(MIN_LENGTH, { message: `Mínimo ${MIN_LENGTH} caracteres.` })
      .regex(HAS_UPPERCASE, { message: "Requiere mayúscula." })
      .regex(HAS_SPECIAL_CHAR, { message: "Requiere caracter especial." }),
    confirmPassword: z.string().min(1, { message: "Confirma tu contraseña." }),
}).refine((data) => data.registerPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Helper component for password requirements
const RequirementItem: FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <li className={cn(
    "flex items-center text-xs transition-colors duration-200",
    met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
  )}>
    {met ? (
      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
    ) : (
      <X className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
    )}
    {text}
  </li>
);


const AuthScreen: FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, loading: authContextLoading } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Agregar estos estados para el control de visibilidad de contraseñas
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false, // Initialize rememberMe
    },
  });

  // Register Form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange", // Validate on change for password checklist
    defaultValues: {
      registerEmail: "",
      registerPassword: "",
      confirmPassword: "",
    },
  });

  const registerPasswordValue = registerForm.watch("registerPassword");
  const [metMinLength, setMetMinLength] = useState(false);
  const [metUppercase, setMetUppercase] = useState(false);
  const [metSpecialChar, setMetSpecialChar] = useState(false);

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (registerPasswordValue) {
        setMetMinLength(registerPasswordValue.length >= MIN_LENGTH);
        setMetUppercase(HAS_UPPERCASE.test(registerPasswordValue));
        setMetSpecialChar(HAS_SPECIAL_CHAR.test(registerPasswordValue));
    } else {
        setMetMinLength(false);
        setMetUppercase(false);
        setMetSpecialChar(false);
    }
  }, [registerPasswordValue]);

  // Authentication redirection logic
  useEffect(() => {
    if (!authContextLoading) {
      if (isAuthenticated && user?.isProfileComplete) {
        router.replace('/welcome');
      } else if (isAuthenticated && !user?.isProfileComplete) {
        router.replace('/profile/edit');
      } else {
        setInitialLoading(false);
      }
    }
  }, [isAuthenticated, user, authContextLoading, router]);

  // --- Handlers ---

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setIsSubmitting(false);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      toast({
        title: "Inicio con Google Exitoso",
        description: "Verificando perfil...",
      });
    } catch (error) {
      // console.error("Google Sign-In Error:", error);
       let friendlyError = "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.";
       if (error instanceof Error) {
           const firebaseError = error as AuthError;
           if (firebaseError.code === 'auth/popup-closed-by-user') {
               friendlyError = "Se cerró la ventana de inicio de sesión antes de completar.";
           } else if (firebaseError.code === 'auth/cancelled-popup-request') {
                friendlyError = "Se canceló la solicitud de inicio de sesión.";
           } else if (firebaseError.code === 'auth/unauthorized-domain') {
               friendlyError = "Dominio no autorizado para Google Sign-In.";
                 toast({
                    variant: "destructive",
                    title: "Dominio no Autorizado",
                    description: "Este dominio no está autorizado. Contacta al administrador.",
                 });
                 friendlyError = ""; // Don't show in alert
           } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
                friendlyError = 'Ya existe una cuenta con este correo, pero con diferente método de inicio de sesión.';
           }
       }
       if(friendlyError) setAuthError(friendlyError);
    } finally {
        setIsGoogleLoading(false); // Stop Google loading indicator
    }
  };

  const onLoginSubmit = async (values: LoginFormData) => {
    setIsSubmitting(true); // Start submitting state (triggers overlay)
    setIsGoogleLoading(false);
    setAuthError(null);
    try {
       // Set persistence based on rememberMe checkbox
       const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
       await setPersistence(auth, persistence);
       await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo...",
      });
      // useEffect handles redirect
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "Verifica tu correo y contraseña e intenta de nuevo.";
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
          friendlyError = "Correo o contraseña incorrectos. Intenta de nuevo.";
      } else if (authError.code === 'auth/invalid-email') {
         friendlyError = 'El formato del correo electrónico no es válido.';
      } else if (authError.code === 'auth/user-disabled') {
         friendlyError = 'Esta cuenta ha sido deshabilitada.';
      } else if (authError.code === 'auth/too-many-requests') {
          friendlyError = 'Demasiados intentos. Por favor, intenta más tarde o recupera tu contraseña.';
      }
     // console.error("Firebase Login Error:", authError);
      setAuthError(friendlyError);
      setIsSubmitting(false); // Stop submitting overlay only on error
    }
    // Don't stop submitting overlay on success, useEffect will redirect
  };

  const onRegisterSubmit = async (values: RegisterFormData) => {
    setIsSubmitting(true);
    setIsGoogleLoading(false);
    setAuthError(null);

    // Ejecuta reCAPTCHA v3
    const token = await window.grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
      { action: "register" }
    );

    // Envía el token al backend junto con los datos del usuario
    const captchaRes = await fetch('/api/validate-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const captchaData = await captchaRes.json();
    if (!captchaData.success || captchaData.score < 0.5) {
      setAuthError("Por favor, verifica que eres humano.");
      setIsSubmitting(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.registerEmail, values.registerPassword);
      const user = userCredential.user;

      // Create user document in Firestore immediately after registration
      await setDoc(doc(db, "users", user.uid), {
        email: values.registerEmail,
        createdAt: Timestamp.now(),
        // Initialize other fields as null or default values if needed
        fullName: null,
        address: null,
        phoneNumber: null,
        gender: null,
        dob: null,
        photoURL: null,
        lastUpdatedAt: Timestamp.now(),
      });

      toast({
        title: "Registro Exitoso!",
        description: "Ahora completa tu perfil.",
      });
      // useEffect will handle redirect to /profile/edit
    } catch (err) {
      const authError = err as AuthError;
      let friendlyError = "El registro falló. Por favor, inténtalo de nuevo.";
       if (authError.code === "auth/email-already-in-use") {
           friendlyError = "Esta dirección de correo ya está en uso. Intenta iniciar sesión.";
       } else if (authError.code === "auth/weak-password") {
           friendlyError = "La contraseña es demasiado débil.";
       } else if (authError.code === 'auth/invalid-email') {
           friendlyError = 'El formato del correo electrónico no es válido.';
       } else if (authError.code === 'auth/operation-not-allowed') {
           friendlyError = 'Registro por correo/contraseña deshabilitado.';
       }
    //  console.error("Registration Error:", authError);
      setAuthError(friendlyError);
      setIsSubmitting(false); // Stop submitting overlay only on error
    }
    // Don't stop submitting overlay on success, useEffect will redirect
  };

  // Show initial loading state
  if (authContextLoading || initialLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  // Loading Overlay for form submission
  const LoadingOverlay: FC = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground font-medium">
          Uniéndote a un Uruapan más seguro...
      </p>
    </div>
  );

  // Auth Screen Content
  return (
    <>
      {isSubmitting && <LoadingOverlay />} {/* Show overlay when isSubmitting is true */}
      <main className={cn(
          "flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-secondary transition-opacity duration-300",
          isSubmitting && "opacity-50 pointer-events-none" // Dim background when loading overlay is active
       )}>
        <Card className="w-full max-w-md shadow-xl border-none rounded-xl bg-card overflow-hidden relative">
          {/* Back arrow to home inside Card */}
          <Link
            href="/"
            className="absolute left-4 top-4 z-20 flex items-center text-muted-foreground hover:text-primary transition-colors"
            aria-label="Volver al inicio"
            tabIndex={isSubmitting || isGoogleLoading ? -1 : undefined}
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Volver al inicio</span>
          </Link>
           {/* Header */}
           <CardHeader className="text-center pt-10 pb-6 bg-gradient-to-b from-card to-background">
              <Image
                  src="/logo.webp"
                  alt="App Logo"
                  width={150}
                  height={150}
                  className="mx-auto mb-6 rounded-lg shadow-lg"
                  priority
                  data-ai-hint="app logo safety shield"
              />
              <CardTitle className="text-3xl font-bold text-primary">+Seguro</CardTitle>
              <CardDescription className="text-muted-foreground px-4 pt-1">
                  Tu plataforma para reportar incidentes y construir un Uruapan más seguro.
              </CardDescription>
           </CardHeader>

          {/* Tabs for Login/Register */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6 sm:px-8 pb-6 pt-2">
              <TabsList className="grid w-full grid-cols-2 h-auto mb-6 bg-muted">
                  <TabsTrigger value="login" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <LogIn className="mr-2 h-4 w-4 opacity-70"/> Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="register" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <UserPlus className="mr-2 h-4 w-4 opacity-70"/> Registrarse
                  </TabsTrigger>
              </TabsList>

              {/* Error Alert */}
             {authError && (
                <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20 text-destructive text-sm">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Error</AlertTitle>
                  <AlertDescription className="text-xs">
                    {authError}
                  </AlertDescription>
                </Alert>
             )}

              {/* Login Form */}
              <TabsContent value="login">
                  <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                           <FormField
                             control={loginForm.control}
                             name="email"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>Correo Electrónico</FormLabel>
                                 <FormControl>
                                   <Input
                                     type="email"
                                     placeholder="tu@correo.com"
                                     {...field}
                                     disabled={isSubmitting || isGoogleLoading} // Disable during submission
                                     className="h-11"
                                   />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={loginForm.control}
                             name="password"
                             render={({ field }) => (
                               <FormItem>
                                  <div className="flex justify-between items-center">
                                      <FormLabel>Contraseña</FormLabel>
                                      {/* Link moved below */}
                                  </div>
                                 <FormControl>
                                   <div className="relative">
                                    <Input
                                      type={showLoginPassword ? "text" : "password"}
                                      placeholder="••••••••"
                                      {...field}
                                      disabled={isSubmitting || isGoogleLoading} // Disable during submission
                                      className="h-11 pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-11 w-11 px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                                      disabled={isSubmitting || isGoogleLoading}
                                    >
                                      {showLoginPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground/70" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground/70" />
                                      )}
                                    </Button>
                                   </div>
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           {/* Remember Me & Forgot Password */}
                           <div className="flex items-center justify-between text-xs">
                                <FormField
                                    control={loginForm.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSubmitting || isGoogleLoading} // Disable during submission
                                                aria-label="Recordar sesión"
                                                id="rememberMe"
                                            />
                                        </FormControl>
                                        <FormLabel
                                           htmlFor="rememberMe"
                                           className="font-normal text-muted-foreground cursor-pointer"
                                         >
                                            Recordar sesión
                                        </FormLabel>
                                    </FormItem>
                                    )}
                                />
                               <Link href="/forgot-password"
                                     className={cn("text-accent hover:text-accent/90 underline", (isSubmitting || isGoogleLoading) && "pointer-events-none opacity-50")} // Disable link visually
                                     tabIndex={isSubmitting || isGoogleLoading ? -1 : undefined} // Prevent tabbing when disabled
                               >
                                   ¿Olvidaste tu contraseña?
                               </Link>
                           </div>

                           <Button
                             type="submit"
                             size="lg"
                             className="w-full bg-primary hover:bg-primary/90 h-12 rounded-md text-base font-medium"
                             disabled={isSubmitting || isGoogleLoading} // Disable during submission
                           >
                               {/* Use Mail icon as default, don't show loader here */}
                               <LogIn className="mr-2 h-4 w-4"/>
                               Iniciar Sesión
                           </Button>
                      </form>
                  </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                   <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                             control={registerForm.control}
                             name="registerEmail"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>Correo Electrónico</FormLabel>
                                 <FormControl>
                                   <Input type="email" placeholder="tu@correo.com" {...field} disabled={isSubmitting || isGoogleLoading} className="h-11"/>
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={registerForm.control}
                             name="registerPassword"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>Contraseña</FormLabel>
                                 <FormControl>
                                   <div className="relative">
                                    <Input
                                      type={showRegisterPassword ? "text" : "password"}
                                      placeholder="Crea una contraseña segura"
                                      {...field}
                                      disabled={isSubmitting || isGoogleLoading} // Disable during submission
                                      className="h-11 pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-11 w-11 px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                      disabled={isSubmitting || isGoogleLoading}
                                    >
                                      {showRegisterPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground/70" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground/70" />
                                      )}
                                    </Button>
                                   </div>
                                 </FormControl>
                                 {/* Password Requirements Checklist */}
                                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 pl-1">
                                      <RequirementItem met={metMinLength} text={`Mín. ${MIN_LENGTH} chars`} />
                                      <RequirementItem met={metUppercase} text="Mayúscula" />
                                      <RequirementItem met={metSpecialChar} text="Especial (!@#)" />
                                  </ul>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={registerForm.control}
                             name="confirmPassword"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>Confirmar Contraseña</FormLabel>
                                 <FormControl>
                                   <div className="relative">
                                    <Input
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Vuelve a escribir tu contraseña"
                                      {...field}
                                      disabled={isSubmitting || isGoogleLoading} // Disable during submission
                                      className="h-11 pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-11 w-11 px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      disabled={isSubmitting || isGoogleLoading}
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground/70" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground/70" />
                                      )}
                                    </Button>
                                   </div>
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                   
                           <FormDescription className="text-xs text-muted-foreground text-center pt-1">
                               Únete a +Seguro para contribuir a un Uruapan más seguro.
                           </FormDescription>
                           <Button
                             type="submit"
                             size="lg"
                             className="w-full bg-primary hover:bg-primary/90 h-12 rounded-md text-base font-medium"
                             disabled={isSubmitting || isGoogleLoading || !registerForm.formState.isValid || !recaptchaToken} // Disable during submission
                           >
                               {/* Use UserPlus icon as default, don't show loader here */}
                               <UserPlus className="mr-2 h-4 w-4"/>
                               Registrarme
                           </Button>
                      </form>
                   </Form>
              </TabsContent>

              {/* Divider and Google Sign-In (Common to both tabs) */}
               <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                     <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-card px-2 text-muted-foreground">
                        O continúa con
                     </span>
                  </div>
               </div>

                <Button
                   onClick={handleGoogleSignIn}
                   variant="outline"
                   className="w-full h-12 rounded-md text-base font-medium border-input hover:bg-accent/90"
                   size="lg"
                   disabled={isSubmitting || isGoogleLoading} // Disable during submission
                   type="button"
                 >
                   {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                   {isGoogleLoading ? 'Iniciando...' : 'Continuar con Google'}
                </Button>

               {/* Footer with Terms Link */}
               <CardFooter className="text-center text-xs text-muted-foreground justify-center pt-6 pb-0 px-0">
                  Al continuar, aceptas nuestros{' '}
                  <Link href="/privacy-policy" className={cn("text-accent hover:text-accent/90 underline ml-1", (isSubmitting || isGoogleLoading) && "pointer-events-none opacity-50")}>
                     Términos y Condiciones
                  </Link>
               </CardFooter>

          </Tabs>

        </Card>
      
      </main>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        strategy="afterInteractive"
      />
    </>
  );
};

export default AuthScreen;
