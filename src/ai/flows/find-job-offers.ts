
'use server';

/**
 * @fileOverview A flow to find relevant job offers from the theirStack API based on user-provided criteria.
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

// The input is now the search criteria from the form
const FindJobOffersInputSchema = z.object({
  skill: z.string().optional(),
  location: z.string().optional(),
  // Note: theirStack API doesn't have a direct `contractType` filter in the documented search body.
  // This might be part of the general query `q` or a specific perk.
  // For now, we will include it in the query if provided.
  contractType: z.string().optional(), 
  limit: z.number().optional().default(10),
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
    
    // Construct the query based on input
    const queryParts = [];
    if (input.skill) queryParts.push(input.skill);
    if (input.contractType) queryParts.push(input.contractType);
    
    const requestBody: any = {
        page: 0,
        limit: input.limit,
        posted_at_max_age_days: 60,
        order_by: [{ field: "date_posted", desc: true }],
        include_total_results: false,
    };
    
    // Use `query_and` for the selected skill if present
    if (input.skill) {
        requestBody.query_and = [input.skill];
    }
    
    // Add contract type to general query if specified
    if(input.contractType){
      requestBody.q = input.contractType;
    }

    // Add location to the search body if provided
    if (input.location) {
        // The API seems to expect a country code. We will assume the user enters a province in Spain.
        requestBody.job_country_code_or = ["ES"];
        // We can add the specific province to the general query text
        requestBody.q = requestBody.q ? `${requestBody.q} ${input.location}` : input.location;
    }


    try {
        console.log('Sending request to theirStack with body:', JSON.stringify(requestBody, null, 2));

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
        
        console.log(`Found ${jobs.length} jobs from TheirStack.`);

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
