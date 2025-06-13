
'use server';
/**
 * @fileOverview Handles submission of user feedback.
 *
 * - submitFeedback - A function that processes user feedback.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const feedbackTypes = ['Technical Issue', 'Error Report', 'Suggestion', 'General Feedback', 'Other'] as const;

export const SubmitFeedbackInputSchema = z.object({
  feedbackType: z.enum(feedbackTypes).describe('The type of feedback being submitted.'),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, {message: 'Subject cannot exceed 100 characters.'}).describe('A brief subject line for the feedback.'),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(1000, {message: 'Message cannot exceed 1000 characters.'}).describe('The detailed feedback message from the user.'),
  userEmail: z.string().email().optional().describe('The email of the user submitting feedback, if available.'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

export const SubmitFeedbackOutputSchema = z.object({
  confirmationMessage: z.string().describe('A message confirming receipt of the feedback.'),
  trackingId: z.string().describe('A unique tracking ID for the submitted feedback.'),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
  return submitFeedbackFlow(input);
}

const feedbackPrompt = ai.definePrompt({
  name: 'feedbackSubmissionPrompt',
  input: {schema: SubmitFeedbackInputSchema},
  output: {schema: SubmitFeedbackOutputSchema},
  prompt: `
You have received new user feedback.
User Email (if provided): {{userEmail}}
Feedback Type: {{feedbackType}}
Subject: {{subject}}
Message:
{{{message}}}

Acknowledge receipt of this feedback. Provide a polite confirmation message for the user.
Generate a unique mock tracking ID for this feedback (e.g., FBK- followed by 8 random alphanumeric characters).
Return the confirmation message and the tracking ID.
`,
});

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async (input) => {
    // In a real scenario, you might save the feedback to a database here,
    // send notifications, or integrate with a ticketing system.
    // For now, we directly call the prompt.

    const {output} = await feedbackPrompt(input);

    if (!output) {
      // Fallback if the prompt fails to generate structured output as expected
      console.error('Feedback prompt did not return structured output.');
      return {
        confirmationMessage: 'Thank you for your feedback! We have received it.',
        trackingId: `FBK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
    }
    
    return output;
  }
);
