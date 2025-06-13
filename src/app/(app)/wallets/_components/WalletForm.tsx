
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Wallet, WalletType } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { walletIconNames, type WalletIconName } from '@/lib/icon-names';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import * as LucideIcons from 'lucide-react';

const walletTypes: WalletType[] = ['Cash', 'Bank Account', 'Credit Card', 'E-Wallet'];
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']; // Add more as needed

const walletFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  currency: z.string().min(3, { message: 'Currency must be selected.' }),
  initialAmount: z.coerce.number().min(0, { message: 'Amount must be non-negative.' }),
  type: z.enum(walletTypes as [WalletType, ...WalletType[]], { required_error: 'Wallet type is required.' }),
  icon: z.string().optional(), // Allow any string, or use z.enum(walletIconNames) for strictness
});

type WalletFormValues = z.infer<typeof walletFormSchema>;

interface WalletFormProps {
  initialData?: Wallet | null;
  onSubmitAction: (data: WalletFormValues) => Promise<Wallet | null>;
}

export function WalletForm({ initialData, onSubmitAction }: WalletFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          currency: initialData.currency,
          initialAmount: initialData.initialAmount,
          type: initialData.type,
          icon: initialData.icon || undefined,
        }
      : {
          name: '',
          currency: 'USD',
          initialAmount: 0,
          type: undefined,
          icon: walletIconNames[0], // Default to the first icon in the list
        },
  });

  async function onSubmit(data: WalletFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(data);
      if (result) {
        toast({
          title: initialData ? 'Wallet Updated' : 'Wallet Created',
          description: `Wallet "${result.name}" has been successfully ${initialData ? 'updated' : 'created'}.`,
        });
        router.push('/wallets');
        router.refresh(); // Ensure the list is updated
      } else {
        throw new Error('Failed to save wallet');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{initialData ? 'Edit Wallet' : 'Create New Wallet'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Savings Account, Emergency Fund" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select wallet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {walletTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
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
            </div>
            
            <FormField
              control={form.control}
              name="initialAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          {field.value && LucideIcons[field.value as WalletIconName] && (
                            <DynamicIcon name={field.value as WalletIconName} className="h-4 w-4" />
                          )}
                          <SelectValue placeholder="Select an icon" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {walletIconNames.map((iconName) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <DynamicIcon name={iconName} className="h-4 w-4" />
                            {iconName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Wallet')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
