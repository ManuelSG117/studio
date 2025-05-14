
"use client";

import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Cake, User, CalendarDays, Award } from 'lucide-react'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Match the ReporterProfile interface from the report detail page
interface ReporterProfile {
  displayName?: string;
  photoURL?: string | null;
  memberSince?: Date; 
  reportCount?: number; 
  credibility?: number;
  dob?: Date;
  // userLevel?: number; // Placeholder for future user level display
}

interface ReporterQuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporter: ReporterProfile | null;
}

const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
  return (names[0][0]?.toUpperCase() || "") + (names[names.length - 1][0]?.toUpperCase() || "");
};

export const ReporterQuickViewDialog: FC<ReporterQuickViewDialogProps> = ({ open, onOpenChange, reporter }) => {
  if (!reporter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs bg-card rounded-xl shadow-2xl border-none p-0">
        <DialogHeader className="pt-6 pb-3 text-center items-center border-b border-border">
          <Avatar className="w-24 h-24 border-4 border-primary mb-3 shadow-md">
            <AvatarImage src={reporter.photoURL || undefined} alt={reporter.displayName || "Avatar"} data-ai-hint="reporter avatar large"/>
            <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
              {getInitials(reporter.displayName)}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-xl font-semibold text-primary">{reporter.displayName || "Usuario +Seguro"}</DialogTitle>
          {/* Removed DialogDescription as it's not very informative here */}
        </DialogHeader>
        <div className="py-4 px-5 space-y-3">
          {reporter.dob && (
            <div className="flex items-center text-sm">
              <Cake className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Nacimiento:</span>
              <span className="ml-auto font-medium text-foreground">
                {format(reporter.dob, "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
           {reporter.memberSince && (
            <div className="flex items-center text-sm">
              <CalendarDays className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Miembro desde:</span>
              <span className="ml-auto font-medium text-foreground">
                {format(reporter.memberSince, "MMMM yyyy", { locale: es })}
              </span>
            </div>
          )}
          {/* Placeholder for User Level - A real implementation would fetch/calculate this */}
          <div className="flex items-center text-sm">
            <Award className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Nivel:</span>
            <span className="ml-auto font-medium text-foreground">
              Por determinar {/* Or fetch actual level if available */}
            </span>
          </div>
        </div>
        <div className="px-5 pb-5 pt-2">
            <Button onClick={() => onOpenChange(false)} className="w-full rounded-full" variant="outline">
                Cerrar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
