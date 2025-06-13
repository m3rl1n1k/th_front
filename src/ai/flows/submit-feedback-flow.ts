
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
import { MOCK_DB } from '@/lib/actions'; // Import MOCK_DB
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

const feedbackPrompt = ai.definePrompt({
  name: 'feedbackSubmissionPrompt',
  input: {schema: SubmitFeedbackInputSchema},
  // Output schema for the prompt still provides a trackingId for the user message
  output: {schema:  z.object({
    confirmationMessage: z.string().describe('A message confirming receipt of the feedback.'),
    trackingId: z.string().describe('A unique tracking ID for the submitted feedback for user display.'),
  })},
  prompt: `
You have received new user feedback.
User Email (if provided): {{userEmail}}
Feedback Type: {{feedbackType}}
Subject: {{subject}}
Message:
{{{message}}}

Acknowledge receipt of this feedback. Provide a polite confirmation message for the user.
Generate a unique mock tracking ID for this feedback (e.g., FBK- followed by 8 random alphanumeric characters) for the user to reference.
Return the confirmation message and the tracking ID.
`,
});

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema, // Use the extended output schema
  },
  async (input) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated to submit feedback.");
    }

    const {output: promptOutput} = await feedbackPrompt(input);

    if (!promptOutput) {
      console.error('Feedback prompt did not return structured output.');
      // Still attempt to save feedback even if prompt fails partially
      const newFeedbackIdOnError = `FBK-ERR-${Date.now()}`;
      const feedbackToStoreOnError: FeedbackItem = {
        id: newFeedbackIdOnError,
        userId: currentUser.id,
        feedbackType: input.feedbackType,
        subject: input.subject,
        message: input.message,
        userEmail: input.userEmail,
        status: 'pending' as FeedbackStatus,
        createdAt: new Date(),
      };
      MOCK_DB.feedbacks.push(feedbackToStoreOnError);

      return {
        confirmationMessage: 'Thank you for your feedback! We have received it, though there was a hiccup generating a tracking ID.',
        trackingId: 'N/A',
        feedbackId: newFeedbackIdOnError,
      };
    }
    
    // Store the feedback in MOCK_DB
    const newFeedbackId = `FBK-${Date.now()}`; // System-generated ID for storage
    const feedbackToStore: FeedbackItem = {
      id: newFeedbackId,
      userId: currentUser.id,
      feedbackType: input.feedbackType,
      subject: input.subject,
      message: input.message,
      userEmail: input.userEmail,
      status: 'pending' as FeedbackStatus, // Default status
      createdAt: new Date(),
    };
    MOCK_DB.feedbacks.push(feedbackToStore);
    console.log('Feedback stored:', feedbackToStore); // For debugging
    
    return {
      confirmationMessage: promptOutput.confirmationMessage,
      trackingId: promptOutput.trackingId, // This is the one from the LLM for user display
      feedbackId: newFeedbackId, // This is the internal ID
    };
  }
);
