
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback, type SubmitFeedbackInput } from '@/ai/flows/submit-feedback-flow'; // Removed SubmitFeedbackInputSchema and feedbackTypes from import
import type { User } from '@/lib/definitions';

// Define feedbackTypes locally or import from a shared non-server file
const feedbackTypes = ['Technical Issue', 'Error Report', 'Suggestion', 'General Feedback', 'Other'] as const;

// Define SubmitFeedbackInputSchema locally or import from a shared non-server file
const SubmitFeedbackInputSchemaForForm = z.object({
  feedbackType: z.enum(feedbackTypes).describe('The type of feedback being submitted.'),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, {message: 'Subject cannot exceed 100 characters.'}).describe('A brief subject line for the feedback.'),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(1000, {message: 'Message cannot exceed 1000 characters.'}).describe('The detailed feedback message from the user.'),
  userEmail: z.string().email().optional().describe('The email of the user submitting feedback, if available.'),
});


interface FeedbackFormProps {
  translations: any; // From feedbackPage namespace
  currentUserEmail?: string | null;
}

type FeedbackFormValues = z.infer<typeof SubmitFeedbackInputSchemaForForm>;

export function FeedbackForm({ translations, currentUserEmail }: FeedbackFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(SubmitFeedbackInputSchemaForForm),
    defaultValues: {
      feedbackType: undefined,
      subject: '',
      message: '',
      userEmail: currentUserEmail || undefined,
    },
  });

  async function onSubmit(data: FeedbackFormValues) {
    setIsSubmitting(true);
    try {
      // We use SubmitFeedbackInput type for the server action, which is still exported
      const result = await submitFeedback(data as SubmitFeedbackInput);
      toast({
        title: translations.successToastTitle,
        description: `${result.confirmationMessage} (ID: ${result.trackingId})`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: translations.errorToastTitle,
        description: translations.errorToastDescription.replace('{error}', error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        {/* Title and description are handled by PageHeader */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.typeLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={translations.typePlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feedbackTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {translations.feedbackTypes?.[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.subjectLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={translations.subjectPlaceholder} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.messageLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={translations.messagePlaceholder}
                      {...field}
                      rows={6}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {currentUserEmail && (
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem className="hidden"> {/* Hidden field, value set in defaultValues */}
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}


            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? translations.submittingButton : translations.submitButton}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
