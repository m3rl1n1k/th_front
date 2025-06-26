
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
import { devLog } from '@/lib/logger';

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
  devLog('Invoking supportChat flow with input:', JSON.stringify(input, null, 2));
  const result = await supportChatFlow(input);
  devLog('supportChat flow returned output:', JSON.stringify(result, null, 2));
  return result;
}


const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async ({ history, message, language }) => {
    
    const systemPrompt = `You are a friendly and helpful support agent for an application called "FinanceFlow". Your goal is to assist users with their questions about the application's features.

Here is a summary of the features available in FinanceFlow. Use this information to answer user questions accurately.

- **Dashboard**: Users can see a summary of their finances, including total balance, monthly income/expenses, and a chart of expenses by category. The dashboard is also customizable from the Settings page, allowing users to reorder, resize, and hide cards to personalize their view.
- **Transactions**: Users can add, edit, delete, and filter their income and expense transactions. They can also set up recurring transactions.
- **Wallets**: Users can create and manage multiple wallets (e.g., cash, bank account, credit card) to track where their money is.
- **Categories**: Users can create custom, hierarchical categories (main categories with sub-categories) with custom icons and colors to organize their transactions.
- **Budgets**: Users can set monthly spending budgets for different categories to track their spending against their goals.
- **Transfers**: Users can record transfers of money between their different wallets.
- **Capital Sharing**: Users can create a shared group to have visibility into the combined capital of invited family members or partners. You can explain how to create a group, invite users, and accept invitations.
- **Reports**: There is a "General Report" page where users can see financial statistics for a selected month and year.
- **Feedback**: Users can submit feedback, bug reports, or feature requests directly through the app's Feedback page.
- **Profile & Settings**: Users can update their profile information (username, email, preferred currency) and change their password. From the Settings page, they can also customize app settings like chart colors, records per page, and the dashboard layout. If a user's email is not verified, they can request a new verification link from the app.

**Important Rules:**
1.  **Stick to the facts**: Only talk about the features listed above. Do not make up features that do not exist.
2.  **AI Report Feature**: If asked about the "AI Report" page, politely inform the user that this feature is still under development and is coming soon.
3.  **No Financial Advice**: Do not give any financial advice, investment recommendations, or opinions on how users should manage their money. Your purpose is to explain how the app works.
4.  **Privacy First**: Never ask for personal or sensitive information like passwords, bank account numbers, or real financial data.
5.  **Language**: Please respond in the following language: ${language}.

Be concise and clear in your answers.`;
    
    const chatHistoryForPrompt = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

    const fullPrompt = `${systemPrompt}\n\n## Chat History:\n${chatHistoryForPrompt}\n\n## New User Message:\n${message}`;

    devLog('Full prompt being sent to AI model:\n', fullPrompt);

    const response = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: fullPrompt,
    });

    const textResponse = response.text || "Sorry, I couldn't generate a response. Please try again.";

    devLog('Raw text response from AI model:', textResponse);

    return { response: textResponse };
    }
);
