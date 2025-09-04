
'use client';

import { testTheirStackApi, type ApiResponse } from '@/ai/flows/test-theirstack-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Play, XCircle } from 'lucide-react';
import React, { useState } from 'react';

export function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const response = await testTheirStackApi();
      setApiResponse(response);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      setApiResponse(null); // Clear previous successful responses
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusVariant = (available: boolean) => (available ? 'default' : 'destructive');
  const getSearchTestVariant = (success: boolean) => (success ? 'default' : 'destructive');

  return (
    <Card className="glassmorphism-card w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Diagnóstico de la API</CardTitle>
        <CardDescription>
          Haz clic en el botón para ejecutar una prueba de conexión y una búsqueda de ejemplo contra la API de TheirStack.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleRunTest} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Ejecutando...' : 'Ejecutar Prueba'}
        </Button>

        {apiResponse && (
            <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Resultado General (Salud)</h3>
                    <Badge variant={getStatusVariant(apiResponse.available)}>
                        {apiResponse.available ? <CheckCircle2 className="mr-2"/> : <XCircle className="mr-2"/>}
                        {apiResponse.available ? 'API Disponible' : 'API no Disponible'}
                    </Badge>
                </div>
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Prueba de Búsqueda</h3>
                    <Badge variant={getSearchTestVariant(apiResponse.searchTest.success)}>
                         {apiResponse.searchTest.success ? <CheckCircle2 className="mr-2"/> : <XCircle className="mr-2"/>}
                        {apiResponse.searchTest.success ? 'Éxito' : 'Fallo'}
                    </Badge>
                </div>

                <div className="space-y-2 pt-4">
                     <h4 className="font-semibold text-muted-foreground">Detalles de la búsqueda:</h4>
                     <p className="text-sm bg-muted/50 p-2 rounded-md">{apiResponse.searchTest.message}</p>
                </div>
                
                {apiResponse.error && (
                    <div className="space-y-2 pt-4">
                        <h4 className="font-semibold text-destructive">Error:</h4>
                        <p className="text-sm text-destructive-foreground bg-destructive/20 p-2 rounded-md">{apiResponse.error}</p>
                    </div>
                )}
                
                {apiResponse.data && (
                    <div className="space-y-2 pt-4">
                        <h4 className="font-semibold text-muted-foreground">Respuesta Completa (datos de ejemplo):</h4>
                        <pre className="bg-muted/50 p-4 rounded-md text-xs overflow-auto max-h-80">
                            {JSON.stringify(apiResponse.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        )}
        
        {error && (
             <div className="mt-6 space-y-4 rounded-lg border border-destructive bg-destructive/10 p-4">
                 <h3 className="font-semibold text-destructive">Error al ejecutar el flujo</h3>
                 <p className="text-sm">{error}</p>
             </div>
        )}

      </CardContent>
    </Card>
  );
}
