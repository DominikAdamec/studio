import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Configure Genkit to use Google AI.
// It will automatically use Application Default Credentials to authenticate.
// For Vertex AI, ensure GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are set
// in your environment, or specify the location here.
export const ai = genkit({
  plugins: [
    googleAI({
      // us-central1 is a common region for Vertex AI services.
      location: 'us-central1',
    }),
  ],
  // Default model for text generation
  model: 'googleai/gemini-2.0-flash',
});
