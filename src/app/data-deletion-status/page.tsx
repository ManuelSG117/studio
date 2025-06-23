"use client";
import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataDeletionStatusPage: FC = () => (
  <main className="flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-secondary min-h-screen">
    <div className="w-full max-w-xl">
      <Card className="w-full shadow-xl border-none rounded-2xl bg-card">
        <CardHeader className="text-center items-center pt-8 pb-6">
          <CardTitle className="text-2xl font-bold text-primary">
            Eliminación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-4 text-center">
          <p className="text-muted-foreground text-base">
            Si deseas que eliminemos todos tus datos personales asociados a tu cuenta, puedes solicitarlo de dos maneras:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground text-left mx-auto max-w-md">
            <li>
              Enviando un correo electrónico a{' '}
              <a href="mailto:masseguro117@gmail.com" className="text-primary hover:underline">
                masseguro117@gmail.com
              </a> con el asunto "Eliminación de datos".
            </li>
            <li>
              A través de nuestro formulario automatizado en la siguiente URL:{' '}
              <a href="/api/facebook-data-deletion" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                /api/facebook-data-deletion
              </a>
              .
            </li>
          </ul>
          <p className="text-muted-foreground text-base mt-4">
            Una vez recibida tu solicitud, procesaremos la eliminación de tu información personal de nuestros sistemas en un plazo razonable, salvo que la retención sea requerida por motivos legales.
          </p>
        </CardContent>
      </Card>
    </div>
  </main>
);

export default DataDeletionStatusPage; 