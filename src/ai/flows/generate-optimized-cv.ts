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
  style: z.enum(['Minimalist', 'Modern', 'Classic']).describe('The chosen CV style.'),
});
export type GenerateOptimizedCvInput = z.infer<typeof GenerateOptimizedCvInputSchema>;

const GenerateOptimizedCvOutputSchema = z.object({
  optimizedCvText: z.string().describe('The optimized CV in text format.'),
});
export type GenerateOptimizedCvOutput = z.infer<typeof GenerateOptimizedCvOutputSchema>;

export async function generateOptimizedCv(input: GenerateOptimizedCvInput): Promise<GenerateOptimizedCvOutput> {
  return generateOptimizedCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedCvPrompt',
  input: {schema: GenerateOptimizedCvInputSchema},
  output: {schema: GenerateOptimizedCvOutputSchema},
  prompt: `You are an AI expert in creating optimized CVs for the Spanish job market.

  Based on the extracted data and the chosen style, generate a new CV in text format.
  The CV should be optimized for the Spanish job market.

  Extracted Data: {{{extractedData}}}
  Style: {{{style}}}

  Make sure the generated CV is well-structured, easy to read, and highlights the candidate's strengths.
  Focus on accomplishments and quantify them whenever possible.
  Use action verbs and tailor the content to the Spanish job market standards.
  Avoid using first-person pronouns.
  Write it in spanish.
  Include these sections:
  - Resumen profesional
  - Experiencia laboral
  - Formación académica
  - Habilidades
  - Idiomas
  - Certificaciones
  `,
});

const generateOptimizedCvFlow = ai.defineFlow(
  {
    name: 'generateOptimizedCvFlow',
    inputSchema: GenerateOptimizedCvInputSchema,
    outputSchema: GenerateOptimizedCvOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
