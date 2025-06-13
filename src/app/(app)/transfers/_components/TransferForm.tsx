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
import type { Transfer, Wallet } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { createTransfer } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Repeat } from 'lucide-react';


const transferFormSchema = z.object({
  fromWalletId: z.string().min(1, "Source wallet is required."),
  toWalletId: z.string().min(1, "Destination wallet is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  description: z.string().optional(),
}).refine(data => data.fromWalletId !== data.toWalletId, {
  message: "Source and destination wallets cannot be the same.",
  path: ["toWalletId"], // Or ["fromWalletId"]
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferFormProps {
  wallets: Wallet[];
}

export function TransferForm({ wallets }: TransferFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  async function onSubmit(data: TransferFormValues) {
    setIsSubmitting(true);
    try {
      const transferData = { ...data, createdAt: new Date() };
      const result = await createTransfer(transferData);
      if (result) {
        toast({
          title: 'Transfer Successful',
          description: `Successfully transferred ${data.amount} from wallet ID ${data.fromWalletId} to ${data.toWalletId}.`,
          variant: 'default', // Use accent for success
        });
        form.reset();
        router.refresh(); // Refresh the page to update transfer list
      } else {
        throw new Error('Failed to create transfer');
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
  
  if (wallets.length < 2) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/> New Transfer</CardTitle>
          <CardDescription>Move funds between your accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">You need at least two wallets to make a transfer.</p>
           <Button className="w-full" onClick={() => router.push('/wallets/new')}>Add Wallet</Button>
        </CardContent>
      </Card>
    )
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/> New Transfer</CardTitle>
        <CardDescription>Move funds between your accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fromWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select source wallet" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id} disabled={wallet.id === form.watch('toWalletId')}>
                          {wallet.name} ({wallet.currency})
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
              name="toWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select destination wallet" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id} disabled={wallet.id === form.watch('fromWalletId')}>
                          {wallet.name} ({wallet.currency})
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Monthly savings transfer" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Make Transfer'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
