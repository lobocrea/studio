
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

type CvListPageProps = {
    cvs: Tables<'cvs'>[];
}

export function CvListPage({ cvs }: CvListPageProps) {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedCv, setSelectedCv] = useState<Tables<'cvs'> | null>(null);
    const [workerData, setWorkerData] = useState<{ full_name: string, profile_pic_url: string | null } | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const supabase = createSupabaseBrowserClient();

    const fetchWorkerData = async (workerId: string) => {
        const { data, error } = await supabase
            .from('workers')
            .select('full_name, profile_pic_url')
            .eq('id', workerId)
            .single();

        if (error) {
            console.error('Error fetching worker data:', error);
            return null;
        }
        return data;
    };

    const handleDownloadClick = async (cv: Tables<'cvs'>) => {
        const fetchedWorkerData = await fetchWorkerData(cv.worker_id);
        if (fetchedWorkerData) {
            setWorkerData(fetchedWorkerData);
            setSelectedCv(cv);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo obtener la información del trabajador para este CV."
            });
        }
    };

    const handleDownloadPdf = async () => {
        if (!previewRef.current || !selectedCv) return;
        
        setIsDownloading(true);
        
        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: previewRef.current.scrollWidth,
                windowHeight: previewRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4', true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / pdfWidth;
            let imgHeight = canvasHeight / ratio;

            let heightLeft = imgHeight;
            let position = 0;
            
            // Si la imagen es más alta que una página, ajústala para que quepa en una página.
            // Esto evita problemas con CVs largos y paginación.
            if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
            }

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            
            const fileName = selectedCv.title?.trim().replace(/\s+/g, '-').toLowerCase() || 'cv-optimizado';
            pdf.save(`${fileName}.pdf`);
            setSelectedCv(null); // Close dialog on success
        } catch (e) {
            console.error("Error generating PDF:", e);
            toast({
                variant: "destructive",
                title: "Error al generar el PDF",
                description: "Hubo un problema al intentar descargar el CV. Por favor, intente de nuevo."
            });
        } finally {
            setIsDownloading(false);
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
            <div className="space-y-4">
                {cvs.map((cv) => (
                     <Card key={cv.id} className="glassmorphism-card overflow-hidden">
                        <div className="flex flex-row items-center justify-between p-4">
                            <div>
                                <p className="font-bold text-lg text-primary-foreground">{cv.title || 'CV sin título'}</p>
                                <p className="text-sm text-muted-foreground">Generado el {new Date(cv.created_at).toLocaleDateString()}</p>
                            </div>
                            <Button
                                onClick={() => handleDownloadClick(cv)}
                                variant="outline"
                                >
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={!!selectedCv} onOpenChange={(isOpen) => !isOpen && setSelectedCv(null)}>
                <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Vista Previa del CV</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-auto p-4 bg-gray-200 dark:bg-gray-800 flex justify-center">
                        {selectedCv && workerData && (
                            <div ref={previewRef} className="transform scale-[0.85] origin-top">
                                 <CvPreview 
                                    cvData={selectedCv as any} 
                                    style={selectedCv.style as any || 'Modern'}
                                    fullName={workerData.full_name}
                                    profilePicUrl={workerData.profile_pic_url}
                                 />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {isDownloading ? 'Descargando...' : 'Confirmar Descarga'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}