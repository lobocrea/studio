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

  // We no longer need to fetch the CV. The JobOffersPage will fetch jobs
  // based on the authenticated user's skills.

  return (
    <main className="relative flex min-h-screen flex-col items-center p-4 bg-lava-lamp">
       <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
            <JobOffersPage />
       </div>
    </main>
  );
}
