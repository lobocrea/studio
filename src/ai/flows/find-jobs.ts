
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
  contractType: z.string().optional().describe("Type of contract, e.g., 'full_time', 'part_time', 'contract'."),
  experienceLevel: z.string().optional().describe("Experience level, e.g., 'junior', 'mid_level', 'senior'."),
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
    url: z.string().describe("The URL to apply for the job."),
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

    // Build dynamic request body based on input filters
    const requestBody: any = {
        page: 0,
        limit: 3,
        job_country_code_or: ['ES'],
        posted_at_max_age_days: 7,
        include_total_results: true,
        order_by: [{ field: "date_posted", desc: true }],
        blur_company_data: false
    };

    // Add keyword search if provided
    if (input.keyword && input.keyword.trim()) {
        requestBody.job_title_pattern_or = [input.keyword.trim()];
        requestBody.job_description_pattern_or = [input.keyword.trim()];
    }

    // Add location filter if province is specified - using country code instead
    // Note: TheirStack API may not support job_location_pattern_or, using country filter only
    // if (input.province && input.province.trim() && input.province !== 'Cualquier provincia') {
    //     requestBody.job_location_pattern_or = [input.province.trim()];
    // }

    // Add contract type filter if specified
    if (input.contractType && input.contractType !== 'Cualquier contrato') {
        const contractTypeMap: { [key: string]: string[] } = {
            'Tiempo completo': ['full_time'],
            'Tiempo parcial': ['part_time'],
            'Contrato': ['contract'],
            'Prácticas': ['internship'],
            'Freelance': ['freelance']
        };
        const mappedType = contractTypeMap[input.contractType];
        if (mappedType) {
            requestBody.employment_statuses = mappedType;
        }
    }

    // Add experience level filter if specified
    if (input.experienceLevel && input.experienceLevel !== 'Cualquier experiencia') {
        const experienceLevelMap: { [key: string]: string[] } = {
            'Junior': ['junior'],
            'Intermedio': ['mid_level'],
            'Senior': ['senior'],
            'Ejecutivo': ['c_level']
        };
        const mappedLevel = experienceLevelMap[input.experienceLevel];
        if (mappedLevel) {
            requestBody.seniority = mappedLevel[0]; // API expects single value, not array
        }
    }
    
    console.log('Sending to TheirStack API:', JSON.stringify(requestBody, null, 2));

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
        console.error('TheirStack API Error:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorBody
        });
        throw new Error(`Failed to fetch jobs from TheirStack API: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    let data;
    try {
        data = await response.json();
        console.log('Received from TheirStack API:', JSON.stringify(data, null, 2));
    } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from TheirStack API');
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from TheirStack API');
    }

    if (!data.data || !Array.isArray(data.data)) {
        console.error('No data array found in response:', data);
        return { jobs: [] };
    }


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

    const jobs = data.data.map((job: any) => {
        try {
            // Extract location information
            let location = 'Ubicación no especificada';
            if (job.locations && job.locations.length > 0) {
                const loc = job.locations[0];
                location = loc.city || loc.state || 'Ubicación no especificada';
            } else if (job.location) {
                location = job.location;
            }

            // Format salary
            let salary = undefined;
            if (job.min_annual_salary || job.max_annual_salary) {
                salary = formatSalary(
                    job.min_annual_salary, 
                    job.max_annual_salary, 
                    job.salary_currency || 'EUR', 
                    'año'
                );
            } else if (job.salary_string) {
                salary = job.salary_string;
            }

            // Get company name
            const company = job.company_object?.name || job.company || 'Confidencial';

            // Get description and truncate if needed
            let description = 'Sin descripción.';
            if (job.description) {
                description = job.description.length > 200 
                    ? job.description.substring(0, 200) + '...' 
                    : job.description;
                // Remove markdown formatting for cleaner display
                description = description.replace(/[#*`]/g, '').trim();
            }

            // Get the best URL for applying to the job
            const jobUrl = job.final_url || job.url || job.source_url || '#';

            return {
                id: job.id?.toString() || Math.random().toString(),
                title: job.job_title || 'Título no disponible',
                company,
                location,
                salary,
                description,
                modality: getModality(job.job_title || '', job.description || ''),
                url: jobUrl,
            };
        } catch (jobError) {
            console.error('Error processing job:', jobError, job);
            return null;
        }
    }).filter(Boolean); // Remove null entries

    return { jobs };
}
