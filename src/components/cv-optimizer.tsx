'use client';

import { extractCvData } from '@/ai/flows/extract-cv-data';
import { generateOptimizedCv, type GenerateOptimizedCvOutput } from '@/ai/flows/generate-optimized-cv';
import { zodResolver } from '@hookform/resolvers/zod';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, FileImage, FileText, Globe, Linkedin, Loader2, Mail, MapPin, Phone, UploadCloud, Wand2, X } from 'lucide-react';
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
  email: z.string().email('Introduce un email válido.'),
  telefono: z.string().min(1, 'El teléfono es requerido.'),
  ubicacion: z.string().min(1, 'La ubicación es requerida.'),
  linkedin: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
  sitio_web: z.string().url('Introduce una URL válida.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function CvOptimizer() {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [optimizedCv, setOptimizedCv] = useState<GenerateOptimizedCvOutput | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CVStyle>('Modern');
  const [fullName, setFullName] = useState<string>('');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('cv-optimizado');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      style: 'Modern',
      resumen_profesional: '',
      experiencia_laboral: '',
      formacion_academica: '',
      habilidades_tecnicas: '',
      habilidades_blandas: '',
      idiomas: '',
      certificaciones: '',
      email: '',
      telefono: '',
      ubicacion: '',
      linkedin: '',
      sitio_web: '',
    },
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
        form.reset({
          fullName: '',
          style: 'Modern',
          resumen_profesional: result.resumen_profesional,
          experiencia_laboral: result.experiencia_laboral.join('\n\n'),
          formacion_academica: result.formacion_academica.join('\n'),
          habilidades_tecnicas: result.habilidades.tecnicas.join(', '),
          habilidades_blandas: result.habilidades.blandas.join(', '),
          idiomas: result.idiomas.join(', '),
          certificaciones: result.certificaciones.join(', '),
        });
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
    setStep('generating');
    setError(null);
    setSelectedStyle(values.style);
    setFullName(values.fullName);
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
    }

    try {
        const result = await generateOptimizedCv({ 
          extractedData: JSON.stringify(extractedData),
          contactData: contactData,
          style: values.style 
        });
        setOptimizedCv(result);
        setStep('result');
    } catch(e) {
        console.error(e);
        setError('No se pudo generar el CV optimizado. Por favor, intente nuevamente.');
        setStep('preview');
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!cvPreviewRef.current) return;
    setIsDownloading(true);
    try {
        // Temporarily change background for capture
        cvPreviewRef.current.style.backgroundColor = 'white';

        const canvas = await html2canvas(cvPreviewRef.current, { 
            scale: 3, 
            useCORS: true, 
            backgroundColor: null, // Use transparent background for canvas
            logging: true,
        });

        // Restore original background
        cvPreviewRef.current.style.backgroundColor = '';

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const finalHeight = canvasHeight / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight, undefined, 'FAST');
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
    form.reset();
  };

  if (error) {
    return (
        <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={startOver} variant="outline" className="mt-4">Empezar de nuevo</Button>
        </Alert>
    );
  }

  if (step === 'extracting') return <LoadingState text="Extrayendo datos de tu CV..." />;
  if (step === 'generating') return <LoadingState text="Generando tu nuevo CV optimizado..." />;

  return (
    <div className="w-full">
      {step === 'upload' && (
        <Card className="text-center">
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
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Revisa y Edita tu Información</CardTitle>
            <CardDescription>Ajusta los datos extraídos, completa tu contacto, sube una foto y elige un estilo para tu nuevo CV.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateSubmit)} className="space-y-8">
                
                <Card><CardHeader><CardTitle>Información Personal</CardTitle></CardHeader><CardContent className="pt-6">
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
                                <FileImage className="mr-2 h-4 w-4" />
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
                      <FormItem><FormLabel>Sitio Web / Portfolio</FormLabel><FormControl><Input placeholder="https://ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                </CardContent></Card>

                <Card><CardHeader><CardTitle>Contenido del CV</CardTitle></CardHeader><CardContent className="pt-6 space-y-8">
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
                    <Button type="submit">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generar CV Optimizado
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'result' && optimizedCv && (
        <Card>
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
            <CardContent className="flex flex-col items-center justify-start bg-gray-100 p-4 sm:p-8">
                <div id="cv-preview" ref={cvPreviewRef} className="cv-preview-container">
                  <div className="cv-grid">
                    <div className="cv-main-col">
                      <header className="cv-header mb-8 text-center">
                        <h1 className="text-5xl font-bold text-gray-800">{fullName}</h1>
                        <h2 className="text-2xl font-light text-gray-600 mt-2">{optimizedCv.title}</h2>
                      </header>
                      
                      <section className="mb-6">
                        <h3 className="cv-section-title"><FileText className="inline-block mr-2" />Resumen Profesional</h3>
                        <p className="text-base text-gray-700">{optimizedCv.resumen_profesional}</p>
                      </section>

                      <section>
                        <h3 className="cv-section-title">Experiencia Laboral</h3>
                        {optimizedCv.experiencia_laboral.map((exp, i) => (
                          <div key={i} className="cv-exp-item">
                            <h4 className="cv-exp-title">{exp.puesto}</h4>
                            <p className="cv-exp-subtitle">{exp.empresa} | {exp.fecha}</p>
                            <p className="cv-exp-desc">{exp.descripcion}</p>
                          </div>
                        ))}
                      </section>
                      <section>
                        <h3 className="cv-section-title">Formación Académica</h3>
                        {optimizedCv.formacion_academica.map((edu, i) => (
                          <div key={i} className="cv-edu-item">
                            <h4 className="cv-edu-title">{edu.titulo}</h4>
                            <p className="cv-edu-subtitle">{edu.institucion} | {edu.fecha}</p>
                          </div>
                        ))}
                      </section>
                    </div>
                    <div className="cv-sidebar-col">
                      {profilePicUrl && <img src={profilePicUrl} alt="Foto de perfil" className="cv-profile-pic" data-ai-hint="profile picture" />}
                      <section className="mb-6">
                        <h3 className="cv-section-title">Contacto</h3>
                        {optimizedCv.contacto.email && <div className="cv-contact-item"><Mail className="w-4 h-4" /> <span>{optimizedCv.contacto.email}</span></div>}
                        {optimizedCv.contacto.telefono && <div className="cv-contact-item"><Phone className="w-4 h-4" /> <span>{optimizedCv.contacto.telefono}</span></div>}
                        {optimizedCv.contacto.ubicacion && <div className="cv-contact-item"><MapPin className="w-4 h-4" /> <span>{optimizedCv.contacto.ubicacion}</span></div>}
                        {optimizedCv.contacto.linkedin && <div className="cv-contact-item"><Linkedin className="w-4 h-4" /> <span>{optimizedCv.contacto.linkedin.replace('https://', '')}</span></div>}
                        {optimizedCv.contacto.sitio_web && <div className="cv-contact-item"><Globe className="w-4 h-4" /> <span>{optimizedCv.contacto.sitio_web.replace('https://', '')}</span></div>}
                      </section>
                      <section className="mb-6">
                        <h3 className="cv-section-title">Habilidades Técnicas</h3>
                        <div className="cv-skills-list">
                          {optimizedCv.habilidades.tecnicas.map((skill, i) => <span key={i} className="cv-skill-item">{skill}</span>)}
                        </div>
                      </section>
                      <section className="mb-6">
                        <h3 className="cv-section-title">Habilidades Blandas</h3>
                        <div className="cv-skills-list">
                          {optimizedCv.habilidades.blandas.map((skill, i) => <span key={i} className="cv-skill-item">{skill}</span>)}
                        </div>
                      </section>
                      <section className="mb-6">
                        <h3 className="cv-section-title">Idiomas</h3>
                          {optimizedCv.idiomas.map((lang, i) => <p key={i} className="text-base text-gray-700">{lang}</p>)}
                      </section>
                      {optimizedCv.certificaciones.length > 0 && (
                        <section>
                          <h3 className="cv-section-title">Certificaciones</h3>
                            {optimizedCv.certificaciones.map((cert, i) => <p key={i} className="text-base text-gray-700">{cert}</p>)}
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
      )}
    </div>
  );
}
