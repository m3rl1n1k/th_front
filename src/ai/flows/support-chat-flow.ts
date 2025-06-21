
'use server';
/**
 * @fileOverview A support chat flow using Genkit.
 *
 * - supportChat - A function that handles the support chat interaction.
 * - SupportChatInput - The input type for the supportChat function.
 * - SupportChatOutput - The return type for the supportChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const SupportChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The chat history between the user and the model.'),
  message: z.string().describe('The latest message from the user.'),
  language: z.string().describe('The language for the AI to respond in (e.g., "en", "uk").'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

const SupportChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user.'),
});
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;


export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}


const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async ({ history, message, language }) => {
    
    const systemPrompt = `You are a friendly and helpful support agent for an application called "FinanceFlow". Your goal is to assist users with their questions about the application. Do not make up features that do not exist. Be concise and clear in your answers. Please respond in the following language: ${language}.`;
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: message,
      history: history,
      system: systemPrompt,
    });

    const textResponse = response.text || "Sorry, I couldn't generate a response. Please try again.";
    
    return { response: textResponse };
  }
);
