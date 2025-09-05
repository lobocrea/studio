
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Loader2, MapPin, Search, Star } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { allProvinces } from '@/lib/provinces';
import { contractTypes, experienceLevels } from '@/lib/job-options';
import { useToast } from '@/hooks/use-toast';
import { findJobs } from '@/ai/flows/find-jobs';
import type { FindJobsOutput } from '@/ai/flows/find-jobs';
import { JobResultCard } from './job-result-card';


type JobSearchPageProps = {
    initialSkills: string[];
    initialLocation: string;
};

const searchFormSchema = z.object({
  keyword: z.string().optional(),
  province: z.string().optional(),
  contractType: z.string().optional(),
  experienceLevel: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

type JobOffer = FindJobsOutput['jobs'][0];

export function JobSearchPage({ initialSkills, initialLocation }: JobSearchPageProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JobOffer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      keyword: initialSkills.length > 0 ? initialSkills[0] : 'all',
      province: allProvinces.find(p => initialLocation?.includes(p)) || 'all',
      contractType: 'all',
      experienceLevel: 'all',
    },
  });

  const handleSearch = async (values: SearchFormValues) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
        // We only pass the simplified parameters to the findJobs function
        const searchParams = {
            keyword: values.keyword || 'all',
            province: values.province || 'all',
        };
        const result = await findJobs(searchParams);
        setSearchResults(result.jobs);
    } catch (error) {
        console.error("Error searching for jobs:", error);
        toast({
            variant: "destructive",
            title: "Error en la búsqueda",
            description: "No se pudieron obtener las ofertas de trabajo. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsSearching(false);
    }
  };
  
  return (
    <div className="w-full max-w-7xl flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/3 lg:w-1/4">
            <Card className="glassmorphism-card sticky top-24">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="keyword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Search size={14} /> Palabras clave</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una habilidad" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Cualquier habilidad</SelectItem>
                                                {initialSkills.map(skill => (
                                                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="province"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MapPin size={14} /> Provincia</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una provincia" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Todas las provincias</SelectItem>
                                                {allProvinces.map(province => (
                                                    <SelectItem key={province} value={province}>{province}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Briefcase size={14} /> Tipo de contrato</FormLabel>

                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Cualquier contrato" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Cualquier contrato</SelectItem>
                                                {contractTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.label}>{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="experienceLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Star size={14} /> Nivel de experiencia</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Cualquier experiencia" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Cualquier experiencia</SelectItem>
                                                 {experienceLevels.map(level => (
                                                    <SelectItem key={level.value} value={level.label}>{level.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSearching}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </aside>
        <main className="flex-1">
            <div className="space-y-4">
                {isSearching && (
                    <div className="flex flex-col items-center justify-center p-12 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Buscando las mejores ofertas para ti...</p>
                    </div>
                )}

                {!isSearching && hasSearched && searchResults.length > 0 && (
                    searchResults.map(job => <JobResultCard key={job.id} job={job} />)
                )}

                {!isSearching && hasSearched && searchResults.length === 0 && (
                     <Card className="glassmorphism-card text-center py-24 px-6">
                        <CardContent>
                            <h3 className="text-xl font-semibold">No se encontraron resultados</h3>
                            <p className="text-muted-foreground mt-2">Prueba a cambiar los filtros para ampliar tu búsqueda.</p>
                        </CardContent>
                    </Card>
                )}

                {!hasSearched && (
                     <Card className="glassmorphism-card text-center py-24 px-6">
                        <CardContent>
                            <h3 className="text-xl font-semibold">Comienza tu búsqueda</h3>
                            <p className="text-muted-foreground mt-2">Usa los filtros para encontrar las ofertas de trabajo que se ajusten a tu perfil.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    </div>
  );
}
