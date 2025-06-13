
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings } from '@/lib/definitions';
import { useRouter } from 'next/navigation';

const settingsFormSchema = z.object({
  transactionsPerPage: z.coerce
    .number()
    .int({ message: 'Must be a whole number.' })
    .positive({ message: 'Must be a positive number.' })
    .min(1, { message: 'Must be at least 1.' })
    .max(100, { message: 'Cannot exceed 100.' }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  initialSettings: UserSettings;
  onSubmitAction: (data: SettingsFormValues) => Promise<any>; // Can be more specific if needed
  translations: {
    transactionsPerPage: string;
    transactionsPerPageDescription: string;
    saveButton: string;
    successToastTitle: string;
    successToastDescription: string;
    errorToastTitle: string;
    errorToastDescription: string;
  };
}

export function SettingsForm({ initialSettings, onSubmitAction, translations }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      transactionsPerPage: initialSettings?.transactionsPerPage || 10,
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmitAction(data);
      toast({
        title: translations.successToastTitle,
        description: translations.successToastDescription,
      });
      router.refresh(); // Refresh to ensure settings are re-fetched if needed by other components
    } catch (error) {
      toast({
        title: translations.errorToastTitle,
        description: `${translations.errorToastDescription} ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        {/* Title and description are handled by PageHeader now */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="transactionsPerPage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.transactionsPerPage}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    {translations.transactionsPerPageDescription}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : translations.saveButton}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
