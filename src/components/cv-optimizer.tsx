
'use client';

import { extractCvData, type ExtractCvDataOutput } from '@/ai/flows/extract-cv-data';
import { generateOptimizedCv, type GenerateOptimizedCvOutput } from '@/ai/flows/generate-optimized-cv';
import { saveCvData } from '@/ai/flows/save-cv-data';
import { zodResolver } from '@hookform/resolvers/zod';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, FileText, Globe, Linkedin, Loader2, Mail, MapPin, Phone, UploadCloud, Wand2, X, Briefcase, GraduationCap, Star, Award, Languages, Save } from 'lucide-react';
import React, { useRef, useState } from 'react';
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
import { JobOffers } from './job-offers';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

type Step = 'upload' | 'extracting' | 'preview' | 'generating' | 'result';
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
});


export function CvOptimizer() {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [optimizedCv, setOptimizedCv] = useState<GenerateOptimizedCvOutput | null>(null);
  const [currentStyle, setCurrentStyle] = useState<CVStyle>('Modern');
  const [fullName, setFullName] = useState<string>('');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('cv-optimizado');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
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
    setFullName(values.fullName);
    setCurrentStyle(values.style);
    setFileName(values.fullName.trim().replace(/\s+/g, '-').toLowerCase());
    
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

      const workerData = {
        id: user.id,
        full_name: values.fullName,
        email: values.email,
        phone: values.telefono,
        location: values.ubicacion,
        linkedin_url: values.linkedin,
        website_url: values.sitio_web,
        profile_pic_url: profilePicUrl,
        updated_at: new Date().toISOString(),
      };

      const result = await generateOptimizedCv({ 
        extractedData: JSON.stringify(extractedData),
        contactData: contactData,
        style: values.style 
      });

      const cvDataToSave = {
        worker_id: user.id,
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
      
      await saveCvData({ workerData, cvData: cvDataToSave });

      toast({
        title: '¡CV Guardado y Optimizado!',
        description: 'Hemos guardado y generado tu nuevo CV con éxito.',
      });

      setOptimizedCv(result);
      setStep('result');
    } catch(e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(`No se pudo generar o guardar el CV: ${errorMessage}`);
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownloadPdf = async () => {
      if (!cvPreviewRef.current) return;
      setIsDownloading(true);
      try {
          const canvas = await html2canvas(cvPreviewRef.current, {
              scale: 3,
              useCORS: true,
              backgroundColor: '#ffffff',
              windowWidth: cvPreviewRef.current.scrollWidth,
              windowHeight: cvPreviewRef.current.scrollHeight,
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4', true);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const ratio = canvasWidth / pdfWidth;
          const imgHeight = canvasHeight / ratio;

          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
              heightLeft -= pdfHeight;
          }

          pdf.save(`${fileName || 'cv-optimizado'}.pdf`);
      } catch (e) {
          console.error("Error generating PDF:", e);
          setError("Error al generar el PDF. Por favor, intente de nuevo.");
      } finally {
          setIsDownloading(false);
      }
  };

  const startOver = () => {
    setStep('upload');
    setError(null);
    setOptimizedCv(null);
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
                        {isGenerating ? 'Guardando y Generando...' : 'Generar CV Optimizado'}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'result' && optimizedCv && (
        <div className="space-y-8">
          <Card className="glassmorphism-card">
              <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <CardTitle className="font-headline text-2xl">¡Tu CV está listo!</CardTitle>
                          <CardDescription>Descárgalo en formato PDF. ¡Mucha suerte en tu búsqueda!</CardDescription>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                          <Button onClick={handleDownloadPdf} className="w-full md:w-auto" disabled={isDownloading}>
                              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                              PDF
                          </Button>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-start bg-gray-900/50 p-4 sm:p-8 rounded-lg">
                  <div id="cv-preview" ref={cvPreviewRef} className="cv-preview-container">
                    <div className="cv-grid">
                      <div className="cv-main-col space-y-4">
                        <header className="cv-header text-center">
                          <h1 className="cv-header h1">{fullName}</h1>
                          <h2 className="cv-header h2 mt-1">{optimizedCv.title}</h2>
                        </header>
                        
                        <section>
                          <h3 className="cv-section-title"><FileText size={14}/>Resumen Profesional</h3>
                          <p className="cv-exp-desc">{optimizedCv.resumen_profesional}</p>
                        </section>

                        <section>
                          <h3 className="cv-section-title"><Briefcase size={14}/>Experiencia Laboral</h3>
                          {optimizedCv.experiencia_laboral.map((exp, i) => (
                            <div key={i} className="cv-exp-item">
                              <h4 className="cv-exp-title">{exp.puesto}</h4>
                              <p className="cv-exp-subtitle">{exp.empresa} | {exp.fecha}</p>
                              <p className="cv-exp-desc">{exp.descripcion}</p>
                            </div>
                          ))}
                        </section>
                        <section>
                          <h3 className="cv-section-title"><GraduationCap size={14}/>Formación Académica</h3>
                          {optimizedCv.formacion_academica.map((edu, i) => (
                            <div key={i} className="cv-edu-item">
                              <h4 className="cv-edu-title">{edu.titulo}</h4>
                              <p className="cv-edu-subtitle">{edu.institucion} | {edu.fecha}</p>
                            </div>
                          ))}
                        </section>
                      </div>
                      <div className="cv-sidebar-col space-y-4">
                        {profilePicUrl && <img src={profilePicUrl} alt="Foto de perfil" className="cv-profile-pic" data-ai-hint="profile picture" />}
                        <section>
                          <h3 className="cv-section-title">Contacto</h3>
                          <div className="space-y-1">
                            {optimizedCv.contacto.email && <div className="cv-contact-item"><Mail size={12}/> <span>{optimizedCv.contacto.email}</span></div>}
                            {optimizedCv.contacto.telefono && <div className="cv-contact-item"><Phone size={12}/> <span>{optimizedCv.contacto.telefono}</span></div>}
                            {optimizedCv.contacto.ubicacion && <div className="cv-contact-item"><MapPin size={12}/> <span>{optimizedCv.contacto.ubicacion}</span></div>}
                            {optimizedCv.contacto.linkedin && <div className="cv-contact-item"><Linkedin size={12}/> <span>{optimizedCv.contacto.linkedin.replace('https://', '')}</span></div>}
                            {optimizedCv.contacto.sitio_web && <div className="cv-contact-item"><Globe size={12}/> <span>{optimizedCv.contacto.sitio_web.replace('https://', '')}</span></div>}
                          </div>
                        </section>
                        <section>
                          <h3 className="cv-section-title"><Star size={14}/>Habilidades Técnicas</h3>
                          <div className="cv-skills-list">
                            {optimizedCv.habilidades.tecnicas.map((skill, i) => <span key={i} className="cv-skill-item">{skill}</span>)}
                          </div>
                        </section>
                        <section>
                          <h3 className="cv-section-title"><Star size={14}/>Habilidades Blandas</h3>
                          <div className="cv-skills-list">
                            {optimizedCv.habilidades.blandas.map((skill, i) => <span key={i} className="cv-skill-item">{skill}</span>)}
                          </div>
                        </section>
                        <section>
                          <h3 className="cv-section-title"><Languages size={14}/>Idiomas</h3>
                            {optimizedCv.idiomas.map((lang, i) => <p key={i} className="cv-text-xs">{lang}</p>)}
                        </section>
                        {optimizedCv.certificaciones.length > 0 && (
                          <section>
                            <h3 className="cv-section-title"><Award size={14}/>Certificaciones</h3>
                              {optimizedCv.certificaciones.map((cert, i) => <p key={i} className="cv-text-xs">{cert}</p>)}
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
              </CardContent>
              <CardFooter className="justify-center pt-6">
                  <Button onClick={startOver} variant="outline">Empezar de nuevo</Button>
              </CardFooter>
          </Card>
          
          <JobOffers cvData={optimizedCv} />

        </div>
      )}
    </div>
  );
}
