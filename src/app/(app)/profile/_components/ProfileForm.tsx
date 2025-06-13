
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
import type { User, UserSettings } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserSettings } from '@/lib/actions'; // For updating currency

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']; // Consistent currency list

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, {message: 'Name cannot exceed 50 characters.'}),
  email: z.string().email(), // Keep email for display
  defaultCurrency: z.string().min(3, { message: 'Default currency is required.' }),
});

type ProfileFormValues = Pick<z.infer<typeof profileFormSchema>, 'name'>;
type SettingsFormValues = Pick<z.infer<typeof profileFormSchema>, 'defaultCurrency'>;


interface ProfileFormProps {
  initialData: User;
  initialSettings: UserSettings | undefined;
  onSubmitUserAction: (data: ProfileFormValues) => Promise<User | null>;
  onSubmitSettingsAction: (data: SettingsFormValues) => Promise<User | null>; // User is returned by updateUserSettings
  translations: {
    profileDetailsTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    defaultCurrencyLabel: string;
    defaultCurrencyPlaceholder: string;
    saveButton: string;
    successToastTitle: string;
    successToastDescription: string;
    errorToastTitle: string;
    errorToastDescription: string;
  };
}

export function ProfileForm({ 
  initialData, 
  initialSettings,
  onSubmitUserAction, 
  onSubmitSettingsAction, 
  translations 
}: ProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues & SettingsFormValues & { email: string }>({ 
    resolver: zodResolver(profileFormSchema.pick({ name: true, defaultCurrency: true })), 
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      defaultCurrency: initialSettings?.defaultCurrency || 'USD',
    },
  });

  async function onSubmit(data: ProfileFormValues & SettingsFormValues) {
    setIsSubmitting(true);
    try {
      // Submit name change
      const userResult = await onSubmitUserAction({ name: data.name });
      
      // Submit currency setting change
      const settingsResult = await onSubmitSettingsAction({ defaultCurrency: data.defaultCurrency });

      if (userResult && settingsResult) {
        toast({
          title: translations.successToastTitle,
          description: translations.successToastDescription,
        });
        router.refresh(); 
      } else {
        let errorMessages = [];
        if (!userResult) errorMessages.push("Failed to update name.");
        if (!settingsResult) errorMessages.push("Failed to update currency.");
        throw new Error(errorMessages.join(' '));
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
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{translations.profileDetailsTitle}</CardTitle>
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

            <FormField
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.defaultCurrencyLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={translations.defaultCurrencyPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
