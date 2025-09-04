'use server';

/**
 * @fileOverview A flow to save worker and CV data to Supabase.
 * 
 * - saveCvData - A function that handles saving the data.
 * - SaveCvDataInput - The input type for the saveCvData function.
 */

import { ai } from '@/ai/genkit';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { z } from 'genkit';

// Define the schema for worker data
const WorkerDataSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().optional(),
  website_url: z.string().optional(),
  profile_pic_url: z.string().optional().nullable(),
});

// Define the schema for CV data, ensuring complex fields are typed correctly
const CvDataSchema = z.object({
  title: z.string(),
  professional_summary: z.string(),
  work_experience: z.array(z.object({
    puesto: z.string(),
    empresa: z.string(),
    fecha: z.string(),
    descripcion: z.string(),
  })),
  academic_background: z.array(z.object({
    titulo: z.string(),
    institucion: z.string(),
    fecha: z.string(),
  })),
  skills: z.object({
    tecnicas: z.array(z.string()),
    blandas: z.array(z.string()),
  }),
  languages: z.array(z.string()),
  certifications: z.array(z.string()),
  contact_info: z.object({
    email: z.string(),
    telefono: z.string(),
    ubicacion: z.string(),
    linkedin: z.string().optional(),
    sitio_web: z.string().optional(),
  }),
  style: z.string(),
});

// Define the input schema for the main flow
const SaveCvDataInputSchema = z.object({
  workerData: WorkerDataSchema,
  cvData: CvDataSchema,
});
export type SaveCvDataInput = z.infer<typeof SaveCvDataInputSchema>;

// Exported async function to be called from the client
export async function saveCvData(input: SaveCvDataInput): Promise<{ success: boolean }> {
  return saveCvDataFlow(input);
}

const saveCvDataFlow = ai.defineFlow(
  {
    name: 'saveCvDataFlow',
    inputSchema: SaveCvDataInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ workerData, cvData }) => {
    const supabase = await createSupabaseServerClient();
    // 1. Get the current authenticated user from Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated.');
    }
    const userId = user.id;

    // 2. Upsert worker data
    // This will insert a new row if one doesn't exist for the user,
    // or update the existing one if it does.
    const { error: workerError } = await supabase
      .from('workers')
      .upsert({
        id: userId,
        ...workerData,
        updated_at: new Date().toISOString(),
      });

    if (workerError) {
      console.error('Error saving worker data:', workerError);
      throw new Error(`Failed to save worker data: ${workerError.message}`);
    }

    // 3. Insert CV data
    // This will always create a new CV record linked to the worker.
    const { error: cvError } = await supabase
      .from('cvs')
      .insert({
        worker_id: userId,
        ...cvData,
      });

    if (cvError) {
      console.error('Error saving CV data:', cvError);
      throw new Error(`Failed to save CV data: ${cvError.message}`);
    }

    return { success: true };
  }
);
