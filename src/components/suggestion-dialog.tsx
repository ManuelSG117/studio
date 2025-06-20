
"use client";

import { useState, type FC } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare } from 'lucide-react';

interface SuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
}

export const SuggestionDialog: FC<SuggestionDialogProps> = ({
  open,
  onOpenChange,
  recipientEmail,
}) => {
  const [suggestionText, setSuggestionText] = useState('');
  const { toast } = useToast();

  const handleSubmitSuggestion = () => {
    if (!suggestionText.trim()) {
      toast({
        title: "Sugerencia Vacía",
        description: "Por favor, escribe tu sugerencia antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const subject = encodeURIComponent("Sugerencia para +Seguro");
    const body = encodeURIComponent(suggestionText);
    const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

    // Attempt to open mail client
    try {
        window.location.href = mailtoLink;
        toast({
            title: "Abriendo cliente de correo...",
            description: "Prepara tu mensaje para enviarlo.",
        });
        setSuggestionText(''); // Clear textarea
        onOpenChange(false); // Close dialog
    } catch (error) {
      //le.error("Error opening mailto link:", error);
        toast({
            title: "Error",
            description: "No se pudo abrir tu cliente de correo. Por favor, copia la sugerencia y envíala manualmente.",
            variant: "destructive",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-6 w-6 text-primary" />
            Buzón de Sugerencias
          </DialogTitle>
          <DialogDescription className="pt-1">
            Comparte tus ideas, sugerencias o comentarios para mejorar +Seguro.
            Recuerda que esta función está disponible para usuarios de Nivel 3 o superior.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Textarea
            placeholder="Escribe aquí tu sugerencia..."
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            rows={6}
            className="resize-none focus-visible:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            Al hacer clic en "Enviar", se abrirá tu aplicación de correo electrónico predeterminada.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancelar
          </Button>
          <Button onClick={handleSubmitSuggestion} className="bg-primary hover:bg-primary/90 rounded-full">
            <Send className="mr-2 h-4 w-4" />
            Enviar Sugerencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
