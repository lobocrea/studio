
'use client';

import { testTheirStackApi, type ApiResponse } from '@/ai/flows/test-theirstack-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, CheckCircle2, Code, ExternalLink, Loader2, MapPin, Play, Sparkles, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import type { JobOffer } from '@/ai/flows/find-job-offers';

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

  const jobs = (apiResponse?.searchTest?.jobs || []) as JobOffer[];

  return (
    <Card className="glassmorphism-card w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Diagnóstico de la API</CardTitle>
        <CardDescription>
          Haz clic en el botón para ejecutar una prueba de conexión y una búsqueda de 3 trabajos "fullstack" de ejemplo.
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
            </div>
        )}
        
        {jobs.length > 0 && (
            <div className="mt-6">
                 <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Sparkles className="text-primary"/> Resultados de la Prueba</h3>
                 <div className="space-y-4">
                    {jobs.map((job) => (
                        <div key={job.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-4">
                            <div className="flex-shrink-0">
                                {job.companyLogo ? (
                                    <img src={job.companyLogo} alt={`${job.companyName} logo`} className="w-16 h-16 rounded-md object-contain bg-white p-1" />
                                ) : (
                                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                        <Building className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <h4 className="font-semibold text-lg text-primary-foreground flex items-center gap-2">{job.title} <ExternalLink size={14}/></h4>
                                </a>
                                <p className="text-sm text-muted-foreground">{job.companyName}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin size={14} />
                                    <span>{job.location}</span>
                                </div>
                                {job.salary && (
                                    <p className="text-sm font-semibold text-accent mt-1">{job.salary}</p>
                                )}
                                {job.technologies && job.technologies.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                                        <Code size={14} className="flex-shrink-0"/>
                                        {job.technologies.slice(0, 5).map(tech => <Badge variant="secondary" key={tech}>{tech}</Badge>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                 </div>
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
