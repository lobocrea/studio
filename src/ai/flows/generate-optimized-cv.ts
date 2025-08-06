'use server';

/**
 * @fileOverview A flow to generate an optimized CV for the Spanish job market.
 *
 * - generateOptimizedCv - A function that generates the optimized CV.
 * - GenerateOptimizedCvInput - The input type for the generateOptimizedCv function.
 * - GenerateOptimizedCvOutput - The return type for the generateOptimizedCv function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimizedCvInputSchema = z.object({
  extractedData: z.string().describe('The extracted CV data in JSON format.'),
  contactData: z.object({
    email: z.string().optional(),
    telefono: z.string().optional(),
    ubicacion: z.string().optional(),
    linkedin: z.string().optional(),
    sitio_web: z.string().optional(),
  }).describe('The contact information.'),
  style: z.enum(['Minimalist', 'Modern', 'Classic']).describe('The chosen CV style.'),
});
export type GenerateOptimizedCvInput = z.infer<typeof GenerateOptimizedCvInputSchema>;

const GenerateOptimizedCvOutputSchema = z.object({
  title: z.string().describe("The user's professional title."),
  resumen_profesional: z.string().describe('Professional summary.'),
  experiencia_laboral: z.array(z.object({
    puesto: z.string(),
    empresa: z.string(),
    fecha: z.string(),
    descripcion: z.string(),
  })).describe('Work experience.'),
  formacion_academica: z.array(z.object({
    titulo: z.string(),
    institucion: z.string(),
    fecha: z.string(),
  })).describe('Academic background.'),
  habilidades: z.object({
    tecnicas: z.array(z.string()).describe('Technical skills.'),
    blandas: z.array(z.string()).describe('Soft skills.'),
  }).describe('Skills.'),
  idiomas: z.array(z.string()).describe('Languages.'),
  certificaciones: z.array(z.string()).describe('Certifications.'),
  contacto: z.object({
    email: z.string(),
    telefono: z.string(),
    ubicacion: z.string(),
    linkedin: z.string().optional(),
    sitio_web: z.string().optional(),
  }).describe('Contact information.'),
});
export type GenerateOptimizedCvOutput = z.infer<typeof GenerateOptimizedCvOutputSchema>;

export async function generateOptimizedCv(input: GenerateOptimizedCvInput): Promise<GenerateOptimizedCvOutput> {
  return generateOptimizedCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedCvPrompt',
  input: {schema: z.object({
    extractedData: z.string(),
    contactData: z.string(),
    style: z.enum(['Minimalist', 'Modern', 'Classic']),
  })},
  output: {schema: GenerateOptimizedCvOutputSchema},
  prompt: `You are an AI expert in creating optimized CVs for the Spanish job market.

  Based on the extracted data, contact information, and the chosen style, generate a new CV.
  The CV should be optimized for the Spanish job market.

  Extracted Data: {{{extractedData}}}
  Contact Data: {{{contactData}}}
  Style: {{{style}}}

  - From the professional summary, extract a short, professional title.
  - For work experience, structure each entry with position, company, dates, and a description of achievements.
  - For academic background, structure each entry with degree, institution, and dates.
  - Use the provided contact information (email, phone, location, linkedin, website).
  - Make sure the generated CV is well-structured, easy to read, and highlights the candidate's strengths.
  - Focus on accomplishments and quantify them whenever possible.
  - Use action verbs and tailor the content to the Spanish job market standards.
  - Avoid using first-person pronouns.
  - Write it in Spanish.
  - Return a JSON object with the specified output schema. The 'contacto' field in the output must be populated with the provided contact data.
  `,
});

const generateOptimizedCvFlow = ai.defineFlow(
  {
    name: 'generateOptimizedCvFlow',
    inputSchema: GenerateOptimizedCvInputSchema,
    outputSchema: GenerateOptimizedCvOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      ...input,
      contactData: JSON.stringify(input.contactData),
    });
    // Ensure contact info is passed through, sometimes the LLM might forget it.
    const finalOutput = output!;
    finalOutput.contacto.email = input.contactData.email || finalOutput.contacto.email || '';
    finalOutput.contacto.telefono = input.contactData.telefono || finalOutput.contacto.telefono || '';
    finalOutput.contacto.ubicacion = input.contactData.ubicacion || finalOutput.contacto.ubicacion || '';
    finalOutput.contacto.linkedin = input.contactData.linkedin || finalOutput.contacto.linkedin;
    finalOutput.contacto.sitio_web = input.contactData.sitio_web || finalOutput.contacto.sitio_web;
    return finalOutput;
  }
);
