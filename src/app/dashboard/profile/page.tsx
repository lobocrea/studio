import { ProfileForm } from "@/components/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch worker data
    const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', user.id)
        .single();
    
    // Fetch the most recent CV for the logged-in user
    const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (cvError || !cvData || workerError || !workerData) {
        // If there is no CV or worker data, redirect to the main dashboard to create one.
        console.warn('No CV or worker data found for user, redirecting to dashboard.');
        redirect('/dashboard');
    }

    return (
        <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
             <header className="text-center mb-8 md:mb-12">
                <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground">
                    Tu Perfil Profesional
                </h1>
                <p className="text-muted-foreground mt-4 text-lg md:text-xl max-w-2xl mx-auto">
                    Aquí puedes ver y actualizar la información que usamos para encontrar las mejores ofertas para ti.
                </p>
            </header>
            <ProfileForm initialCvData={cvData} initialWorkerData={workerData} />
        </div>
    );
}
