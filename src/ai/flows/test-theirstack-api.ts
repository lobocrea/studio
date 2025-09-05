
'use server';

/**
 * @fileOverview A flow to test the availability and search functionality of the theirStack API.
 * 
 * - testTheirStackApi - A function that checks the health and performs a test search on the theirStack API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { JobOffer } from './find-job-offers';

const ApiResponseSchema = z.object({
  available: z.boolean(),
  searchTest: z.object({
    success: z.boolean(),
    message: z.string(),
    resultsCount: z.number().optional(),
    jobs: z.array(z.any()).optional(), // Allow any structure for jobs for now
  }),
  status: z.number().optional(),
  error: z.string().optional(),
});
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

export async function testTheirStackApi(): Promise<ApiResponse> {
  return testTheirStackApiFlow();
}

const testTheirStackApiFlow = ai.defineFlow(
  {
    name: 'testTheirStackApiFlow',
    outputSchema: ApiResponseSchema,
  },
  async () => {
    const proxyServerUrl = process.env.PROXY_SERVER_URL || 'http://localhost:3001';

    // 1. Test Health Endpoint via Proxy
    try {
      console.log('Testing proxy server health...');
      const healthResponse = await fetch(`${proxyServerUrl}/api/health`);

      if (!healthResponse.ok) {
         const errorBody = await healthResponse.text();
         const errorMessage = `Proxy health check failed. Status: ${healthResponse.status}. Body: ${errorBody}`;
         console.error('Proxy Server Error:', errorMessage);
         return { 
           available: false, 
           status: healthResponse.status,
           error: errorMessage,
           searchTest: { success: false, message: 'Skipped due to proxy health check failure.' }
         };
      }
      
      const healthData = await healthResponse.json();
      if (!healthData.available) {
        const errorMessage = `Proxy reports TheirStack API is unavailable. Error: ${healthData.error}`;
        console.error(errorMessage);
        return { 
           available: false, 
           error: errorMessage,
           searchTest: { success: false, message: 'Skipped due to API unavailability reported by proxy.' }
         };
      }

      console.log('Proxy and TheirStack API health check successful.');
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during health check.';
       console.error('Error connecting to proxy server for health check:', errorMessage);
       return {
        available: false,
        error: `Failed to connect to proxy server: ${errorMessage}`,
        searchTest: { success: false, message: 'Skipped due to proxy connection error.' }
       };
    }
    
    // 2. Perform a test search via Proxy
    try {
        console.log('Performing search test via proxy...');
        const queryParams = new URLSearchParams({
            skill: 'fullstack',
            limit: '3',
            location: 'España'
        });
        const fullUrl = `${proxyServerUrl}/api/jobs?${queryParams.toString()}`;

        const searchResponse = await fetch(fullUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!searchResponse.ok) {
             const errorBody = await searchResponse.text();
             const errorMessage = `Search test failed. Proxy returned status ${searchResponse.status}: ${searchResponse.statusText}. Body: ${errorBody}`;
             console.error('Proxy Search Test Error:', errorMessage);
             return {
                available: true,
                status: searchResponse.status,
                error: errorMessage,
                searchTest: { success: false, message: errorMessage }
             };
        }

        const jobs: JobOffer[] = await searchResponse.json();
        const resultsCount = jobs.length;
        const successMessage = `Search test successful. Found ${resultsCount} jobs for "fullstack".`;
        console.log(successMessage);
        
        return {
            available: true,
            status: searchResponse.status,
            searchTest: { success: true, message: successMessage, resultsCount, jobs: jobs }
        };

    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during search test.';
        console.error('Error connecting to proxy for search test:', errorMessage);
        return {
            available: true, // Health check passed, but search failed
            error: `Failed to connect to proxy for search: ${errorMessage}`,
            searchTest: { success: false, message: errorMessage }
        };
    }
  }
);
