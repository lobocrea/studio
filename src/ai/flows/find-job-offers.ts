
'use server';

/**
 * @fileOverview A flow to find relevant job offers from the theirStack API based on a user's skills.
 * 
 * - findJobOffers - A function that handles finding job offers.
 * - FindJobOffersInput - The input type for the findJobOffers function.
 * - JobOffer - The structure of a single job offer.
 */

import { ai } from '@/ai/genkit';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { z } from 'genkit';

const JobOfferSchema = z.object({
    id: z.string(),
    title: z.string(),
    companyName: z.string(),
    companyLogo: z.string().url().optional(),
    perks: z.array(z.string()),
    salary: z.string().optional().nullable(),
    location: z.string(),
    url: z.string().url(),
    technologies: z.array(z.string()),
});
export type JobOffer = z.infer<typeof JobOfferSchema>;

const FindJobOffersInputSchema = z.object({
  limit: z.number().optional().default(3),
});
export type FindJobOffersInput = z.infer<typeof FindJobOffersInputSchema>;

export async function findJobOffers(input: FindJobOffersInput): Promise<JobOffer[]> {
  return findJobOffersFlow(input);
}

const findJobOffersFlow = ai.defineFlow(
  {
    name: 'findJobOffersFlow',
    inputSchema: FindJobOffersInputSchema,
    outputSchema: z.array(JobOfferSchema),
  },
  async (input) => {
    const supabase = await createSupabaseServerClient();
    
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated.');
    }

    // 2. Fetch the user's location from the most recent CV and their technical skills from the skills table
    const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('location')
        .eq('id', user.id)
        .single();
    
    const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('skill_name')
        .eq('worker_id', user.id)
        .eq('skill_type', 'tecnica');

    if (workerError || skillsError) {
        console.error('Error fetching worker or skills data:', workerError || skillsError);
        throw new Error('Could not fetch user data to find jobs.');
    }
    
    const location = workerData?.location || '';
    const technicalSkills = skillsData?.map(s => s.skill_name) || [];
    
    // 3. Call the TheirStack API
    const apiKey = process.env.THEIR_STACK_API_KEY;
    if (!apiKey) {
      throw new Error('THEIR_STACK_API_KEY is not configured.');
    }
    
    const countryCode = location?.split(',').pop()?.trim().toUpperCase();

    const requestBody: any = {
        page: 0, // We always fetch from the start, the limit controls how many we get
        limit: input.limit,
        posted_at_max_age_days: 60,
        order_by: [{ field: "date_posted", desc: true }],
        include_total_results: false,
    };
    
    if (countryCode) {
        requestBody.job_country_code_or = [countryCode];
    }
    
    // Use `query_and` to ensure results match the key skills
    if (technicalSkills.length > 0) {
        requestBody.query_and = technicalSkills;
    }

    try {
        const response = await fetch(`https://api.theirstack.com/v1/jobs/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('TheirStack API Error:', `Status: ${response.status}`, `Body: ${errorBody}`);
            throw new Error(`Failed to fetch job offers from theirStack: ${response.statusText}`);
        }

        const data = await response.json();
        const jobs = data.jobs || [];
        
        return jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            companyName: job.company_name,
            companyLogo: job.company_logo,
            perks: job.perks || [],
            salary: job.salary_range ? `${job.salary_range.min} - ${job.salary_range.max} ${job.salary_range.currency}`: null,
            location: job.location,
            url: job.url,
            technologies: job.technologies || [],
        }));
    } catch (error) {
        console.error('Error in findJobOffersFlow:', error);
        return [];
    }
  }
);
