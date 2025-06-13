
'use client';

import React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/definitions';
import { useRouter } from 'next/navigation';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, {message: 'Name cannot exceed 50 characters.'}),
  email: z.string().email(), // Keep email for display, but it won't be submitted for change
});

type ProfileFormValues = Pick<z.infer<typeof profileFormSchema>, 'name'>; // Only 'name' is updatable here

interface ProfileFormProps {
  initialData: User;
  onSubmitAction: (data: ProfileFormValues) => Promise<User | null>;
  translations: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    saveButton: string;
    successToastTitle: string;
    successToastDescription: string;
    errorToastTitle: string;
    errorToastDescription: string;
  };
}

export function ProfileForm({ initialData, onSubmitAction, translations }: ProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues & { email: string }>({ // Include email for defaultValues
    resolver: zodResolver(profileFormSchema.pick({ name: true })), // Validate only name
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction({ name: data.name });
      if (result) {
        toast({
          title: translations.successToastTitle,
          description: translations.successToastDescription,
        });
        router.refresh(); // Refresh to ensure data is up-to-date across the app
      } else {
        throw new Error('Failed to update profile.');
      }
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
        {/* Title and description handled by PageHeader */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.nameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={translations.namePlaceholder} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{translations.emailLabel}</FormLabel>
              <FormControl>
                <Input type="email" value={initialData.email} disabled readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
            

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
