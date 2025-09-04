
import { CvListPage } from '@/components/cv-list-page';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function CvsPage() {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: cvs, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching CVs:', error);
        // You might want to show an error message to the user
    }

    return (
        <div className="w-full max-w-7xl mx-auto z-10 flex flex-col items-center">
            <header className="text-center mb-8 md:mb-12">
                <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground">
                    Mis CVs Guardados
                </h1>
                <p className="text-muted-foreground mt-4 text-lg md:text-xl max-w-2xl mx-auto">
                    Aquí puedes ver y descargar todas las versiones de tu CV que has generado.
                </p>
            </header>
            <CvListPage cvs={cvs || []} />
        </div>
    );
}
