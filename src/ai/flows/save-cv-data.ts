
'use server';

/**
 * @fileOverview A flow to save or update worker and CV data to Supabase.
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
  id: z.number().optional(), // Include ID for updates
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
export async function saveCvData(input: SaveCvDataInput): Promise<{ success: boolean, cvId?: number }> {
  return saveCvDataFlow(input);
}

const saveCvDataFlow = ai.defineFlow(
  {
    name: 'saveCvDataFlow',
    inputSchema: SaveCvDataInputSchema,
    outputSchema: z.object({ success: z.boolean(), cvId: z.number().optional() }),
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
    const { error: workerError } = await supabase
      .from('workers')
      .upsert({
        id: userId,
        ...workerData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (workerError) {
      console.error('Error saving worker data:', workerError);
      throw new Error(`Failed to save worker data: ${workerError.message}`);
    }

    // 3. Upsert CV data and get the ID
    const { id: cvId, ...cvDataToSave } = cvData;
    const upsertData: any = {
        ...cvDataToSave,
        worker_id: userId,
    };
    if (cvId) {
        upsertData.id = cvId;
    }

    const { data: savedCv, error: cvError } = await supabase
      .from('cvs')
      .upsert(upsertData)
      .select('id')
      .single();

    if (cvError || !savedCv) {
      console.error('Error saving CV data:', cvError);
      throw new Error(`Failed to save CV data: ${cvError?.message || 'No data returned'}`);
    }
    
    const newCvId = savedCv.id;

    // 4. Clear old skills for this CV and insert new ones
    const { error: deleteError } = await supabase.from('skills').delete().eq('cv_id', newCvId);
    if (deleteError) {
        console.error('Error deleting old skills:', deleteError);
        // Not throwing error, as it might not be critical, but logging it.
    }
    
    const skillsToInsert = [
        ...(cvData.skills.tecnicas || []).map(skill => ({
            worker_id: userId,
            cv_id: newCvId,
            skill_name: skill,
            skill_type: 'tecnica'
        })),
        ...(cvData.skills.blandas || []).map(skill => ({
            worker_id: userId,
            cv_id: newCvId,
            skill_name: skill,
            skill_type: 'blanda'
        }))
    ];

    if (skillsToInsert.length > 0) {
        const { error: skillsError } = await supabase.from('skills').insert(skillsToInsert);
        if (skillsError) {
            console.error('Error saving skills:', skillsError);
            throw new Error(`Failed to save skills: ${skillsError.message}`);
        }
    }


    return { success: true, cvId: newCvId };
  }
);
