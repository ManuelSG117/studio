
"use client";

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

const faqData: FAQItem[] = [
  {
    question: "¿Qué es +Seguro?",
    answer: (
      <>
        +Seguro es una plataforma digital enfocada en fortalecer la seguridad de nuestra ciudad, Uruapan, Michoacán.
        Desarrollada íntegramente por mí, Manuel Sandoval, esta iniciativa personal busca ofrecer a los habitantes de Uruapan una herramienta
        directa y efectiva para reportar incidentes y consultar información crucial sobre la seguridad en diversas zonas.
        El objetivo primordial es mejorar nuestro entorno y calidad de vida. Es fundamental subrayar que +Seguro opera de manera
        independiente, sin ningún tipo de afiliación política.
      </>
    ),
  },
  {
    question: "¿Cómo puedo reportar un incidente?",
    answer:
      "Para reportar un incidente, primero debes crear una cuenta. Una vez registrado e iniciada la sesión, dirígete a la sección 'Crear Nuevo Reporte', llena los detalles requeridos como título, descripción, ubicación (puedes usar tu ubicación actual o ingresarla manualmente) y adjunta evidencia multimedia si la tienes (fotos o videos). Finalmente, selecciona el tipo de reporte (Incidente/Delito o Funcionario Público) y envíalo.",
  },
  {
    question: "¿Mis reportes son anónimos?",
    answer: (
      <>
        No, los reportes en +Seguro no son anónimos. Al registrarte, tu información de usuario (como tu correo electrónico) se asocia a los reportes que creas.
        Esta decisión se tomó para fomentar la creación de reportes verídicos y responsables, ayudando a construir una base de información más confiable para la comunidad y desalentando la creación de reportes falsos o malintencionados.
        Nos tomamos muy en serio la precisión de la información.
      </>
    ),
  },
  {
    question: "¿Qué tipo de incidentes puedo reportar?",
    answer:
      "Puedes reportar dos categorías principales: 'Delitos/Incidentes' (como robos, asaltos, vandalismo, problemas de infraestructura que afecten la seguridad, etc.) y 'Funcionarios Públicos' (conductas inapropiadas, corrupción, abuso de poder, etc.).",
  },
  {
    question: "¿Cómo se verifica la información de los reportes?",
    answer:
      "La veracidad de los reportes se basa en un sistema de votación comunitaria. Otros usuarios pueden votar positiva o negativamente un reporte, lo que ayuda a determinar su confiabilidad. Además, los reportes con evidencia multimedia tienden a ser más creíbles. Próximamente, podríamos implementar niveles de verificación adicionales.",
  },
  {
    question: "¿Qué son las 'Zonas de Riesgo'?",
    answer:
      "La sección 'Zonas de Riesgo' muestra un mapa interactivo donde puedes visualizar la concentración de reportes. Esto te permite identificar áreas con mayor incidencia de problemas y tomar precauciones. Puedes ver los datos como marcadores individuales o como un mapa de calor que indica la densidad de reportes.",
  },
  {
    question: "¿Puedo ver los reportes de otros usuarios?",
    answer:
      "Sí, en la sección 'Reportes de la Comunidad' puedes ver los reportes creados por otros miembros de la plataforma. Puedes filtrarlos y ordenarlos para encontrar la información que te interesa.",
  },
  {
    question: "¿Cómo puedo contactar al equipo de +Seguro?",
    answer: (
      <>
        Puedes contactarnos enviando un correo electrónico a{' '}
        <a href="mailto:masseguro117@gmail.com" className="text-primary hover:underline">
          masseguro117@gmail.com
        </a>{' '}
        o visitar nuestra página de{' '}
        <Link href="https://www.facebook.com/profile.php?id=61576643662120" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Facebook
        </Link> para actualizaciones y comunicados.
      </>
    ),
  },
  {
    question: "¿La plataforma tiene algún costo?",
    answer:
      "No, actualmente +Seguro es una plataforma completamente gratuita para todos los usuarios.",
  },
  
];

const FaqPage: FC = () => {
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
                <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              Preguntas Frecuentes
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base pt-1">
              Encuentra respuestas a las dudas más comunes sobre +Seguro.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {faqData.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border-b border-border/50 last:border-b-0">
                    <AccordionTrigger className="text-left text-base font-medium text-foreground hover:text-primary py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-4 text-muted-foreground leading-relaxed">
                      {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground">
                No hay preguntas frecuentes disponibles en este momento.
              </p>
            )}
          </CardContent>
        </Card>
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} +SEGURO - Una iniciativa de Manuel Sandoval para Uruapan.
        </footer>
      </div>
    </main>
  );
};

export default FaqPage;
    
