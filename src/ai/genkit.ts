import {genkit, defineModel} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const gemini15Flash = defineModel(
  {
    name: 'google/gemini-1.5-flash',
    label: 'Google - Gemini 1.5 Flash',
    supports: {
      media: true,
      multiturn: true,
      tools: true,
      systemRole: true,
      output: ['text', 'json'],
    },
  },
  async (request) => {
    // This is where you would call the model's API.
    // For this example, we're returning a static response.
    return {
      candidates: [
        {
          index: 0,
          finishReason: 'stop',
          message: {
            role: 'model',
            content: [{ text: 'This is a static response.' }],
          },
        },
      ],
    };
  }
);

export const ai = genkit({
  plugins: [googleAI()],
  models: [gemini15Flash],
});
