
'use client';

import { findJobOffers, type JobOffer } from '@/ai/flows/find-job-offers';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { JobOffersList } from './job-offers-page';

type JobSearchPageProps = {
    userSkills: string[];
}

const searchFormSchema = z.object({
    skill: z.string().min(1, { message: 'Por favor, selecciona una habilidad.' }),
    location: z.string().optional(),
    contractType: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export function JobSearchPage({ userSkills }: JobSearchPageProps) {
    const [jobs, setJobs] = useState<JobOffer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const form = useForm<SearchFormValues>({
        resolver: zodResolver(searchFormSchema),
        defaultValues: {
            skill: '',
            location: 'España',
            contractType: '',
        },
    });

    const handleSearchSubmit = async (values: SearchFormValues) => {
        setIsSearching(true);
        setSearchError(null);
        setHasSearched(true);
        try {
            const results = await findJobOffers({
                skill: values.skill,
                location: values.location,
                contractType: values.contractType,
                limit: 20, // Fetch up to 20 results for a manual search
            });
            setJobs(results);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
            setSearchError(`No se pudieron cargar las ofertas de empleo: ${errorMessage}`);
            setJobs([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <>
            <Card className="glassmorphism-card w-full">
                <CardHeader>
                    <CardTitle>Búsqueda de Empleo Manual</CardTitle>
                    <CardDescription>
                        Filtra las ofertas de empleo según tus habilidades, la ubicación y el tipo de contrato que te interese.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSearchSubmit)} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                             <FormField
                                control={form.control}
                                name="skill"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Habilidad Clave</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una habilidad..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {userSkills.length > 0 ? (
                                                    userSkills.map(skill => (
                                                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="" disabled>No tienes habilidades guardadas</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provincia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Madrid" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Contrato</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Cualquiera" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="">Cualquiera</SelectItem>
                                                <SelectItem value="Jornada completa">Jornada completa</SelectItem>
                                                <SelectItem value="Media jornada">Media jornada</SelectItem>
                                                <SelectItem value="Autónomo">Autónomo</SelectItem>
                                                <SelectItem value="Temporal">Temporal</SelectItem>
                                                <SelectItem value="Prácticas">Prácticas</ctypes>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isSearching} className="w-full">
                                {isSearching ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {hasSearched && (
                <JobOffersList jobs={jobs} isLoading={isSearching} error={searchError} />
            )}
        </>
    );
}
