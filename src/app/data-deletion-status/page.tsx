import type { FC } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataDeletionStatusPage: FC = () => {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get('id');

  return (
    <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
      <div className="w-full max-w-xl">
        <Card className="w-full shadow-xl border-none rounded-2xl bg-card">
          <CardHeader className="text-center items-center pt-8 pb-6">
            <CardTitle className="text-2xl font-bold text-primary">
              Estado de Solicitud de Eliminación de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4 text-center">
            <p className="text-muted-foreground text-base">
              Tu solicitud de eliminación de datos ha sido recibida y está siendo procesada. Si tienes preguntas, puedes contactarnos en <a href="mailto:masseguro117@gmail.com" className="text-primary hover:underline">masseguro117@gmail.com</a>.
            </p>
            {confirmationCode && (
              <div className="mt-4">
                <span className="font-semibold">Código de confirmación:</span>
                <div className="text-lg text-primary font-mono mt-1">{confirmationCode}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DataDeletionStatusPage; 