'use server';

/**
 * @fileOverview A CV data extraction AI agent.
 *
 * - extractCvData - A function that handles the CV data extraction process.
 * - ExtractCvDataInput - The input type for the extractCvData function.
 * - ExtractCvDataOutput - The return type for the extractCvData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const ExtractCvDataInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A CV in PDF format, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ExtractCvDataInput = z.infer<typeof ExtractCvDataInputSchema>;

const ExtractCvDataOutputSchema = z.object({
  fullName: z.string().describe('The full name of the candidate.'),
  telefono: z.string().optional().describe('The phone number of the candidate.'),
  ubicacion: z.string().optional().describe('The location (city, country) of the candidate.'),
  resumen_profesional: z.string().describe('Professional summary.'),
  experiencia_laboral: z.array(z.string()).describe('Work experience.'),
  formacion_academica: z.array(z.string()).describe('Academic background.'),
  habilidades: z.object({
    tecnicas: z.array(z.string()).describe('Technical skills.'),
    blandas: z.array(z.string()).describe('Soft skills.'),
  }).describe('Skills.'),
  idiomas: z.array(z.string()).describe('Languages.'),
  certificaciones: z.array(z.string()).describe('Certifications.'),
});
export type ExtractCvDataOutput = z.infer<typeof ExtractCvDataOutputSchema>;

export async function extractCvData(input: ExtractCvDataInput): Promise<ExtractCvDataOutput> {
  return extractCvDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractCvDataPrompt',
  input: {schema: ExtractCvDataInputSchema},
  output: {schema: ExtractCvDataOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert in extracting data from CVs and summarizing it for the Spanish job market.

  Read the content of the CV and extract the following information:
  - Full Name (fullName).
  - Phone Number (telefono).
  - Location (ubicacion).
  - Resumen profesional (replace "Perfil profesional" with Resumen profesional).
  - Experiencia laboral.
  - Formación académica.
  - Habilidades (técnicas y blandas).
  - Idiomas.
  - Certificaciones.

  Summarize each section to ensure the content is concise and well-organized. The total length should not exceed the equivalent of two A4 pages.

  Return the data in a JSON object with the specified structure.

  CV Content: {{media url=pdfDataUri}}
  `,
});

const extractCvDataFlow = ai.defineFlow(
  {
    name: 'extractCvDataFlow',
    inputSchema: ExtractCvDataInputSchema,
    outputSchema: ExtractCvDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
