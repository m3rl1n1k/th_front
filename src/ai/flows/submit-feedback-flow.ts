
'use server';
/**
 * @fileOverview Handles submission of user feedback and stores it.
 *
 * - submitFeedback - A function that processes user feedback.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { addFeedback } from '@/lib/actions'; // Import the new server action
import type { FeedbackItem, FeedbackStatus, FeedbackType } from '@/lib/definitions'; // Import necessary types
import { getCurrentUser } from '@/lib/auth';

// feedbackTypes is already exported from definitions.ts
// SubmitFeedbackInputSchema is defined locally in FeedbackForm.tsx

// Use FeedbackType from definitions
const SubmitFeedbackInputSchema = z.object({
  feedbackType: z.custom<FeedbackType>((val) => {
    const feedbackTypesArray: FeedbackType[] = ['Technical Issue', 'Error Report', 'Suggestion', 'General Feedback', 'Other'];
    return feedbackTypesArray.includes(val as FeedbackType);
  }).describe('The type of feedback being submitted.'),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, {message: 'Subject cannot exceed 100 characters.'}).describe('A brief subject line for the feedback.'),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(1000, {message: 'Message cannot exceed 1000 characters.'}).describe('The detailed feedback message from the user.'),
  userEmail: z.string().email().optional().describe('The email of the user submitting feedback, if available.'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;


const SubmitFeedbackOutputSchema = z.object({
  confirmationMessage: z.string().describe('A message confirming receipt of the feedback.'),
  trackingId: z.string().describe('A unique tracking ID for the submitted feedback (for user display).'),
  feedbackId: z.string().describe('The internal ID of the stored feedback.'),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
  return submitFeedbackFlow(input);
}

// Removed the LLM prompt for feedback submission.
// const feedbackPrompt = ai.definePrompt({ ... });

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async (input) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated to submit feedback.");
    }

    // Generate confirmation message and tracking ID directly
    const confirmationMessage = `Thank you for your feedback regarding "${input.subject}". We have received it and will review it shortly.`;
    const trackingId = `FBK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

    let storedFeedback: FeedbackItem;

    try {
      // Call the server action to store feedback
      storedFeedback = await addFeedback({
        feedbackType: input.feedbackType,
        subject: input.subject,
        message: input.message,
        userEmail: input.userEmail,
      });
    } catch (error) {
      console.error('Error storing feedback via action:', error);
      // Handle error case
      return {
        confirmationMessage: 'Thank you for your feedback! We have received it, but there was an issue with internal processing.',
        trackingId: trackingId || 'N/A', // Use generated trackingId
        feedbackId: 'ERROR_STORING', // Indicate an error
      };
    }
        
    return {
      confirmationMessage: confirmationMessage,
      trackingId: trackingId, 
      feedbackId: storedFeedback.id,
    };
  }
);
