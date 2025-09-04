'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-optimized-cv.ts';
import '@/ai/flows/extract-cv-data.ts';
import '@/ai/flows/save-cv-data.ts';
import '@/ai/flows/find-job-offers.ts';
import '@/ai/flows/test-theirstack-api.ts';
