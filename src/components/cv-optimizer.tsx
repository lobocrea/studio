
'use client';

import { extractCvData, type ExtractCvDataOutput } from '@/ai/flows/extract-cv-data';
import { generateOptimizedCv, type GenerateOptimizedCvOutput } from '@/ai/flows/generate-optimized-cv';
import { saveCvData } from '@/ai/flows/save-cv-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UploadCloud, Wand2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from './loading-state';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

type Step = 'upload' | 'extracting' | 'preview' | 'generating';
type CVStyle = 'Minimalist' | 'Modern' | 'Classic';

const formSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido.'),
  profilePic: z.any().optional(),
  style: z.enum(['Minimalist', 'Modern', 'Classic']),
  resumen_profesional: z.string(),
  experiencia_laboral: z.string(),
  formacion_academica: z.string(),
  habilidades_tecnicas: z.string(),
  habilidades_blandas: z.string(),
  idiomas: z.string(),
  certificaciones: z.string(),
  email: z.string().email('Introduce un email válido.').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  ubicacion: z.string().optional().or(z.literal('')),
  linkedin: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
  sitio_web: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const getInitialFormValues = (cvData?: Partial<ExtractCvDataOutput & { email?: string; linkedin?: string; sitio_web?: string }>): FormValues => ({
  fullName: cvData?.fullName || '',
  style: 'Modern',
  resumen_profesional: cvData?.resumen_profesional || '',
  experiencia_laboral: cvData?.experiencia_laboral?.join('\n\n') || '',
  formacion_academica: cvData?.formacion_academica?.join('\n') || '',
  habilidades_tecnicas: cvData?.habilidades?.tecnicas?.join(', ') || '',
  habilidades_blandas: cvData?.habilidades?.blandas?.join(', ') || '',
  idiomas: cvData?.idiomas?.join(', ') || '',
  certificaciones: cvData?.certificaciones?.join(', ') || '',
  email: cvData?.email || '',
  telefono: cvData?.telefono || '',
  ubicacion: cvData?.ubicacion || '',
  linkedin: cvData?.linkedin || '',
  sitio_web: cvData?.sitio_web || '',
  profilePic: undefined,
});


export function CvOptimizer() {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profilePicInputRef = React.useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(),
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStep('extracting');
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const pdfDataUri = reader.result as string;
        const result = await extractCvData({ pdfDataUri });
        form.reset(getInitialFormValues(result));
        setStep('preview');
      } catch (e) {
        console.error(e);
        setError('No se pudo extraer la información del CV. Por favor, intente con otro archivo.');
        setStep('upload');
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setStep('upload');
    };
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerateSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    setStep('generating');
    setError(null);
    
    const extractedData = {
        resumen_profesional: values.resumen_profesional,
        experiencia_laboral: values.experiencia_laboral.split('\n\n').filter(Boolean),
        formacion_academica: values.formacion_academica.split('\n').filter(Boolean),
        habilidades: {
            tecnicas: values.habilidades_tecnicas.split(',').map(s => s.trim()).filter(Boolean),
            blandas: values.habilidades_blandas.split(',').map(s => s.trim()).filter(Boolean),
        },
        idiomas: values.idiomas.split(',').map(s => s.trim()).filter(Boolean),
        certificaciones: values.certificaciones.split(',').map(s => s.trim()).filter(Boolean),
    };

    const contactData = {
      email: values.email,
      telefono: values.telefono,
      ubicacion: values.ubicacion,
      linkedin: values.linkedin,
      sitio_web: values.sitio_web,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const result = await generateOptimizedCv({ 
        extractedData: JSON.stringify(extractedData),
        contactData: contactData,
        style: values.style 
      });
      
      const workerDataToSave = {
        full_name: values.fullName,
        email: values.email,
        phone: values.telefono,
        location: values.ubicacion,
        linkedin_url: values.linkedin,
        website_url: values.sitio_web,
        profile_pic_url: profilePicUrl,
      };
      
      // We now save the structured, AI-generated data
      const cvDataToSave = {
        title: result.title,
        professional_summary: result.resumen_profesional,
        work_experience: result.experiencia_laboral,
        academic_background: result.formacion_academica,
        skills: result.habilidades,
        languages: result.idiomas,
        certifications: result.certificaciones,
        contact_info: result.contacto,
        style: values.style,
      };
      
      await saveCvData({ workerData: workerDataToSave, cvData: cvDataToSave });

      toast({
        title: '¡CV Guardado y Optimizado!',
        description: 'Hemos guardado y generado tu nuevo CV con éxito.',
      });

      // Redirect to the jobs page after successful generation
      router.push('/dashboard/jobs');

    } catch(e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(`No se pudo generar o guardar el CV: ${errorMessage}`);
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const startOver = () => {
    setStep('upload');
    setError(null);
    setProfilePicUrl(null);
    form.reset(getInitialFormValues());
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (error) {
    return (
        <div className="glassmorphism-card p-6">
            <Alert variant="destructive" className="bg-transparent border-0">
                <X className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={startOver} variant="outline" className="mt-4">Empezar de nuevo</Button>
            </Alert>
        </div>
    );
  }

  if (step === 'extracting') return <LoadingState text="Extrayendo datos de tu CV..." />;
  if (step === 'generating') return <LoadingState text="Guardando y generando tu nuevo CV..." />;

  return (
    <div className="w-full">
      {step === 'upload' && (
        <Card className="text-center glassmorphism-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Sube tu CV en PDF</CardTitle>
                <CardDescription>Empecemos por subir tu CV actual. La IA extraerá la información clave.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center">
                    <Button type="button" size="lg" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Seleccionar archivo
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                </div>
            </CardContent>
             <CardFooter className="justify-center">
                <Button variant="link" onClick={handleLogout}>Cerrar Sesión</Button>
            </CardFooter>
        </Card>
      )}

      {step === 'preview' && (
        <Card className="glassmorphism-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Revisa y Edita tu Información</CardTitle>
            <CardDescription>Ajusta los datos extraídos, completa tu contacto, sube una foto y elige un estilo para tu nuevo CV.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateSubmit)} className="space-y-8">
                
                <Card className="bg-white/5 border-white/10"><CardHeader><CardTitle>Información Personal</CardTitle></CardHeader><CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl><Input placeholder="Ej: Ana García" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="profilePic" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Foto de Perfil (Opcional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Button type="button" variant="outline" onClick={() => profilePicInputRef.current?.click()}>
                                {profilePicUrl ? 'Cambiar foto' : 'Subir foto'}
                              </Button>
                              {profilePicUrl && <img src={profilePicUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover" />}
                              <input type="file" ref={profilePicInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
                            </div>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="ejemplo@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="telefono" render={({ field }) => (
                      <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="ubicacion" render={({ field }) => (
                      <FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Madrid, España" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin" render={({ field }) => (
                      <FormItem><FormLabel>Perfil de LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="sitio_web" render={({ field }) => (
                      <FormItem><FormLabel>Sitio Web / Portfolio (Opcional)</FormLabel><FormControl><Input placeholder="https://ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                </CardContent></Card>

                <Card className="bg-white/5 border-white/10"><CardHeader><CardTitle>Contenido del CV</CardTitle></CardHeader><CardContent className="pt-6 space-y-8">
                <FormField control={form.control} name="style" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estilo del CV</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estilo" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Modern">Moderno</SelectItem>
                                <SelectItem value="Minimalist">Minimalista</SelectItem>
                                <SelectItem value="Classic">Clásico</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="resumen_profesional" render={({ field }) => (
                    <FormItem><FormLabel>Resumen Profesional</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="experiencia_laboral" render={({ field }) => (
                    <FormItem><FormLabel>Experiencia Laboral</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormDescription>Separa cada puesto con una línea en blanco.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="formacion_academica" render={({ field }) => (
                    <FormItem><FormLabel>Formación Académica</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormDescription>Cada título en una línea nueva.</FormDescription><FormMessage /></FormItem>
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

                <CardFooter className="flex justify-end gap-4 p-0 pt-6">
                    <Button type="button" variant="outline" onClick={startOver}>Cancelar</Button>
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Guardando y Generando...' : 'Generar CV y Buscar Empleos'}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
