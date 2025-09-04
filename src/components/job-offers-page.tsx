
'use client';

import { findJobOffers, type JobOffer } from '@/ai/flows/find-job-offers';
import { Building, Code, ExternalLink, Loader2, MapPin, Sparkles } from 'lucide-react';
import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type JobOffersListProps = {
    jobs: JobOffer[];
    isLoading: boolean;
    error: string | null;
}

export function JobOffersList({ jobs, isLoading, error }: JobOffersListProps) {
  
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Buscando ofertas...</p>
        </div>
    );
  }

  if (error) {
    return (
        <Card className="glassmorphism-card w-full mt-6">
            <CardHeader>
                <CardTitle>Error al buscar empleos</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <Card className="glassmorphism-card text-center w-full mt-6">
            <CardHeader>
                <CardTitle>No se encontraron ofertas</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Prueba con otros criterios de búsqueda.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="glassmorphism-card w-full mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/>
            <span>Resultados de la Búsqueda</span>
        </CardTitle>
        <CardDescription>
          Hemos encontrado estas oportunidades según tus criterios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    <h3 className="font-semibold text-lg text-primary-foreground flex items-center gap-2">{job.title} <ExternalLink size={14}/></h3>
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
                        {job.technologies.length > 5 && <span className="text-xs text-muted-foreground">+{job.technologies.length - 5} más</span>}
                    </div>
                )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
