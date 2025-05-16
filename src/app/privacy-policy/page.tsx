
"use client";

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface PolicySection {
  title: string;
  content: string | JSX.Element;
}

const privacyPolicyData: PolicySection[] = [
  {
    title: "1. Introducción",
    content:
      "Bienvenido a la Política de Privacidad de +Seguro. Esta política describe cómo recopilamos, usamos, protegemos y compartimos tu información personal cuando utilizas nuestra plataforma. Tu privacidad es importante para nosotros y nos comprometemos a protegerla.",
  },
  {
    title: "2. Información que Recopilamos",
    content: (
      <>
        Recopilamos la siguiente información para operar y mejorar +Seguro:
        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
          <li><strong>Información de Registro:</strong> Cuando te registras, recopilamos tu dirección de correo electrónico. Si te registras con Google, también podemos recopilar tu nombre y foto de perfil según lo permitido por Google.</li>
          <li><strong>Información del Perfil:</strong> Puedes optar por proporcionar información adicional en tu perfil, como tu nombre completo, dirección, número de teléfono, género y fecha de nacimiento.</li>
          <li><strong>Información de Reportes:</strong> Cuando creas un reporte, recopilamos el título, descripción, ubicación (incluyendo coordenadas si las proporcionas), tipo de reporte y cualquier archivo multimedia que adjuntes. Tu ID de usuario se asocia con los reportes que creas.</li>
          <li><strong>Información de Votos:</strong> Registramos los votos que realizas en los reportes, asociándolos con tu ID de usuario.</li>
          <li><strong>Información de Uso:</strong> Podemos recopilar información sobre cómo interactúas con la plataforma, como las funciones que utilizas y la frecuencia de uso, para mejorar nuestros servicios.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Cómo Usamos tu Información",
    content: (
        <>
            Utilizamos tu información para:
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Proporcionar y mantener los servicios de +Seguro.</li>
                <li>Permitir la creación y gestión de reportes y perfiles de usuario.</li>
                <li>Facilitar la interacción comunitaria, como el sistema de votos.</li>
                <li>Mejorar la plataforma y desarrollar nuevas funcionalidades.</li>
                <li>Comunicarnos contigo sobre tu cuenta o actualizaciones importantes.</li>
                <li>Prevenir el fraude y garantizar la seguridad de la plataforma.</li>
            </ul>
        </>
    ),
  },
  {
    title: "4. Cómo Compartimos tu Información",
    content:
      "No vendemos, alquilamos ni compartimos tu información personal con terceros con fines de marketing. Podemos compartir tu información en las siguientes circunstancias limitadas: (1) Con tu consentimiento. (2) Para cumplir con obligaciones legales. (3) Para proteger nuestros derechos y la seguridad de otros usuarios. (4.1) La información de los reportes (excluyendo tu correo electrónico directo, a menos que el reporte lo contenga explícitamente) es visible para otros usuarios de la plataforma para fomentar la conciencia comunitaria. (4.2) Los datos agregados y anonimizados pueden ser utilizados para análisis estadísticos y para informar sobre tendencias de seguridad, pero no identificarán a usuarios individuales.",
  },
  {
    title: "5. Seguridad de tu Información",
    content:
      "Tomamos medidas razonables para proteger tu información personal contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Utilizamos Firebase Authentication y Firestore, que cuentan con sus propias medidas de seguridad. Sin embargo, ningún sistema de transmisión por Internet o almacenamiento electrónico es 100% seguro.",
  },
  {
    title: "6. Tus Derechos y Opciones",
    content:
      "Tienes derecho a acceder, corregir o eliminar tu información personal. Puedes actualizar la información de tu perfil directamente en la plataforma. Si deseas eliminar tu cuenta o tienes otras solicitudes relacionadas con tus datos, contáctanos en masseguro117@gmail.com.",
  },
  {
    title: "7. Cookies y Tecnologías Similares",
    content:
      "Podemos utilizar cookies y tecnologías similares para mejorar tu experiencia en la plataforma, como mantener tu sesión iniciada. Puedes configurar tu navegador para rechazar las cookies, pero esto podría afectar la funcionalidad de algunas partes de +Seguro.",
  },
  {
    title: "8. Cambios a esta Política de Privacidad",
    content:
      "Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos sobre cualquier cambio publicando la nueva política en esta página. Te recomendamos revisar esta política periódicamente.",
  },
  {
    title: "9. Contacto",
    content: (
      <>
        Si tienes alguna pregunta sobre esta Política de Privacidad, por favor contáctame en:{' '}
        <a href="mailto:masseguro117@gmail.com" className="text-primary hover:underline">
          masseguro117@gmail.com
        </a>.
      </>
    ),
  },
];

const PrivacyPolicyPage: FC = () => {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-start w-full">
            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary rounded-full mr-auto"
                onClick={() => router.back()}
                aria-label="Volver"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </div>
        <Card className="w-full shadow-xl border-none rounded-2xl bg-card">
          <CardHeader className="text-center items-center pt-8 pb-6">
            <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              Política de Privacidad
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base pt-1">
              Última actualización: 2 de mayo de 2024 {/* Placeholder Date */}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {privacyPolicyData.map((item, index) => (
              <section key={index}>
                <h2 className="text-xl font-semibold text-foreground mb-2">{item.title}</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} +SEGURO - Una iniciativa de Manuel Sandoval para Uruapan.
        </footer>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
    
