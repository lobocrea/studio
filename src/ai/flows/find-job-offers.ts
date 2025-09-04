
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
    
    // Attempt to extract country code from location string (e.g., "Valencia, Carabobo, VE" -> "VE")
    const countryCode = input.location?.split(',').pop()?.trim().toUpperCase();

    // Combine skills and job/education titles for a focused search query.
    // This avoids noise from long descriptions.
    const searchKeywords = [...new Set([
        ...input.skills,
        ...input.experience, // Should be job titles
        ...input.education   // Should be degree titles
    ])].join(' ');

    const requestBody: any = {
        q: searchKeywords,
        page: input.page,
        limit: input.limit,
        posted_at_max_age_days: 90, // Look for jobs in the last 3 months
        order_by: [{ field: "date_posted", desc: true }],
        job_country_code_or: countryCode ? [countryCode] : undefined, // Filter by country if available
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

        // The API returns an object with a "jobs" array. We need to map it to our schema.
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
        // Return an empty array on error to avoid breaking the UI
        return [];
    }
  }
);
