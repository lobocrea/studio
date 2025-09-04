
'use server';

/**
 * @fileOverview A flow to test the availability of the theirStack API.
 * 
 * - testTheirStackApi - A function that checks the health of the theirStack API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ApiResponseSchema = z.object({
  available: z.boolean(),
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
      return { available: false, error: 'THEIR_STACK_API_KEY is not configured.' };
    }

    try {
      console.log('Testing theirStack API connection...');
      const response = await fetch(`https://api.theirstack.com/v1/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('theirStack API Health Check Error:', `Status: ${response.status}`, `Body: ${errorBody}`);
        return { 
          available: false, 
          status: response.status,
          error: `API returned status ${response.status}: ${response.statusText}` 
        };
      }

      const data = await response.json();
      console.log('theirStack API is available. Status:', response.status, 'Data:', data);
      return {
        available: true,
        status: response.status,
        data: data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error connecting to theirStack API:', errorMessage);
      return {
        available: false,
        error: errorMessage,
      };
    }
  }
);
