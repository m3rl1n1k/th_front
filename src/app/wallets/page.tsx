
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { getWalletsList, getWalletTypes, deleteWallet } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { WalletCards, Landmark, AlertTriangle, PlusCircle, PiggyBank, CreditCard, LayoutGrid, List, MoreHorizontal, Edit3, Trash2, Eye, Loader2, Archive, ShieldCheck, HelpCircle } from 'lucide-react';
import type { WalletDetails, WalletTypeMap, WalletTypeApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the desired sort order for wallet types
const walletTypeSortOrder: Record<string, number> = {
  'main': 1,
  'deposit': 2,
  'cash': 3,
  'credit': 4,
  // other types will be sorted alphabetically after these
  'archive': 98,
  'block': 99,
};


export default function WalletsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [wallets, setWallets] = useState<WalletDetails[] | null>(null);
  const [walletTypeMap, setWalletTypeMap] = useState<WalletTypeMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<WalletDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWalletData = () => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      getWalletsList(token)
        .then(data => {
          setWallets(data.wallets || []);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setWallets([]);
        })
        .finally(() => setIsLoading(false));
    } else if (!isAuthenticated) {
      setIsLoading(false);
      setWallets([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getWalletTypes(token)
        .then((data: { types: WalletTypeApiResponse }) => {
          setWalletTypeMap(data.types || {});
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));
    } else {
      setIsLoadingTypes(false);
    }
  }, [token, isAuthenticated, t, toast]);

  useEffect(() => {
    fetchWalletData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);


  const processedWallets = useMemo(() => {
    if (!wallets) return null;

    const translatedWallets = wallets.map(wallet => {
      const typeKey = wallet.type; // This is "main", "cash" etc.
      const mappedDisplayValue = walletTypeMap[typeKey]; // This would be "MAIN", "CASH" from API
      let typeIdentifierForTranslation = mappedDisplayValue || typeKey.toUpperCase();
      
      const userFriendlyDefault = mappedDisplayValue || typeKey;
      const translationKey = `walletType_${typeIdentifierForTranslation}`;
      
      return {
        ...wallet,
        typeName: t(translationKey as any, { defaultValue: userFriendlyDefault })
      };
    });

    // Sort the wallets
    return translatedWallets.sort((a, b) => {
      const orderA = walletTypeSortOrder[a.type] || 50; // Default order for unlisted types
      const orderB = walletTypeSortOrder[b.type] || 50;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If same order priority, sort by name
      return a.name.localeCompare(b.name);
    });

  }, [wallets, walletTypeMap, t, isLoadingTypes]);

  const getWalletVisualIcon = (wallet: WalletDetails) => {
    const typeKey = wallet.type; // e.g., "main", "cash"
    const iconClass = "h-6 w-6";
    
    switch (typeKey) {
      case 'main': return <Landmark className={`${iconClass} text-blue-500`} />;
      case 'deposit': return <PiggyBank className={`${iconClass} text-green-500`} />;
      case 'cash': return <WalletCards className={`${iconClass} text-yellow-600`} />;
      case 'credit': return <CreditCard className={`${iconClass} text-purple-500`} />;
      case 'archive': return <Archive className={`${iconClass} text-gray-500`} />;
      case 'block': return <ShieldCheck className={`${iconClass} text-red-500`} />;
      default: return <HelpCircle className={`${iconClass} text-muted-foreground`} />;
    }
  };
  
  const handleAddNewWallet = () => {
    router.push('/wallets/new');
  };

  const handleViewDetails = (walletId: string | number) => {
    // Implement navigation to wallet details page or modal
    // For now, placeholder
    toast({ title: t('featureComingSoonTitle'), description: t('walletViewDetailsDesc') });
    // router.push(`/wallets/${walletId}`);
  };

  const handleEditWallet = (walletId: string | number) => {
    // Implement navigation to wallet edit page
    // For now, placeholder
    toast({ title: t('featureComingSoonTitle'), description: t('walletEditDesc') });
    // router.push(`/wallets/${walletId}/edit`);
  };

  const handleDeleteWallet = (wallet: WalletDetails) => {
    setWalletToDelete(wallet);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWallet = async () => {
    if (!walletToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteWallet(walletToDelete.id, token);
      toast({ title: t('walletDeletedTitle'), description: t('walletDeletedDesc') });
      fetchWalletData(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorDeletingWallet'), description: error.message });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setWalletToDelete(null);
    }
  };


  if (isLoading || isLoadingTypes) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('walletsTitle')}</h1>
            <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-20 rounded-md" />
                <Button disabled className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('addNewWalletButton')}
                </Button>
            </div>
          </div>
          <div className={`grid gap-6 ${viewMode === 'card' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {viewMode === 'card' ? (
              [1, 2, 3, 4].map(i => (
                <Card key={i} className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-6 w-3/5" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center space-x-4 py-2 border-b last:border-b-0">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                         <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!processedWallets || processedWallets.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('walletsTitle')}</h1>
             <Button onClick={handleAddNewWallet} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addNewWalletButton')}
            </Button>
          </div>
          <Card className="shadow-lg text-center py-12">
            <CardHeader>
              <WalletCards className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle>{t('noWalletsFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{t('noWalletsFoundDescription')}</p>
              <Button onClick={handleAddNewWallet}>
                 <PlusCircle className="mr-2 h-5 w-5" />
                 {t('createFirstWalletButton')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-foreground">{t('walletsTitle')}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 border p-1 rounded-md bg-muted/50 dark:bg-muted/20">
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('card')}
                title={t('viewAsCards')}
                aria-label={t('viewAsCards')}
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                title={t('viewAsTable')}
                aria-label={t('viewAsTable')}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
            <Button onClick={handleAddNewWallet} className="shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addNewWalletButton')}
            </Button>
          </div>
        </div>

        {viewMode === 'card' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedWallets.map(wallet => (
              <Card key={wallet.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col bg-card">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-muted/20 dark:bg-muted/10 rounded-t-lg p-4">
                  <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold text-foreground">{wallet.name}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">{wallet.typeName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getWalletVisualIcon(wallet)}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('actions')}</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleViewDetails(wallet.id)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> {t('viewAction')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleEditWallet(wallet.id)} className="cursor-pointer">
                            <Edit3 className="mr-2 h-4 w-4" /> {t('editAction')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleDeleteWallet(wallet)} className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> {t('deleteAction')}
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 flex-grow">
                  <div className="text-3xl font-bold text-primary">
                    <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />
                  </div>
                  <div>
                      <p className="text-xs text-muted-foreground">{t('accountNumberLabel')}</p>
                      <p className="text-sm font-mono text-foreground break-all">{wallet.number || t('notSet')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-xl border-border/60">
            <CardHeader className="border-b border-border/60">
              <CardTitle>{t('walletsListTableTitle')}</CardTitle>
              <CardDescription>{t('walletsListTableDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 dark:bg-muted/10">
                    <TableRow>
                      <TableHead className="w-[50px] px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{null}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('nameLabel')}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('walletTypeLabel')}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('accountNumberLabel')}</TableHead>
                      <TableHead className="text-right px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('balanceLabel')}</TableHead>
                      <TableHead className="text-center px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedWallets.map(wallet => (
                      <TableRow key={wallet.id} className="hover:bg-accent/10 dark:hover:bg-accent/5 transition-colors">
                        <TableCell className="px-4 py-3">{getWalletVisualIcon(wallet)}</TableCell>
                        <TableCell className="font-medium px-4 py-3 text-sm">{wallet.name}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">{wallet.typeName}</TableCell>
                        <TableCell className="font-mono px-4 py-3 text-sm">{wallet.number || t('notSet')}</TableCell>
                        <TableCell className="text-right px-4 py-3 text-sm">
                          <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />
                        </TableCell>
                        <TableCell className="text-center px-4 py-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">{t('actions')}</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleViewDetails(wallet.id)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> {t('viewAction')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEditWallet(wallet.id)} className="cursor-pointer">
                                    <Edit3 className="mr-2 h-4 w-4" /> {t('editAction')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleDeleteWallet(wallet)} className="text-destructive focus:text-destructive cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('deleteAction')}
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteWalletConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWalletConfirmMessage', { walletName: walletToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWalletToDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWallet} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
