
'use client';

import { findJobOffers, type JobOffer } from '@/ai/flows/find-job-offers';
import type { Tables } from '@/types/supabase';
import { Building, Code, ExternalLink, Loader2, MapPin, PlusCircle, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LoadingState } from './loading-state';

interface JobOffersProps {
  // We pass the full CV row from Supabase
  cvData: Tables<'cvs'>;
}

export function JobOffersPage({ cvData }: JobOffersProps) {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadJobs = useCallback(async (pageNum: number, limit: number) => {
    if(pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    
    setError(null);

    try {
      // Safely extract and format data from the CV
      const skills = (cvData.skills as any)?.tecnicas || [];
      const experience = ((cvData.work_experience || []) as any[]).map(e => `${e.puesto || ''} ${e.descripcion || ''}`);
      const education = ((cvData.academic_background || []) as any[]).map(e => e.titulo || '');

      const jobInput = {
        skills,
        experience,
        education,
        page: pageNum,
        limit: limit,
      };
      
      const newJobs = await findJobOffers(jobInput);
      
      if (newJobs.length < limit) {
        setHasMore(false);
      }

      if (pageNum === 1) {
        setJobs(newJobs);
      } else {
        // Filter out duplicates that might already be in the list
        const uniqueNewJobs = newJobs.filter(newJob => !jobs.some(existingJob => existingJob.id === newJob.id));
        setJobs(prevJobs => [...prevJobs, ...uniqueNewJobs]);
      }

    } catch (e) {
      console.error('Failed to fetch job offers:', e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(`No se pudieron cargar las ofertas de empleo: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [cvData, jobs]);


  useEffect(() => {
    // Initial load
    if(cvData) {
        loadJobs(1, 3);
    }
  }, [cvData]); // Dependency on cvData ensures we reload if the CV changes

  if (isLoading) {
    return <LoadingState text="Buscando ofertas de empleo para ti..." />;
  }

  if (error) {
    return (
        <Card className="glassmorphism-card w-full">
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
      <Card className="glassmorphism-card text-center w-full">
            <CardHeader>
                <CardTitle>No hemos encontrado ofertas</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No hemos encontrado ofertas que coincidan con tu perfil en este momento. ¡Inténtalo más tarde!</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="glassmorphism-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/>
            <span>Ofertas de Empleo Relevantes</span>
        </CardTitle>
        <CardDescription>
          Hemos encontrado estas oportunidades que podrían interesarte basándonos en tu nuevo CV.
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
      {hasMore && (
         <CardFooter className="flex justify-center">
            <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline">
              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isLoadingMore ? 'Cargando...' : 'Cargar una más'}
            </Button>
         </CardFooter>
      )}
    </Card>
  );
}
