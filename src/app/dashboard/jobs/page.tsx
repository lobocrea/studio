
import { JobSearchPage } from '@/components/job-search-page';
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

  // Fetch the user's technical skills to populate the search form dropdown
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('skill_name')
    .eq('worker_id', user.id)
    .eq('skill_type', 'tecnica')
    .order('skill_name', { ascending: true });

  if (skillsError) {
    console.error("Error fetching user's skills:", skillsError);
    // Continue with an empty list of skills
  }

  const userSkills = skills?.map(s => s.skill_name) || [];

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center p-4 bg-lava-lamp">
       <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
            <JobSearchPage userSkills={userSkills} />
       </div>
    </main>
  );
}
