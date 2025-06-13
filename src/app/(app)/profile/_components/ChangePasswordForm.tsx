
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { changePassword } from '@/lib/actions'; 
import type { User } from '@/lib/definitions';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword'], // Point error to confirmPassword field
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ChangePasswordFormProps {
  currentUser: User; // To pass userId to the action
  translations: {
    changePasswordTitle: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    changePasswordButton: string;
    successPasswordToastTitle: string;
    successPasswordToastDescription: string;
    errorPasswordToastTitle: string;
    errorPasswordToastDescription: string;
  };
}

export function ChangePasswordForm({ currentUser, translations }: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await changePassword(currentUser.id, data.currentPassword, data.newPassword);
      if (result.success) {
        toast({
          title: translations.successPasswordToastTitle,
          description: result.message || translations.successPasswordToastDescription,
        });
        form.reset(); 
      } else {
        throw new Error(result.message || 'Failed to change password.');
      }
    } catch (error) {
      toast({
        title: translations.errorPasswordToastTitle,
        description: `${translations.errorPasswordToastDescription} ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{translations.changePasswordTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.currentPasswordLabel}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={translations.currentPasswordPlaceholder} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.newPasswordLabel}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={translations.newPasswordPlaceholder} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.confirmPasswordLabel}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={translations.confirmPasswordPlaceholder} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : translations.changePasswordButton}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
