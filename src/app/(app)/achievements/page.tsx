
"use client";

import type { FC, ReactNode } from 'react';
import { Award, FilePlus, CheckSquare, TrendingUp, Star, Users, ThumbsUp, ShieldCheck, Target, CalendarClock, Sparkles, HelpCircle } from 'lucide-react'; // Added Sparkles, HelpCircle for new achievements
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Import Progress component
import { Badge } from '@/components/ui/badge'; // Import Badge component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  criteria?: string; // e.g., "Reporta 5 incidentes"
  progress?: number; // 0-100 for progress bar
  unlocked?: boolean; // To style unlocked achievements
  comingSoon?: boolean; // Flag for "coming soon" achievements
}

const achievementsList: Achievement[] = [
  {
    id: 'first_report',
    title: 'Primer Reporte',
    description: '¡Bienvenido! Has dado el primer paso para un Uruapan más seguro.',
    icon: <FilePlus className="h-8 w-8 text-primary" />,
    criteria: 'Envía tu primer reporte',
    progress: 100, // Example: assume unlocked
    unlocked: true,
  },
  {
    id: 'active_voter',
    title: 'Votante Activo',
    description: 'Tu opinión cuenta. Has ayudado a validar la información de la comunidad.',
    icon: <CheckSquare className="h-8 w-8 text-green-500" />,
    criteria: 'Vota en 10 reportes',
    progress: 70,
    unlocked: false,
  },
  {
    id: 'detailed_reporter',
    title: 'Observador Detallista',
    description: 'Tus reportes son de calidad. ¡La evidencia ayuda mucho!',
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    criteria: 'Añade evidencia a 5 reportes',
    progress: 40,
    unlocked: false,
  },
  {
    id: 'community_guardian',
    title: 'Guardián Comunitario',
    description: 'Has ayudado a verificar información crucial para la seguridad.',
    icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
    criteria: 'Recibe 10 votos positivos en tus reportes',
    progress: 80,
    unlocked: false,
  },
  {
    id: 'pioneer',
    title: 'Pionero +Seguro',
    description: 'Uno de los primeros en unirse y fortalecer nuestra comunidad.',
    icon: <Award className="h-8 w-8 text-purple-500" />,
    criteria: 'Regístrate en los primeros 7 días',
    progress: 100,
    unlocked: true, // Example
  },
  {
    id: 'consistent_contributor',
    title: 'Colaborador Constante',
    description: 'Tu perseverancia hace la diferencia. ¡Sigue así!',
    icon: <TrendingUp className="h-8 w-8 text-indigo-500" />,
    criteria: 'Envía 25 reportes en total',
    progress: 15,
    unlocked: false,
  },
  {
    id: 'public_eye',
    title: 'Ojo Público',
    description: 'Atento a la conducta de los funcionarios. Tu supervisión es importante.',
    icon: <Users className="h-8 w-8 text-teal-500" />,
    criteria: 'Reporta 3 incidentes de funcionarios',
    progress: 66,
    unlocked: false,
  },
  {
    id: 'incident_alert',
    title: 'Alerta de Incidentes',
    description: 'Informando sobre delitos, ayudas a prevenir y proteger.',
    icon: <Target className="h-8 w-8 text-red-500" />,
    criteria: 'Reporta 5 delitos/incidentes',
    progress: 90,
    unlocked: false,
  },
  {
    id: 'trust_builder',
    title: 'Constructor de Confianza',
    description: 'Tus reportes son valorados positivamente por la comunidad.',
    icon: <ThumbsUp className="h-8 w-8 text-pink-500" />,
    criteria: 'Alcanza 50 votos positivos netos',
    progress: 30,
    unlocked: false,
  },
  {
    id: 'timely_reporter',
    title: 'Informador Oportuno',
    description: 'Reportando con frecuencia, mantienes a la comunidad actualizada.',
    icon: <CalendarClock className="h-8 w-8 text-cyan-500" />,
    criteria: 'Reporta durante 7 días distintos en un mes',
    progress: 50,
    unlocked: false,
  },
  {
    id: 'future_innovator',
    title: 'Innovador Futuro',
    description: 'Este logro está en desarrollo. ¡Prepárate para nuevas formas de contribuir!',
    icon: <Sparkles className="h-8 w-8 text-gray-400" />,
    criteria: 'Disponible próximamente',
    progress: 0,
    unlocked: false,
    comingSoon: true,
  },
  {
    id: 'community_expert',
    title: 'Experto de la Comunidad',
    description: 'Un nuevo desafío te espera. Conviértete en una referencia en +Seguro.',
    icon: <HelpCircle className="h-8 w-8 text-gray-400" />,
    criteria: 'Disponible próximamente',
    progress: 0,
    unlocked: false,
    comingSoon: true,
  },
];

const AchievementsPage: FC = () => {
  return (
    <main className="flex flex-col p-4 sm:p-6 md:p-8 bg-secondary min-h-screen">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
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

        {/* Achievements Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievementsList.map((achievement) => (
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
        
        {/* Call to action / Motivation */}
        <div className="mt-12 text-center p-6 bg-card rounded-lg shadow-md border border-border">
            <h3 className="text-xl font-semibold text-primary mb-2">¡Sigue Participando!</h3>
            <p className="text-muted-foreground">
                Cada reporte y cada voto cuenta. Juntos podemos hacer de Uruapan un lugar más seguro para todos.
                ¡Explora la comunidad, reporta incidentes y desbloquea más logros!
            </p>
        </div>

      </div>
       {/* Footer */}
      <footer className="mt-16 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} +SEGURO - Plataforma de reportes ciudadanos para la seguridad pública
      </footer>
    </main>
  );
};

export default AchievementsPage;
