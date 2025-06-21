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
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SupportChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The chat history between the user and the model.'),
  message: z.string().describe('The latest message from the user.'),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

export const SupportChatOutputSchema = z.object({
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
  async ({ history, message }) => {
    
    const systemPrompt = `You are a friendly and helpful support agent for an application called "FinanceFlow". Your goal is to assist users with their questions about the application. Do not make up features that do not exist. Be concise and clear in your answers.`;
    
    const { output } = await ai.generate({
      prompt: message,
      history: history,
      system: systemPrompt,
    });

    const textResponse = output ? output.text : "Sorry, I couldn't generate a response. Please try again.";
    
    return { response: textResponse! };
  }
);
