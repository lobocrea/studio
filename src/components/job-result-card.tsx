'use client';

import { Briefcase, MapPin, Euro, Globe, Building } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

type JobOffer = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  modality: string;
  url: string;
};

type JobResultCardProps = {
  job: JobOffer;
};

export function JobResultCard({ job }: JobResultCardProps) {
  return (
    <Card className="glassmorphism-card w-full transition-transform hover:scale-[1.02] hover:shadow-primary/20">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{job.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1 text-muted-foreground">
          <Building size={14} /> {job.company}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary/80" />
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2">
              <Euro size={14} className="text-primary/80" />
              <span>{job.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-primary/80" />
            <span>{job.modality}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm pt-2">{job.description}</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
          disabled={!job.url || job.url === '#'}
        >
          <Globe size={14} className="mr-2" />
          Ver Oferta
        </Button>
      </CardFooter>
    </Card>
  );
}
