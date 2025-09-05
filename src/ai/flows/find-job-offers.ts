
'use server';

/**
 * @fileOverview A flow to find relevant job offers by calling the internal proxy server.
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
    companyLogo: z.string().url().optional().nullable(),
    perks: z.array(z.string()),
    salary: z.string().optional().nullable(),
    location: z.string(),
    url: z.string().url(),
    technologies: z.array(z.string()),
});
export type JobOffer = z.infer<typeof JobOfferSchema>;

const FindJobOffersInputSchema = z.object({
  skill: z.string().optional(),
  location: z.string().optional(),
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
    // The base URL of our proxy server. This should be an environment variable in a real app.
    const proxyServerUrl = process.env.PROXY_SERVER_URL || 'http://localhost:3001';

    // Construct the query parameters
    const queryParams = new URLSearchParams({
        limit: String(input.limit || 20),
    });

    if (input.skill) {
        queryParams.append('skill', input.skill);
    }
    if (input.location && input.location !== 'all') {
        queryParams.append('location', input.location);
    }
    if (input.contractType && input.contractType !== 'all') {
        queryParams.append('contractType', input.contractType);
    }
    
    const fullUrl = `${proxyServerUrl}/api/jobs?${queryParams.toString()}`;

    try {
        console.log(`Calling proxy server to find jobs: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Proxy Server Error:', `Status: ${response.status}`, `Body: ${errorBody}`);
            throw new Error(`Failed to fetch job offers from proxy server: ${response.statusText}`);
        }

        const jobs = await response.json();
        console.log(`Found ${jobs.length} jobs from the proxy server.`);

        return jobs;
    } catch (error) {
        console.error('Error in findJobOffersFlow:', error);
        return [];
    }
  }
);
