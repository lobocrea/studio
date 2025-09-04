
'use client';

import { saveCvData } from '@/ai/flows/save-cv-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';

type ProfileFormProps = {
    initialCvData: Tables<'cvs'>;
    initialWorkerData: Tables<'workers'>;
}

const formSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido.'),
  profilePicUrl: z.string().url().optional().or(z.literal('')),
  email: z.string().email('Introduce un email válido.').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  ubicacion: z.string().optional().or(z.literal('')),
  linkedin: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
  sitio_web: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
  title: z.string().min(1, 'El título profesional es requerido.'),
  resumen_profesional: z.string(),
  experiencia_laboral: z.string(),
  formacion_academica: z.string(),
  habilidades_tecnicas: z.string(),
  habilidades_blandas: z.string(),
  idiomas: z.string(),
  certificaciones: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm({ initialCvData, initialWorkerData }: ProfileFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Helper to safely parse JSONB arrays from Supabase
    const parseJsonArray = (json: any, fallback: string[] = []): string[] => {
        if (Array.isArray(json)) return json;
        return fallback;
    }

    const getInitialFormValues = (): FormValues => ({
        fullName: initialWorkerData.full_name || '',
        profilePicUrl: initialWorkerData.profile_pic_url || '',
        email: initialWorkerData.email || '',
        telefono: initialWorkerData.phone || '',
        ubicacion: initialWorkerData.location || '',
        linkedin: initialWorkerData.linkedin_url || '',
        sitio_web: initialWorkerData.website_url || '',
        title: initialCvData.title || '',
        resumen_profesional: initialCvData.professional_summary || '',
        // Convert array of objects to string for textarea
        experiencia_laboral: ((initialCvData.work_experience as any[]) || []).map(e => `${e.puesto || ''} en ${e.empresa || ''} (${e.fecha || ''})\n${e.descripcion || ''}`).join('\n\n'),
        formacion_academica: ((initialCvData.academic_background as any[]) || []).map(e => `${e.titulo || ''} en ${e.institucion || ''} (${e.fecha || ''})`).join('\n'),
        // Join arrays into comma-separated strings for inputs
        habilidades_tecnicas: parseJsonArray((initialCvData.skills as any)?.tecnicas).join(', '),
        habilidades_blandas: parseJsonArray((initialCvData.skills as any)?.blandas).join(', '),
        idiomas: parseJsonArray(initialCvData.languages).join(', '),
        certificaciones: parseJsonArray(initialCvData.certifications).join(', '),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getInitialFormValues(),
    });
    
    // This function attempts to parse the unstructured text from the textarea
    // back into a structured format. This is a simplification and might not
    // perfectly handle all user input variations.
    const parseWorkExperience = (text: string) => {
        return text.split('\n\n').map(entry => {
            const lines = entry.split('\n');
            const titleLine = lines[0] || '';
            const description = lines.slice(1).join('\n');
            
            const titleMatch = titleLine.match(/(.+) en (.+) \((.+)\)/);
            
            return {
                puesto: titleMatch ? titleMatch[1].trim() : titleLine,
                empresa: titleMatch ? titleMatch[2].trim() : '',
                fecha: titleMatch ? titleMatch[3].trim() : '',
                descripcion: description,
            };
        }).filter(e => e.puesto);
    };

    const parseAcademicBackground = (text: string) => {
         return text.split('\n').map(entry => {
            const titleMatch = entry.match(/(.+) en (.+) \((.+)\)/);
            return {
                titulo: titleMatch ? titleMatch[1].trim() : entry,
                institucion: titleMatch ? titleMatch[2].trim() : '',
                fecha: titleMatch ? titleMatch[3].trim() : '',
            };
        }).filter(e => e.titulo);
    };

    const handleSaveChanges = async (values: FormValues) => {
        setIsSaving(true);

        try {
            const workerData = {
                full_name: values.fullName,
                email: values.email,
                phone: values.telefono,
                location: values.ubicacion,
                linkedin_url: values.linkedin,
                website_url: values.sitio_web,
                profile_pic_url: values.profilePicUrl,
            };
            
            const cvDataToSave = {
                id: initialCvData.id, // Important to pass the ID for updating
                title: values.title,
                professional_summary: values.resumen_profesional,
                work_experience: parseWorkExperience(values.experiencia_laboral),
                academic_background: parseAcademicBackground(values.formacion_academica),
                skills: {
                    tecnicas: values.habilidades_tecnicas.split(',').map(s => s.trim()).filter(Boolean),
                    blandas: values.habilidades_blandas.split(',').map(s => s.trim()).filter(Boolean),
                },
                languages: values.idiomas.split(',').map(s => s.trim()).filter(Boolean),
                certifications: values.certificaciones.split(',').map(s => s.trim()).filter(Boolean),
                contact_info: {
                    email: values.email || '',
                    telefono: values.telefono || '',
                    ubicacion: values.ubicacion || '',
                    linkedin: values.linkedin,
                    sitio_web: values.sitio_web,
                },
                style: initialCvData.style || 'Modern'
            };

            await saveCvData({ workerData, cvData: cvDataToSave });

            toast({
                title: '¡Perfil Actualizado!',
                description: 'Tus datos han sido guardados correctamente.',
            });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: `No se pudo actualizar tu perfil: ${errorMessage}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="glassmorphism-card w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-8">
                    <CardContent className="pt-6">
                        <Card className="bg-white/5 border-white/10 mb-8"><CardHeader><CardTitle>Información Personal</CardTitle></CardHeader><CardContent className="pt-6">
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="telefono" render={({ field }) => (
                                    <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="ubicacion" render={({ field }) => (
                                    <FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="linkedin" render={({ field }) => (
                                    <FormItem><FormLabel>Perfil de LinkedIn</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="sitio_web" render={({ field }) => (
                                    <FormItem><FormLabel>Sitio Web / Portfolio (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent></Card>

                        <Card className="bg-white/5 border-white/10"><CardHeader><CardTitle>Contenido del CV</CardTitle></CardHeader><CardContent className="pt-6 space-y-8">
                             <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Título Profesional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="resumen_profesional" render={({ field }) => (
                                <FormItem><FormLabel>Resumen Profesional</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="experiencia_laboral" render={({ field }) => (
                                <FormItem><FormLabel>Experiencia Laboral</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormDescription>Separa cada puesto con una línea en blanco. Usa el formato "Puesto en Empresa (Fecha)".</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="formacion_academica" render={({ field }) => (
                                <FormItem><FormLabel>Formación Académica</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormDescription>Cada título en una línea nueva. Usa el formato "Título en Institución (Fecha)".</FormDescription><FormMessage /></FormItem>
                            )} />
                            <div className="grid md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="habilidades_tecnicas" render={({ field }) => (
                                    <FormItem><FormLabel>Habilidades Técnicas</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormDescription>Separa cada habilidad con una coma.</FormDescription><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="habilidades_blandas" render={({ field }) => (
                                    <FormItem><FormLabel>Habilidades Blandas</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormDescription>Separa cada habilidad con una coma.</FormDescription><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="idiomas" render={({ field }) => (
                                <FormItem><FormLabel>Idiomas</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Separa cada idioma con una coma.</FormDescription><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="certificaciones" render={({ field }) => (
                                <FormItem><FormLabel>Certificaciones</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Separa cada certificación con una coma.</FormDescription><FormMessage /></FormItem>
                            )} />
                        </CardContent></Card>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
