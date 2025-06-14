
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionType, TransactionFrequency, Wallet, SubCategory, MainCategory } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const transactionFrequencies: TransactionFrequency[] = ['One-time', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const NO_CATEGORY_VALUE = "_NONE_"; 

const transactionFormSchema = z.object({
  subCategoryId: z.string().optional(),
  walletId: z.string().min(1, { message: 'Wallet is required.' }),
  type: z.enum(['Income', 'Expense'] as [TransactionType, ...TransactionType[]], { required_error: 'Transaction type is required.' }),
  frequency: z.enum(transactionFrequencies as [TransactionFrequency, ...TransactionFrequency[]], { required_error: 'Frequency is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  createdAt: z.date({ required_error: 'Date is required.' }),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  initialData?: Transaction | null;
  onSubmitAction: (data: TransactionFormValues) => Promise<Transaction | null>;
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  defaultWalletId?: string;
  availableTransactionTypes: Array<{ key: TransactionType; label: string; }>;
  translations: { // Added translations prop
    typeLabel: string;
    amountLabel: string;
    categoryLabel: string;
    walletLabel: string;
    dateLabel: string;
    frequencyLabel: string;
    descriptionLabel: string;
    typePlaceholder: string;
    amountPlaceholder: string;
    categoryPlaceholder: string;
    walletPlaceholder: string;
    datePlaceholder: string;
    frequencyPlaceholder: string;
    descriptionPlaceholder: string;
    noCategoryOption: string;
    unassignedSubCategoriesHeader: string;
    cancelButton: string;
    savingButton: string;
    creatingButton: string;
    saveChangesButton: string;
    createButton: string;
    successUpdateToastTitle: string;
    successCreateToastTitle: string;
    successToastDescription: string; // Expects {amount} and {action}
    errorToastTitle: string;
    errorToastDescription: string; // Expects {error}
    errorFallbackDescription: string;
    frequencyTypes: Record<TransactionFrequency, string>;
  };
}

export function TransactionForm({
  initialData,
  onSubmitAction,
  wallets,
  subCategories,
  mainCategories,
  defaultWalletId,
  availableTransactionTypes,
  translations, // Destructure translations
}: TransactionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          subCategoryId: initialData.subCategoryId === undefined || initialData.subCategoryId === null ? NO_CATEGORY_VALUE : initialData.subCategoryId,
          createdAt: new Date(initialData.createdAt),
        }
      : {
          type: availableTransactionTypes.find(item => item.key === 'Expense') 
                ? 'Expense' 
                : (availableTransactionTypes.length > 0 ? availableTransactionTypes[0].key : undefined),
          frequency: 'One-time',
          createdAt: new Date(),
          amount: 0,
          description: '',
          subCategoryId: NO_CATEGORY_VALUE,
          walletId: defaultWalletId, 
        },
  });

  async function onSubmit(data: TransactionFormValues) {
    setIsSubmitting(true);
    const payload = {
      ...data,
      subCategoryId: data.subCategoryId === NO_CATEGORY_VALUE ? undefined : data.subCategoryId,
    };
    try {
      const result = await onSubmitAction(payload);
      if (result) {
        toast({
          title: initialData ? translations.successUpdateToastTitle : translations.successCreateToastTitle,
          description: translations.successToastDescription
            .replace('{amount}', payload.amount.toString())
            .replace('{action}', initialData ? 'updated' : 'created'),
        });
        router.push('/transactions');
        router.refresh();
      } else {
        throw new Error(translations.errorFallbackDescription);
      }
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
        {/* Title is handled by PageHeader in parent page */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.typeLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={translations.typePlaceholder} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTransactionTypes.map(({ key, label }) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.amountLabel}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={translations.amountPlaceholder} {...field} disabled={isSubmitting} className="text-sm"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.categoryLabel}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || NO_CATEGORY_VALUE} 
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={translations.categoryPlaceholder} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY_VALUE}>{translations.noCategoryOption}</SelectItem>
                      {mainCategories.map(mc => (
                        <React.Fragment key={mc.id}>
                          <SelectItem value={mc.id} disabled className="font-bold text-muted-foreground">{mc.name}</SelectItem>
                          {subCategories.filter(sc => sc.mainCategoryId === mc.id).map(sc => (
                            <SelectItem key={sc.id} value={sc.id} className="pl-6">{sc.name}</SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                       {subCategories.filter(sc => !mainCategories.some(mc => mc.id === sc.mainCategoryId)).length > 0 && (
                         <React.Fragment>
                            <SelectItem value="unassigned-header" disabled className="font-bold text-muted-foreground">{translations.unassignedSubCategoriesHeader}</SelectItem>
                             {subCategories.filter(sc => !mainCategories.some(mc => mc.id === sc.mainCategoryId)).map((sc) => (
                                <SelectItem key={sc.id} value={sc.id} className="pl-6">{sc.name}</SelectItem>
                             ))}
                         </React.Fragment>
                       )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.walletLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={translations.walletPlaceholder} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => <SelectItem key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.currency})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.dateLabel}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            disabled={isSubmitting}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>{translations.datePlaceholder}</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1900-01-01") || isSubmitting} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.frequencyLabel}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={translations.frequencyPlaceholder} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactionFrequencies.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {translations.frequencyTypes?.[freq] || freq}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={translations.descriptionPlaceholder} {...field} disabled={isSubmitting} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                {translations.cancelButton}
              </Button>
              <Button type="submit" disabled={isSubmitting || wallets.length === 0}>
                {isSubmitting ? (initialData ? translations.savingButton : translations.creatingButton) : (initialData ? translations.saveChangesButton : translations.createButton)}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
