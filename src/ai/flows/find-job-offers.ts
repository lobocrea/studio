
'use server';

/**
 * @fileOverview A flow to find relevant job offers from the theirStack API.
 * 
 * - findJobOffers - A function that handles finding job offers.
 * - FindJobOffersInput - The input type for the findJobOffers function.
 * - JobOffer - The structure of a single job offer.
 */

import { ai } from '@/ai/genkit';
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
  skills: z.array(z.string()).describe('A list of the user\'s technical skills.'),
  experience: z.array(z.string()).describe('A list of the user\'s work experiences (titles).'),
  education: z.array(z.string()).describe('A list of the user\'s academic background (titles).'),
  location: z.string().optional().describe('The user\'s location (e.g., "Madrid, Spain").'),
  page: z.number().optional().default(1),
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
    const apiKey = process.env.THEIR_STACK_API_KEY;
    if (!apiKey) {
      throw new Error('THEIR_STACK_API_KEY is not configured.');
    }
    
    const countryCode = input.location?.split(',').pop()?.trim().toUpperCase();

    const requestBody: any = {
        // The page in the API is 0-indexed, so we subtract 1.
        page: (input.page ?? 1) -1,
        limit: input.limit,
        posted_at_max_age_days: 60,
        order_by: [{ field: "date_posted", desc: true }],
        job_country_code_or: countryCode ? [countryCode] : undefined,
        include_total_results: false,
    };

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
            console.error('TheirStack API Error:', response.status, errorBody);
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
