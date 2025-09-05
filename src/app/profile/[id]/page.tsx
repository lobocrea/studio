
import { CvPreview } from "@/components/cv-preview";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type PublicProfilePageProps = {
    params: {
        id: string;
    }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const supabase = await createSupabaseServerClient();
    const userId = params.id;

    // Fetch worker data
    const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', userId)
        .single();
    
    // Fetch the most recent CV for the worker
    const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('worker_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (workerError || cvError || !workerData || !cvData) {
        // This is a public page, so we show "Not Found" instead of redirecting
        notFound();
    }
    
    // Type assertion to match what CvPreview expects
    const cvPreviewData = {
        title: cvData.title,
        resumen_profesional: cvData.professional_summary,
        experiencia_laboral: cvData.work_experience,
        formacion_academica: cvData.academic_background,
        habilidades: cvData.skills,
        idiomas: cvData.languages,
        certificaciones: cvData.certifications,
        contacto: cvData.contact_info
    } as any;

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-muted/40">
            <div className="absolute inset-0 -z-10 bg-lava-lamp" />
            <div className="w-full max-w-5xl mx-auto z-10">
                <Card className="shadow-2xl border-primary/20">
                    <CardContent className="p-0">
                         <div className="bg-gray-100 dark:bg-gray-800 flex justify-center overflow-auto py-8">
                            <div className="transform scale-[0.85] sm:scale-[1]">
                                <CvPreview 
                                    cvData={cvPreviewData}
                                    style={cvData.style as any || 'Modern'}
                                    fullName={workerData.full_name || ''}
                                    profilePicUrl={workerData.profile_pic_url}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <footer className="text-center mt-6">
                    <p className="text-xs text-muted-foreground">
                        Perfil generado con CV Español Optimizer
                    </p>
                </footer>
            </div>
        </main>
    );
}

// Optional: Add metadata to the page
export async function generateMetadata({ params }: PublicProfilePageProps) {
  const supabase = await createSupabaseServerClient();
  const userId = params.id;

  const { data: workerData } = await supabase
    .from('workers')
    .select('full_name')
    .eq('id', userId)
    .single();

  const { data: cvData } = await supabase
    .from('cvs')
    .select('title')
    .eq('worker_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const title = workerData?.full_name ? `${workerData.full_name} - ${cvData?.title || 'CV'}` : 'Perfil Profesional';

  return {
    title: title,
    description: `Consulta el perfil profesional online de ${workerData?.full_name || 'este candidato'}.`,
  };
}
