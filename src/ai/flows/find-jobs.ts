
'use server';

/**
 * @fileOverview A server action to find job offers using the TheirStack API.
 *
 * This function queries the TheirStack API for real job listings based on user criteria.
 *
 * - findJobs - A function that handles the job search process.
 * - FindJobsInput - The input type for the findJobs function.
 * - FindJobsOutput - The return type for the findJobs function.
 */

import { z } from 'zod';

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
  jobs: z.array(JobOfferSchema).describe("An array of job offers from the API."),
});
export type FindJobsOutput = z.infer<typeof FindJobsOutputSchema>;


export async function findJobs(input: FindJobsInput): Promise<FindJobsOutput> {
    const apiKey = process.env.THEIRSTACK_API;
    if (!apiKey) {
      throw new Error('THEIRSTACK_API key is not configured.');
    }

    // Base request body
    const requestBody: any = {
        include_total_results: false,
        order_by: [{ field: "date_posted", desc: true }],
        posted_at_max_age_days: 30,
        job_country_code_or: ["ES"],
        scraper_name_pattern_or: ["infojobs", "indeed", "linkedin"],
        page: 0,
        limit: 15,
        blur_company_data: false,
    };
    
    // Add keyword to query if it's not 'all'
    if (input.keyword && input.keyword !== 'all') {
        requestBody.q = input.keyword;
    }
    
    // Add province if it's not 'all'
    if (input.province && input.province !== 'all') {
        requestBody.job_locations_or = [input.province];
    }
    
    // NOTE: Temporarily removing contractType and experienceLevel from the query
    // as they are likely causing the Unprocessable Entity error.
    // The API expects these as specific enum values or not at all, not as free text in 'q'.

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
        console.error('TheirStack API Error:', response.status, errorBody);
        throw new Error(`Failed to fetch jobs from TheirStack API: ${response.statusText}`);
    }

    const data = await response.json();

    const getModality = (title: string, description: string): string => {
        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();
        if (lowerTitle.includes('remoto') || lowerDesc.includes('remoto') || lowerTitle.includes('remote') || lowerDesc.includes('remote')) return 'Remoto';
        if (lowerTitle.includes('híbrido') || lowerDesc.includes('híbrido') || lowerTitle.includes('hybrid') || lowerDesc.includes('hybrid')) return 'Híbrido';
        return 'Presencial';
    }
    
    const formatSalary = (min?: number, max?: number, currency?: string, interval?: string): string | undefined => {
        if (!min && !max) return undefined;
        const moneyFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 0 });
        let salaryText = '';
        if (min) salaryText += moneyFormat.format(min);
        if (max) salaryText += ` - ${moneyFormat.format(max)}`;
        if (interval) salaryText += ` Bruto/${interval.charAt(0).toUpperCase() + interval.slice(1)}`;
        return salaryText.trim();
    }

    const jobs = (data.results || []).map((job: any) => {
        return {
            id: job.id,
            title: job.job_title,
            company: job.company_name || 'Confidencial',
            location: job.job_locations?.[0] || 'Ubicación no especificada',
            salary: formatSalary(job.job_salary_min, job.job_salary_max, job.job_salary_currency, job.job_salary_interval),
            description: job.job_description?.substring(0, 150) + '...' || 'Sin descripción.',
            modality: getModality(job.job_title, job.job_description || ''),
        };
    });

    return { jobs };
}
