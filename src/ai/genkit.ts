
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY) {
  const errorMessage = 'CRITICAL SERVER STARTUP ERROR: GOOGLE_API_KEY environment variable is not set. Genkit GoogleAI plugin cannot be initialized. Please set this variable in your server environment (e.g., .env.local for development). AI features will not work.';
  console.error("***********************************************************************************");
  console.error(errorMessage);
  console.error("***********************************************************************************");
  // This throw will likely stop the server or cause the module to fail loading,
  // making the root cause very clear in the server logs.
  throw new Error(errorMessage);
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

