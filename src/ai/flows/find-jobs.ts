
'use server';

/**
 * @fileOverview A flow to find job offers using the TheirStack API.
 *
 * This flow queries the TheirStack API for real job listings based on user criteria.
 *
 * - findJobs - A function that handles the job search process.
 * - FindJobsInput - The input type for the findJobs function.
 * - FindJobsOutput - The return type for the findJobs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindJobsInputSchema = z.object({
  keyword: z.string().describe("The main skill or keyword, e.g., 'React', 'Marketing Digital'."),
  province: z.string().describe("The province in Spain, e.g., 'Madrid', 'Barcelona'."),
  // The API doesn't seem to have direct mapping for contractType or experienceLevel from the curl example
  // They might be searchable via the `q` parameter or other fields not shown.
  // For now, they are included in the schema but not used in the API call.
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
  jobs: z.array(JobOfferSchema).describe("An array of job offers from the API."),
});
export type FindJobsOutput = z.infer<typeof FindJobsOutputSchema>;


export async function findJobs(input: FindJobsInput): Promise<FindJobsOutput> {
  return findJobsFlow(input);
}


const findJobsFlow = ai.defineFlow(
  {
    name: 'findJobsFlow',
    inputSchema: FindJobsInputSchema,
    outputSchema: FindJobsOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.THEIRSTACK_API;
    if (!apiKey) {
      throw new Error('THEIRSTACK_API key is not configured.');
    }

    // Build the query string, combining keyword and experience level
    const queryParts = [];
    if (input.keyword && input.keyword !== 'all') {
      queryParts.push(input.keyword);
    }
     if (input.experienceLevel && input.experienceLevel !== 'all') {
      queryParts.push(input.experienceLevel);
    }

    const requestBody: any = {
        include_total_results: false,
        order_by: [{ field: "date_posted", desc: true }],
        posted_at_max_age_days: 30, // Increased to get more results
        job_country_code_or: ["ES"],
        scraper_name_pattern_or: ["infojobs", "indeed", "linkedin"],
        page: 0,
        limit: 15,
        blur_company_data: false,
        q: queryParts.join(' '),
    };

    if (input.province && input.province !== 'all') {
        requestBody.job_locations_or = [input.province];
    }
     if (input.contractType && input.contractType !== 'all') {
        // This is a free text search, so we can add the contract type to the query
        requestBody.q = `${requestBody.q || ''} ${input.contractType}`.trim();
    }


    const response = await fetch("https://api.theirstack.com/v1/jobs/search", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('TheirStack API Error:', errorBody);
        throw new Error(`Failed to fetch jobs from TheirStack API: ${response.statusText}`);
    }

    const data = await response.json();

    // Map the API response to our JobOfferSchema
    const jobs = (data.results || []).map((job: any) => {
        // A helper to determine modality
        const getModality = (title: string, description: string): string => {
            const lowerTitle = title.toLowerCase();
            const lowerDesc = description.toLowerCase();
            if (lowerTitle.includes('remoto') || lowerDesc.includes('remoto') || lowerTitle.includes('remote') || lowerDesc.includes('remote')) return 'Remoto';
            if (lowerTitle.includes('híbrido') || lowerDesc.includes('híbrido') || lowerTitle.includes('hybrid') || lowerDesc.includes('hybrid')) return 'Híbrido';
            return 'Presencial';
        }
        
        // Helper to format salary
        const formatSalary = (min?: number, max?: number, currency?: string, interval?: string): string | undefined => {
            if (!min && !max) return undefined;
            const moneyFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 0 });
            let salaryText = '';
            if (min) salaryText += moneyFormat.format(min);
            if (max) salaryText += ` - ${moneyFormat.format(max)}`;
            if (interval) salaryText += ` ${interval}`;
            return salaryText.trim();
        }

        return {
            id: job.id,
            title: job.job_title,
            company: job.company_name || 'Confidencial',
            location: job.job_locations?.[0] || 'Ubicación no especificada',
            salary: formatSalary(job.job_salary_min, job.job_salary_max, job.job_salary_currency, job.job_salary_interval),
            // Truncate description for brevity in the card
            description: job.job_description?.substring(0, 150) + '...' || 'Sin descripción.',
            modality: getModality(job.job_title, job.job_description || ''),
        };
    });

    return { jobs };
  }
);
