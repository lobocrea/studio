'use client';

import { extractCvData, type ExtractCvDataOutput } from '@/ai/flows/extract-cv-data';
import { generateOptimizedCv, type GenerateOptimizedCvOutput } from '@/ai/flows/generate-optimized-cv';
import { zodResolver } from '@hookform/resolvers/zod';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Briefcase, Download, FileText, GraduationCap, Languages, Loader2, UploadCloud, User, Wand2, Wrench, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { LoadingState } from './loading-state';

type Step = 'upload' | 'extracting' | 'preview' | 'generating' | 'result';
type CVStyle = 'Minimalist' | 'Modern' | 'Classic';

const formSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido.'),
  style: z.enum(['Minimalist', 'Modern', 'Classic']),
  resumen_profesional: z.string(),
  experiencia_laboral: z.string(),
  formacion_academica: z.string(),
  habilidades_tecnicas: z.string(),
  habilidades_blandas: z.string(),
  idiomas: z.string(),
  certificaciones: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function CvOptimizer() {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractCvDataOutput | null>(null);
  const [optimizedCv, setOptimizedCv] = useState<GenerateOptimizedCvOutput | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CVStyle>('Modern');
  const [fullName, setFullName] = useState<string>('');
  const [fileName, setFileName] = useState<string>('cv-optimizado');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setExtractedData(result);
        form.reset({
          fullName: '',
          style: 'Modern',
          resumen_profesional: result.resumen_profesional,
          experiencia_laboral: result.experiencia_laboral.join('\n'),
          formacion_academica: result.formacion_academica.join('\n'),
          habilidades_tecnicas: result.habilidades.tecnicas.join('\n'),
          habilidades_blandas: result.habilidades.blandas.join('\n'),
          idiomas: result.idiomas.join('\n'),
          certificaciones: result.certificaciones.join('\n'),
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
  
  const handleGenerateSubmit = async (values: FormValues) => {
    setStep('generating');
    setError(null);
    setSelectedStyle(values.style);
    setFullName(values.fullName);
    setFileName(values.fullName.trim().replace(/\s+/g, '-').toLowerCase());
    
    const extractedDataJSON = JSON.stringify({
        resumen_profesional: values.resumen_profesional,
        experiencia_laboral: values.experiencia_laboral.split('\n').filter(Boolean),
        formacion_academica: values.formacion_academica.split('\n').filter(Boolean),
        habilidades: {
            tecnicas: values.habilidades_tecnicas.split('\n').filter(Boolean),
            blandas: values.habilidades_blandas.split('\n').filter(Boolean),
        },
        idiomas: values.idiomas.split('\n').filter(Boolean),
        certificaciones: values.certificaciones.split('\n').filter(Boolean),
    });

    try {
        const result = await generateOptimizedCv({ extractedData: extractedDataJSON, style: values.style });
        setOptimizedCv(result);
        setStep('result');
    } catch(e) {
        console.error(e);
        setError('No se pudo generar el CV optimizado. Por favor, intente nuevamente.');
        setStep('preview');
    }
  };

  const handleDownloadJson = () => {
    if (!extractedData) return;
    const jsonBlob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'datos-cv'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadPdf = async () => {
    if (!cvPreviewRef.current) return;
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(cvPreviewRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps= pdf.getImageProperties(imgData);
        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width * ratio, imgProps.height * ratio);
        pdf.save(`${fileName || 'cv-optimizado'}.pdf`);
    } catch (e) {
        console.error(e);
        setError("Error al generar el PDF. Por favor, intente de nuevo.");
    } finally {
        setIsDownloading(false);
    }
  };

  const startOver = () => {
    setStep('upload');
    setError(null);
    setExtractedData(null);
    setOptimizedCv(null);
    form.reset();
  };
  
  const iconMap: { [key: string]: React.ElementType } = {
    'Resumen profesional': User,
    'Experiencia laboral': Briefcase,
    'Formación académica': GraduationCap,
    'Habilidades': Wrench,
    'Idiomas': Languages,
    'Certificaciones': Award,
  };

  const renderCvContent = (text: string) => {
    const sections: { [key: string]: string[] } = {};
    const sectionHeaders = ['Resumen profesional', 'Experiencia laboral', 'Formación académica', 'Habilidades', 'Idiomas', 'Certificaciones'];
    let currentSection: string | null = null;
    
    text.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
  
      const header = sectionHeaders.find(h => trimmedLine.toLowerCase().replace(/:$/, '') === h.toLowerCase());
  
      if (header) {
        currentSection = header;
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
      } else if (currentSection) {
        sections[currentSection].push(trimmedLine);
      }
    });
  
    return Object.entries(sections).map(([title, content]) => {
      const Icon = iconMap[title] || FileText;
      const filteredContent = content.filter(item => item.trim() !== '');
      if (filteredContent.length === 0) return null;
  
      return (
        <div key={title} className="cv-preview-section">
          <h2>
            <Icon className="h-5 w-5" />
            <span>{title}</span>
          </h2>
          {filteredContent.map((item, index) => (
            <p key={index} className="break-words">{item}</p>
          ))}
        </div>
      );
    });
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
            <CardDescription>Ajusta los datos extraídos por la IA y elige un estilo para tu nuevo CV.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl><Input placeholder="Ej: Ana García" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
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
                </div>
                
                <FormField control={form.control} name="resumen_profesional" render={({ field }) => (
                    <FormItem><FormLabel>Resumen Profesional</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="experiencia_laboral" render={({ field }) => (
                    <FormItem><FormLabel>Experiencia Laboral</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormDescription>Cada puesto en una línea nueva.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="formacion_academica" render={({ field }) => (
                    <FormItem><FormLabel>Formación Académica</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormDescription>Cada título en una línea nueva.</FormDescription><FormMessage /></FormItem>
                )} />
                <div className="grid md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="habilidades_tecnicas" render={({ field }) => (
                        <FormItem><FormLabel>Habilidades Técnicas</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormDescription>Cada habilidad en una línea nueva.</FormDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="habilidades_blandas" render={({ field }) => (
                        <FormItem><FormLabel>Habilidades Blandas</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormDescription>Cada habilidad en una línea nueva.</FormDescription><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="idiomas" render={({ field }) => (
                    <FormItem><FormLabel>Idiomas</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormDescription>Cada idioma en una línea nueva.</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="certificaciones" render={({ field }) => (
                    <FormItem><FormLabel>Certificaciones</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormDescription>Cada certificación en una línea nueva.</FormDescription><FormMessage /></FormItem>
                )} />

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
                        <CardDescription>Descárgalo en formato PDF y JSON. ¡Mucha suerte en tu búsqueda!</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button onClick={handleDownloadJson} variant="secondary" className="w-full md:w-auto"><Download className="mr-2 h-4 w-4"/> JSON</Button>
                        <Button onClick={handleDownloadPdf} className="w-full md:w-auto" disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            PDF
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-start bg-gray-200 p-4 sm:p-8">
                <div ref={cvPreviewRef} className={cn('cv-preview-container', `cv-${selectedStyle.toLowerCase()}`)}>
                    <div className="cv-preview-header">
                        <h1>{fullName}</h1>
                    </div>
                    {renderCvContent(optimizedCv.optimizedCvText)}
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
