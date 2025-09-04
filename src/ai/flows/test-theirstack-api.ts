
'use server';

/**
 * @fileOverview A flow to test the availability and search functionality of the theirStack API.
 * 
 * - testTheirStackApi - A function that checks the health and performs a test search on the theirStack API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ApiResponseSchema = z.object({
  available: z.boolean(),
  searchTest: z.object({
    success: z.boolean(),
    message: z.string(),
    resultsCount: z.number().optional(),
  }),
  status: z.number().optional(),
  data: z.any().optional(),
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
    const apiKey = process.env.THEIR_STACK_API_KEY;
    if (!apiKey) {
      const errorResult = { available: false, error: 'THEIR_STACK_API_KEY is not configured.', searchTest: { success: false, message: 'Skipped due to missing API key.' } };
      console.error(errorResult.error);
      return errorResult;
    }
    
    // 1. Test Health Endpoint
    try {
      console.log('Testing theirStack API health...');
      const healthResponse = await fetch(`https://api.theirstack.com/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!healthResponse.ok) {
        const errorBody = await healthResponse.text();
        const errorMessage = `Health check failed. API returned status ${healthResponse.status}: ${healthResponse.statusText}. Body: ${errorBody}`;
        console.error('theirStack API Health Check Error:', errorMessage);
        return { 
          available: false, 
          status: healthResponse.status,
          error: errorMessage,
          searchTest: { success: false, message: 'Skipped due to health check failure.' }
        };
      }
      console.log('theirStack API health check successful.');
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during health check.';
       console.error('Error connecting to theirStack API for health check:', errorMessage);
       return {
        available: false,
        error: errorMessage,
        searchTest: { success: false, message: 'Skipped due to health check connection error.' }
       };
    }
    
    // 2. Test Search Endpoint with parameters
    try {
        console.log('Performing search test on theirStack API...');
        const searchBody = {
            page: 0,
            limit: 3,
            query_and: ["React", "Node.js"],
            job_country_code_or: ["ES"] // Search in Spain for the test
        };
        
        console.log('Test search request body:', JSON.stringify(searchBody, null, 2));

        const searchResponse = await fetch(`https://api.theirstack.com/v1/jobs/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(searchBody),
        });

        if (!searchResponse.ok) {
             const errorBody = await searchResponse.text();
             const errorMessage = `Search test failed. API returned status ${searchResponse.status}: ${searchResponse.statusText}. Body: ${errorBody}`;
             console.error('theirStack API Search Test Error:', errorMessage);
             return {
                available: true,
                status: searchResponse.status,
                error: errorMessage,
                searchTest: { success: false, message: errorMessage }
             };
        }

        const searchData = await searchResponse.json();
        const resultsCount = searchData.jobs?.length || 0;
        const successMessage = `Search test successful. Found ${resultsCount} jobs.`;
        console.log(successMessage);
        
        return {
            available: true,
            status: searchResponse.status,
            data: searchData,
            searchTest: { success: true, message: successMessage, resultsCount }
        };

    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during search test.';
        console.error('Error connecting to theirStack API for search test:', errorMessage);
        return {
            available: true, // Health check passed, but search failed
            error: errorMessage,
            searchTest: { success: false, message: errorMessage }
        };
    }
  }
);
