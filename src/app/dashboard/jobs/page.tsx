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

  return (
    <main className="relative flex min-h-screen flex-col items-center p-4 bg-lava-lamp">
       <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
            <JobOffersPage cvData={cvData} />
       </div>
    </main>
  );
}
