
'use client';

import type { Tables } from '@/types/supabase';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CvPreview } from './cv-preview';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

type CvListPageProps = {
    cvs: Tables<'cvs'>[];
}

export function CvListPage({ cvs }: CvListPageProps) {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState<number | null>(null);
    const previewRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleDownloadPdf = async (cv: Tables<'cvs'>, index: number) => {
        const cvPreviewRef = previewRefs.current[index];
        if (!cvPreviewRef) return;
        
        setIsDownloading(cv.id);
        
        try {
            const canvas = await html2canvas(cvPreviewRef, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: cvPreviewRef.scrollWidth,
                windowHeight: cvPreviewRef.scrollHeight,
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
            const fileName = cv.title?.trim().replace(/\s+/g, '-').toLowerCase() || 'cv-optimizado';
            pdf.save(`${fileName}.pdf`);
        } catch (e) {
            console.error("Error generating PDF:", e);
            toast({
                variant: "destructive",
                title: "Error al generar el PDF",
                description: "Hubo un problema al intentar descargar el CV. Por favor, intente de nuevo."
            });
        } finally {
            setIsDownloading(null);
        }
    };

    if (cvs.length === 0) {
        return (
            <Card className="glassmorphism-card text-center w-full max-w-lg">
                <CardHeader>
                    <CardTitle>No tienes CVs guardados</CardTitle>
                    <CardDescription>
                        Ve a la sección de "Optimizar CV" para generar tu primer CV optimizado para el mercado español.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="w-full">
            <Accordion type="single" collapsible className="w-full space-y-4">
                {cvs.map((cv, index) => {
                    // Type assertion as the data from Supabase needs to be cast to the expected type
                    const cvData = {
                        title: cv.title,
                        resumen_profesional: cv.professional_summary,
                        experiencia_laboral: cv.work_experience,
                        formacion_academica: cv.academic_background,
                        habilidades: cv.skills,
                        idiomas: cv.languages,
                        certificaciones: cv.certifications,
                        contacto: cv.contact_info
                    } as any;

                    return (
                         <Card key={cv.id} className="glassmorphism-card overflow-hidden">
                            <AccordionItem value={`item-${cv.id}`} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="text-left">
                                            <p className="font-bold text-lg text-primary-foreground">{cv.title || 'CV sin título'}</p>
                                            <p className="text-sm text-muted-foreground">Generado el {new Date(cv.created_at).toLocaleDateString()}</p>
                                        </div>
                                         <Button
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent accordion from toggling
                                                handleDownloadPdf(cv, index);
                                            }}
                                            disabled={isDownloading === cv.id}
                                            className="mr-4"
                                            >
                                            {isDownloading === cv.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="mr-2 h-4 w-4" />
                                            )}
                                            {isDownloading === cv.id ? 'Descargando...' : 'Descargar PDF'}
                                        </Button>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-gray-200 dark:bg-gray-800 flex justify-center overflow-auto">
                                        <div ref={el => previewRefs.current[index] = el} className="transform scale-[0.9]">
                                             <CvPreview 
                                                cvData={cvData} 
                                                style={cv.style as any || 'Modern'}
                                             />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    )
                })}
            </Accordion>
        </div>
    );
}

