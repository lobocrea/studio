
import { JobSearchPage } from '@/components/job-search-page';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Tables } from '@/types/supabase';
import { redirect } from 'next/navigation';

export default async function JobsDashboardPage() {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/');
    }

    // Fetch all unique skills for the logged-in user
    const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('skill_name')
        .eq('worker_id', user.id);

    // We can show a message if there is no skills data.
    if (skillsError) {
        console.warn('Could not fetch skills data for user, job search filters will be empty.');
    }
    
    // Process skills to get a unique list of strings
    const uniqueSkills = skillsData 
        ? [...new Set(skillsData.map(s => s.skill_name))] 
        : [];

    // Fetch the most recent CV just to get the location
    const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('contact_info')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    const location = (cvData?.contact_info as { ubicacion?: string })?.ubicacion || '';
    
    if (cvError) {
        console.warn('Could not fetch CV data for user location.');
    }
    
    return (
        <div className="w-full h-full flex flex-col items-center">
             <header className="text-center mb-8 md:mb-12">
                <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground">
                    Encuentra tu Próximo Desafío
                </h1>
                <p className="text-muted-foreground mt-4 text-lg md:text-xl max-w-2xl mx-auto">
                    Utiliza nuestros filtros inteligentes para encontrar las mejores ofertas de trabajo para ti.
                </p>
            </header>
            <JobSearchPage initialSkills={uniqueSkills} initialLocation={location} />
        </div>
    )
}
