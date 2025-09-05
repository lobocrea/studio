'use server';

/**
 * @fileOverview A flow to find job offers based on criteria.
 *
 * This flow acts as a simulated job board API, generating realistic job listings
 * tailored to the Spanish market based on the user's search criteria.
 *
 * - findJobs - A function that handles the job search process.
 * - FindJobsInput - The input type for the findJobs function.
 * - FindJobsOutput - The return type for the findJobs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const FindJobsInputSchema = z.object({
  keyword: z.string().describe("The main skill or keyword, e.g., 'React', 'Marketing Digital'."),
  province: z.string().describe("The province in Spain, e.g., 'Madrid', 'Barcelona'."),
  contractType: z.string().describe("The type of contract, e.g., 'Jornada completa', 'Autónomo'."),
  experienceLevel: z.string().describe("The required experience level, e.g., 'Senior', 'Junior'."),
});
export type FindJobsInput = z.infer<typeof FindJobsInputSchema>;

const JobOfferSchema = z.object({
    id: z.string().describe("A unique identifier for the job offer."),
    title: z.string().describe("The job title."),
    company: z.string().describe("The name of the hiring company."),
    location: z.string().describe("The city or province of the job."),
    salary: z.string().optional().describe("The estimated salary, e.g., '30.000€ - 40.000€ Bruto/año'."),
    description: z.string().describe("A brief, engaging summary of the job role (2-3 sentences)."),
    modality: z.string().describe("The work modality, e.g., 'Híbrido', 'Remoto', 'Presencial'."),
});

const FindJobsOutputSchema = z.object({
  jobs: z.array(JobOfferSchema).describe("An array of generated job offers."),
});
export type FindJobsOutput = z.infer<typeof FindJobsOutputSchema>;


export async function findJobs(input: FindJobsInput): Promise<FindJobsOutput> {
  return findJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findJobsPrompt',
  input: { schema: FindJobsInputSchema },
  output: { schema: FindJobsOutputSchema },
  model: googleAI.model('gemini-2.5-pro'),
  prompt: `
    You are an expert AI recruiter for the Spanish job market. Your task is to generate a list of 5 realistic but FAKE job offers based on the provided criteria.
    The job offers must be in Spanish and tailored to the Spanish market conventions.

    Search Criteria:
    - Skill/Keyword: {{{keyword}}}
    - Province: {{{province}}}
    - Contract Type: {{{contractType}}}
    - Experience Level: {{{experienceLevel}}}

    Instructions:
    1.  Generate a list of exactly 5 job offers.
    2.  The company names should sound like real Spanish or international tech companies (e.g., "Innovatec Solutions", "Data-driven SL", "Cyberia Consulting", "Glovo", "Cabify"). Do not use placeholder names like "Tech Company A".
    3.  The job descriptions should be concise (2-3 sentences) but compelling, highlighting key responsibilities or technologies.
    4.  The salary should be realistic for the role, experience, and location in Spain. Express it in Euros Bruto/año.
    5.  The 'modality' should be 'Híbrido', 'Remoto', or 'Presencial'.
    6.  Ensure the generated job location matches the requested province.
    7.  Return the data as a JSON object matching the defined output schema.
  `,
});


const findJobsFlow = ai.defineFlow(
  {
    name: 'findJobsFlow',
    inputSchema: FindJobsInputSchema,
    outputSchema: FindJobsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || { jobs: [] };
  }
);
