
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/auth-context';
import { getTransferFormData, getTransfersList, createTransfer, deleteTransfer } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { TransferUserWallet, TransferListItem, CreateTransferPayload } from '@/types';
import { ArrowRightLeft, Landmark, Trash2, Loader2, AlertTriangle, PlusCircle, RefreshCw } from 'lucide-react';
import { CurrencyDisplay } from '@/components/common/currency-display';

const createTransferFormSchema = (t: Function) => z.object({
  outcomeWalletId: z.string().min(1, { message: t('transferOutcomeWalletRequired') }),
  amount: z.coerce.number().positive({ message: t('transferAmountPositiveError') }),
  incomeWalletId: z.string().min(1, { message: t('transferIncomeWalletRequired') }),
}).refine(data => data.outcomeWalletId !== data.incomeWalletId, {
  message: t('transferWalletsMustBeDifferentError'),
  path: ["incomeWalletId"],
});

type TransferFormData = z.infer<ReturnType<typeof createTransferFormSchema>>;

export default function TransfersPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();

  const [userWallets, setUserWallets] = useState<TransferUserWallet[]>([]);
  const [capitalWalletsGrouped, setCapitalWalletsGrouped] = useState<Record<string, TransferUserWallet[]>>({});
  const [transfersList, setTransfersList] = useState<TransferListItem[]>([]);

  const [isLoadingFormData, setIsLoadingFormData] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState<TransferListItem | null>(null);

  const TransferFormSchema = createTransferFormSchema(t);

  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm<TransferFormData>({
    resolver: zodResolver(TransferFormSchema),
    defaultValues: {
      outcomeWalletId: '',
      amount: undefined,
      incomeWalletId: '',
    },
  });

  const selectedOutcomeWalletId = watch('outcomeWalletId');

  const amountInputCurrencyCode = useMemo(() => {
    let foundCurrency: string | undefined = undefined;
    if (selectedOutcomeWalletId) {
        const outcomeWallet = userWallets.find(w => String(w.id) === selectedOutcomeWalletId);
        if (outcomeWallet) {
            foundCurrency = outcomeWallet.currency.code;
        }
    }
    return foundCurrency || user?.userCurrency?.code || 'USD';
  }, [selectedOutcomeWalletId, userWallets, user]);


  const fetchFormData = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setIsLoadingFormData(true);
    try {
      const data = await getTransferFormData(token);
      setUserWallets(data.user_wallets || []);
      setCapitalWalletsGrouped(data.capital_wallets || {});
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
    } finally {
      setIsLoadingFormData(false);
    }
  }, [isAuthenticated, token, toast, t]);

  const fetchTransfers = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setIsLoadingTransfers(true);
    try {
      const data = await getTransfersList(token);
      setTransfersList(data.transfers || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
    } finally {
      setIsLoadingTransfers(false);
    }
  }, [isAuthenticated, token, toast, t]);

  useEffect(() => {
    fetchFormData();
    fetchTransfers();
  }, [fetchFormData, fetchTransfers]);

  const onSubmit: SubmitHandler<TransferFormData> = async (data) => {
    if (!token) return;
    setIsSubmittingForm(true);
    const payload: CreateTransferPayload = {
      outcome_wallet_id: parseInt(data.outcomeWalletId, 10),
      income_wallet_id: parseInt(data.incomeWalletId, 10),
      amount_cents: Math.round(data.amount * 100),
    };
    try {
      await createTransfer(payload, token);
      toast({ title: t('transferCreatedTitle'), description: t('transferCreatedDesc') });
      await fetchFormData();
      reset();
      fetchTransfers();
    } catch (error: any) {
      toast({ variant: "destructive", title: t('transferFailedTitle'), description: error.message });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteClick = (transfer: TransferListItem) => {
    setTransferToDelete(transfer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!transferToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteTransfer(transferToDelete.id, token);
      toast({ title: t('transferDeletedTitle'), description: t('transferDeletedDesc') });
      fetchTransfers();
    } catch (error: any) {
      toast({ variant: "destructive", title: t('transferDeleteFailedTitle'), description: error.message });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setTransferToDelete(null);
    }
  };

  const getWalletNameAndCurrency = useCallback((walletId: number): string => {
    const foundUserWallet = userWallets.find(w => w.id === walletId);
    if (foundUserWallet) {
      return `${foundUserWallet.name} (${foundUserWallet.currency.code})`;
    }

    for (const username in capitalWalletsGrouped) {
      const foundCapitalWallet = capitalWalletsGrouped[username]?.find(w => w.id === walletId);
      if (foundCapitalWallet) {
        return `${foundCapitalWallet.name} (${foundCapitalWallet.currency.code}) (@${username})`;
      }
    }
    return t('unknownWallet');
  }, [userWallets, capitalWalletsGrouped, t]);

  const hasAnyWallets = userWallets.length > 0 || Object.keys(capitalWalletsGrouped).length > 0;
  const hasSufficientWalletsForTransfer = userWallets.length >=1 && (userWallets.length >=2 || Object.keys(capitalWalletsGrouped).length > 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
            <ArrowRightLeft className="mr-3 h-8 w-8 text-primary" />
            {t('transfersTitle')}
          </h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('createTransferTitle')}</CardTitle>
            <CardDescription>{t('createTransferDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFormData ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !hasSufficientWalletsForTransfer ? (
                <div className="text-center py-6">
                    <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">{t('transferNotEnoughWalletsError')}</p>
                </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="outcomeWalletId">{t('transferOutcomeWalletLabel')}</Label>
                    <Controller
                      name="outcomeWalletId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={userWallets.length === 0}>
                          <SelectTrigger id="outcomeWalletId" className={errors.outcomeWalletId ? 'border-destructive' : ''}>
                            <SelectValue placeholder={t('transferSelectOutcomeWalletPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {userWallets.map(wallet => (
                              <SelectItem key={wallet.id} value={String(wallet.id)}>
                                {wallet.name} (<CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.outcomeWalletId && <p className="text-sm text-destructive">{errors.outcomeWalletId.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="amount">{t('transferAmountLabel')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...control.register('amount')}
                      placeholder={t('amountPlaceholder', { currency: amountInputCurrencyCode })}
                      className={errors.amount ? 'border-destructive' : ''}
                    />
                    {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="incomeWalletId">{t('transferIncomeWalletLabel')}</Label>
                    <Controller
                      name="incomeWalletId"
                      control={control}
                      render={({ field }) => (
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedOutcomeWalletId}
                        >
                          <SelectTrigger id="incomeWalletId" className={errors.incomeWalletId ? 'border-destructive' : ''}>
                            <SelectValue placeholder={t('transferSelectIncomeWalletPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {userWallets.filter(w => String(w.id) !== selectedOutcomeWalletId).length > 0 && (
                                <SelectGroup>
                                    <SelectLabel>{t('yourWalletsGroupLabel')}</SelectLabel>
                                    {userWallets
                                    .filter(wallet => String(wallet.id) !== selectedOutcomeWalletId)
                                    .map(wallet => (
                                        <SelectItem key={`user-${wallet.id}`} value={String(wallet.id)}>
                                        {wallet.name} (<CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />)
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            )}

                            {Object.entries(capitalWalletsGrouped).map(([username, walletsInGroup], groupIndex) => {
                                const filteredWalletsInGroup = walletsInGroup.filter(w => String(w.id) !== selectedOutcomeWalletId);
                                if (filteredWalletsInGroup.length === 0) return null;

                                return (
                                <React.Fragment key={username}>
                                    {(userWallets.filter(w => String(w.id) !== selectedOutcomeWalletId).length > 0 || groupIndex > 0) && <SelectSeparator />}
                                    <SelectGroup>
                                        <SelectLabel>{username}</SelectLabel>
                                        {filteredWalletsInGroup
                                        .map(wallet => (
                                            <SelectItem key={`capital-${wallet.id}`} value={String(wallet.id)}>
                                            {wallet.name} (<CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />)
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </React.Fragment>
                               )
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.incomeWalletId && <p className="text-sm text-destructive">{errors.incomeWalletId.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingForm || !hasSufficientWalletsForTransfer}>
                    {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {t('transferCreateButton')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('transferHistoryTitle')}</CardTitle>
            <CardDescription>{t('transferHistoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transfersList.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('noTransfersFound')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transferFromWallet')}</TableHead>
                      <TableHead>{t('transferToWallet')}</TableHead>
                      <TableHead className="text-right">{t('transferAmount')}</TableHead>
                      <TableHead>{t('transferDate')}</TableHead>
                      <TableHead className="text-center">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfersList.map(transfer => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                                {getWalletNameAndCurrency(transfer.outcomeWallet.id)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                                {getWalletNameAndCurrency(transfer.incomeWallet.id)}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amountInCents={transfer.amount} currencyCode={transfer.outcomeWallet.currency.code} />
                        </TableCell>
                        <TableCell>{format(parseISO(transfer.createdAt), "PPp", { locale: dateFnsLocale })}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transfer)} disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">{t('deleteAction')}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transferDeleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transferDeleteConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransferToDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

