import { JobOffersPage } from '@/components/job-offers-page';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function JobsDashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch the most recent CV for the logged-in user
  const { data: cvData, error: cvError } = await supabase
    .from('cvs')
    .select('*')
    .eq('worker_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (cvError || !cvData) {
    // If there is no CV, we can't show jobs. Redirect to the main dashboard to create one.
    console.warn('No CV found for user, redirecting to dashboard.');
    redirect('/dashboard');
  }

  // The data from the DB needs to be cast to the type expected by the component
  const formattedCvData = {
    title: cvData.title || '',
    resumen_profesional: cvData.professional_summary || '',
    // Supabase stores jsonb, so we need to ensure they are correctly typed arrays
    experiencia_laboral: (cvData.work_experience as any[] || []).map(exp => ({
        puesto: exp.puesto || '',
        empresa: exp.empresa || '',
        fecha: exp.fecha || '',
        descripcion: exp.descripcion || '',
    })),
    formacion_academica: (cvData.academic_background as any[] || []).map(edu => ({
        titulo: edu.titulo || '',
        institucion: edu.institucion || '',
        fecha: edu.fecha || '',
    })),
    habilidades: {
        tecnicas: (cvData.skills as any)?.tecnicas || [],
        blandas: (cvData.skills as any)?.blandas || [],
    },
    idiomas: (cvData.languages as any[]) || [],
    certificaciones: (cvData.certifications as any[]) || [],
    contacto: {
        email: (cvData.contact_info as any)?.email || '',
        telefono: (cvData.contact_info as any)?.telefono || '',
        ubicacion: (cvData.contact_info as any)?.ubicacion || '',
        linkedin: (cvData.contact_info as any)?.linkedin,
        sitio_web: (cvData.contact_info as any)?.sitio_web,
    },
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center p-4 bg-lava-lamp">
       <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
            <JobOffersPage cvData={formattedCvData} />
       </div>
    </main>
  );
}
