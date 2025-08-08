'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Pasa la API Key explícitamente si está disponible en las variables de entorno.
      // Esto es crucial para los entornos de despliegue como Vercel.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
