
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { CurrencyDisplay } from '@/components/common/currency-display';
import {
  getCapitalDetails,
  createCapital,
  deleteCapital,
  getInvitations,
  createInvitation,
  acceptInvitation,
  rejectInvitation,
  removeUserFromCapital,
  getWalletsList, 
  getWalletTypes, 
} from '@/lib/api';
import type {
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  WalletDetails, 
  WalletTypeMap, 
  ApiError
} from '@/types';
import {
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, UserPlus, Mail, Users, CheckCircle, XCircle, Send, UserX, WalletCards, Landmark, PiggyBank, CreditCard, Archive, ShieldCheck, HelpCircle
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

const createCapitalSchema = (t: Function) => z.object({
  name: z.string().min(3, { message: t('capitalNameMinLengthError') }).max(50, { message: t('capitalNameMaxLengthError') }),
});
type CreateCapitalFormData = z.infer<ReturnType<typeof createCapitalSchema>>;

const createInvitationSchema = (t: Function) => z.object({
  invitedEmail: z.string().email({ message: t('invalidEmail') }),
});
type CreateInvitationFormData = z.infer<ReturnType<typeof createInvitationSchema>>;

const MOCK_CAPITAL_ID = 1; 

interface UserWalletSummary {
  totalBalanceCents: number;
  currencyCode: string;
  byType: Record<string, { name: string; totalCents: number; icon: React.ReactNode }>;
  individualWallets: WalletDetails[];
}

export default function CapitalPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [capitalDetails, setCapitalDetails] = useState<CapitalDetailsApiResponse | null>(null);
  const [userWallets, setUserWallets] = useState<WalletDetails[]>([]); 
  const [walletTypes, setWalletTypes] = useState<WalletTypeMap>({}); 
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  const [capitalExists, setCapitalExists] = useState(false); 

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const capitalForm = useForm<CreateCapitalFormData>({ resolver: zodResolver(createCapitalSchema(t)) });
  const invitationForm = useForm<CreateInvitationFormData>({ resolver: zodResolver(createInvitationSchema(t)) });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    setError(null);
    setCapitalExists(false); 
    setInvitations([]); // Initialize/reset invitations

    try {
      const capitalData = await getCapitalDetails(MOCK_CAPITAL_ID, token);
      setCapitalDetails(capitalData);
      setCapitalExists(true); 

      // If capital exists, fetch its invitations in a separate try-catch
      try {
        const invitationsData = await getInvitations(token);
        setInvitations(invitationsData.invitations || []);
      } catch (invitationError: any) {
        console.warn("Failed to fetch invitations, treating as empty:", invitationError.message);
        setInvitations([]); // Ensure invitations is an empty array for UI if fetch fails
      }

    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 404 && apiError.message?.toLowerCase().includes('capital not found')) {
        setCapitalExists(false);
        setCapitalDetails(null);
        setInvitations([]);
        try {
          const [walletsData, typesData] = await Promise.all([
            getWalletsList(token),
            getWalletTypes(token)
          ]);
          setUserWallets(walletsData.wallets || []);
          setWalletTypes(typesData.types || {});
        } catch (walletErr: any) {
          setError(walletErr.message || t('errorFetchingUserWallets'));
          toast({ variant: 'destructive', title: t('errorFetchingData'), description: walletErr.message });
        }
      } else {
        setError(apiError.message || t('errorFetchingData'));
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: apiError.message });
      }
    } finally {
      setIsLoadingPage(false);
    }
  }, [isAuthenticated, token, t, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCapital: SubmitHandler<CreateCapitalFormData> = async (data) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, createCapital: true }));
    try {
      const newCapital = await createCapital({ name: data.name }, token);
      toast({ title: t('capitalCreatedSuccessTitle'), description: t('capitalCreatedSuccessDesc', { name: newCapital.name }) });
      capitalForm.reset();
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('capitalCreateFailedTitle'), description: err.message });
    } finally {
      setActionLoading(prev => ({ ...prev, createCapital: false }));
    }
  };
  
  const handleDeleteCapital = async () => {
    if (!token || !capitalDetails) return;
    setActionLoading(prev => ({ ...prev, deleteCapital: true }));
    try {
      await deleteCapital(capitalDetails.id, token);
      toast({ title: t('capitalDeletedSuccessTitle') });
      setCapitalDetails(null);
      setInvitations([]);
      setCapitalExists(false); 
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('capitalDeleteFailedTitle'), description: err.message });
    } finally {
      setActionLoading(prev => ({ ...prev, deleteCapital: false }));
    }
  };
  
  const handleCreateInvitation: SubmitHandler<CreateInvitationFormData> = async (data) => {
    if (!token || !capitalDetails) return;
    setActionLoading(prev => ({ ...prev, createInvitation: true }));
    try {
      await createInvitation(capitalDetails.id, { invited: data.invitedEmail, capital_id: capitalDetails.id }, token);
      toast({ title: t('invitationSentSuccessTitle') });
      invitationForm.reset();
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('invitationSendFailedTitle'), description: err.message });
    } finally {
      setActionLoading(prev => ({ ...prev, createInvitation: false }));
    }
  };

  const handleInvitationAction = async (invitationId: number, action: 'accept' | 'reject') => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: true }));
    try {
      if (action === 'accept') {
        await acceptInvitation(invitationId, token);
        toast({ title: t('invitationAcceptedSuccessTitle') });
      } else {
        await rejectInvitation(invitationId, token);
        toast({ title: t('invitationRejectedSuccessTitle') });
      }
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('invitationActionFailedTitle'), description: err.message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: false }));
    }
  };

  const handleRemoveUser = async (userIdToRemove: number) => {
    if (!token || !capitalDetails) return;
    setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: true }));
    try {
      await removeUserFromCapital(capitalDetails.id, userIdToRemove, token);
      toast({ title: t('userRemovedSuccessTitle') });
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: err.message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: false }));
    }
  };

  const ownerSharePercentage = useMemo(() => {
    if (!capitalDetails || !capitalExists || capitalDetails.total_amount_cents === 0) return 0;
    return (capitalDetails.owner_total_contribution_cents / capitalDetails.total_amount_cents) * 100;
  }, [capitalDetails, capitalExists]);


  const personalWalletSummary = useMemo((): UserWalletSummary | null => {
    if (capitalExists || userWallets.length === 0) return null;

    let totalBalanceCents = 0;
    const byType: UserWalletSummary['byType'] = {};
    
    const getWalletVisualIcon = (walletTypeKey: string) => {
        const iconClass = "h-5 w-5 inline-block mr-2";
        switch (walletTypeKey) {
            case 'main': return <Landmark className={`${iconClass} text-blue-500`} />;
            case 'deposit': return <PiggyBank className={`${iconClass} text-green-500`} />;
            case 'cash': return <WalletCards className={`${iconClass} text-yellow-600`} />;
            case 'credit': return <CreditCard className={`${iconClass} text-purple-500`} />;
            case 'archive': return <Archive className={`${iconClass} text-gray-500`} />;
            case 'block': return <ShieldCheck className={`${iconClass} text-red-500`} />;
            default: return <HelpCircle className={`${iconClass} text-muted-foreground`} />;
        }
    };

    userWallets.forEach(wallet => {
      totalBalanceCents += wallet.amount.amount;
      const typeKey = wallet.type;
      const typeName = walletTypes[typeKey] ? t(`walletType_${walletTypes[typeKey]}`, {defaultValue: walletTypes[typeKey]}) : t('unknownWallet');
      if (!byType[typeKey]) {
        byType[typeKey] = { name: typeName, totalCents: 0, icon: getWalletVisualIcon(typeKey) };
      }
      byType[typeKey].totalCents += wallet.amount.amount;
    });

    return {
      totalBalanceCents,
      currencyCode: user?.userCurrency?.code || 'USD', 
      byType,
      individualWallets: userWallets,
    };
  }, [capitalExists, userWallets, walletTypes, user, t]);


  if (isLoadingPage) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> {t('errorTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6"><p>{error}</p></CardContent>
        </Card>
      </MainLayout>
    );
  }
  
  if (!capitalExists) {
    return (
      <MainLayout>
        <div className="space-y-8">
            <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
                <WalletCards className="mr-3 h-8 w-8 text-primary" />
                {t('capitalUserWalletsTitle')}
            </h1>

            {personalWalletSummary ? (
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>{t('capitalUserWalletsSummaryTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted/50 p-4 rounded-md">
                            <p className="text-muted-foreground">{t('capitalUserTotalBalance')}:</p>
                            <p className="font-semibold text-2xl">
                                <CurrencyDisplay amountInCents={personalWalletSummary.totalBalanceCents} currencyCode={personalWalletSummary.currencyCode} />
                            </p>
                        </div>
                        <div>
                            <h3 className="text-md font-semibold mb-2">{t('capitalBalanceByType')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.values(personalWalletSummary.byType).map(typeSum => (
                                <Card key={typeSum.name} className="p-3 bg-card shadow-sm flex items-center">
                                    {typeSum.icon}
                                    <div>
                                        <p className="text-xs text-muted-foreground">{typeSum.name}</p>
                                        <p className="font-semibold text-sm">
                                        <CurrencyDisplay amountInCents={typeSum.totalCents} currencyCode={personalWalletSummary.currencyCode} />
                                        </p>
                                    </div>
                                </Card>
                            ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-md font-semibold mb-2">{t('capitalIndividualWalletsTitle')}</h3>
                            {personalWalletSummary.individualWallets.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {personalWalletSummary.individualWallets.map(wallet => (
                                    <Card key={wallet.id} className="p-3 bg-card shadow-sm">
                                    <p className="font-medium text-sm">{wallet.name}</p>
                                    <p className="text-xs text-muted-foreground">{walletTypes[wallet.type] ? t(`walletType_${walletTypes[wallet.type]}`, {defaultValue: walletTypes[wallet.type]}) : t('unknownWallet')}</p>
                                    <p className="font-semibold text-lg mt-1">
                                        <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />
                                    </p>
                                    </Card>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('noWalletsFound')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                 <p className="text-muted-foreground">{t('loadingUserWallets')}</p>
            )}

            <Card className="shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-6 w-6 text-primary" /> {t('createCapitalTitle')}
                </CardTitle>
                <CardDescription>{t('createCapitalPromptShort')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={capitalForm.handleSubmit(handleCreateCapital)} className="space-y-4">
                  <div>
                    <Label htmlFor="capitalNameNoPool">{t('capitalNameLabel')}</Label>
                    <Input id="capitalNameNoPool" {...capitalForm.register('name')} className={capitalForm.formState.errors.name ? 'border-destructive' : ''} />
                    {capitalForm.formState.errors.name && <p className="text-sm text-destructive">{capitalForm.formState.errors.name.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={actionLoading.createCapital}>
                    {actionLoading.createCapital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('createCapitalButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
      </MainLayout>
    );
  }
  
  const sharedUsers = capitalDetails?.participants.filter(p => !p.is_owner) || [];
  const primarySharedUser = sharedUsers.length > 0 ? sharedUsers[0] : null;

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" />
          {capitalDetails?.name || t('capitalPageTitle')}
        </h1>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('capitalSummaryTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {capitalDetails && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{capitalDetails.owner_email} ({t('ownerLabel')})</span>
                    {primarySharedUser && <span>{primarySharedUser.email}</span>}
                  </div>
                  <Progress value={ownerSharePercentage} className="h-3" indicatorClassName={ownerSharePercentage > 50 ? "bg-primary" : "bg-orange-400"} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{ownerSharePercentage.toFixed(2)}%</span>
                    {primarySharedUser && <span>{(100 - ownerSharePercentage).toFixed(2)}%</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-muted-foreground">{t('yourContributionLabel')}:</p>
                    <p className="font-semibold text-lg"><CurrencyDisplay amountInCents={capitalDetails.owner_total_contribution_cents} currencyCode={capitalDetails.currency_code} /></p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-muted-foreground">{t('totalCapitalLabel')}:</p>
                    <p className="font-semibold text-lg"><CurrencyDisplay amountInCents={capitalDetails.total_amount_cents} currencyCode={capitalDetails.currency_code} /></p>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-2">{t('yourContributingWalletsTitle')}</h3>
                  {capitalDetails.owner_wallet_contributions && capitalDetails.owner_wallet_contributions.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {capitalDetails.owner_wallet_contributions.map(wallet => (
                        <Card key={wallet.wallet_id} className="p-3 bg-card shadow-sm">
                          <p className="text-xs text-muted-foreground">{wallet.wallet_name}</p>
                          <p className="font-semibold text-sm"><CurrencyDisplay amountInCents={wallet.amount_cents} currencyCode={wallet.currency_code} /></p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noContributingWallets')}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          {capitalDetails && (
            <CardFooter>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={actionLoading.deleteCapital}>
                    {actionLoading.deleteCapital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('closeCapitalButton')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirmCloseCapitalTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('confirmCloseCapitalMessage', { name: capitalDetails.name })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCapital} className="bg-destructive hover:bg-destructive/90">{t('deleteButtonConfirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          )}
        </Card>

        {capitalDetails && sharedUsers.length > 0 && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('sharedWithTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {sharedUsers.map(participant => (
                  <li key={participant.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                    <div>
                      <span className="font-medium">{participant.email}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (<CurrencyDisplay amountInCents={participant.contribution_amount_cents} currencyCode={participant.currency_code} />)
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(participant.id)} disabled={actionLoading[`removeUser_${participant.id}`]}>
                      {actionLoading[`removeUser_${participant.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4 text-destructive" />}
                       <span className="sr-only">{t('removeUserButton')}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}


        {capitalDetails && (
            <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>{t('manageInvitationsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={invitationForm.handleSubmit(handleCreateInvitation)} className="space-y-4 mb-6">
                <div>
                    <Label htmlFor="invitedEmail">{t('inviteUserEmailLabel')}</Label>
                    <div className="flex gap-2">
                    <Input id="invitedEmail" type="email" {...invitationForm.register('invitedEmail')} placeholder={t('emailPlaceholder')} className={invitationForm.formState.errors.invitedEmail ? 'border-destructive' : ''} />
                    <Button type="submit" disabled={actionLoading.createInvitation}>
                        {actionLoading.createInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {t('sendInviteButton')}
                    </Button>
                    </div>
                    {invitationForm.formState.errors.invitedEmail && <p className="text-sm text-destructive">{invitationForm.formState.errors.invitedEmail.message}</p>}
                </div>
                </form>

                <h3 className="text-md font-semibold mb-2">{t('pendingInvitationsTitle')}</h3>
                {invitations.length > 0 ? (
                <ul className="space-y-2">
                    {invitations.filter(inv => inv.status === 'pending').map(inv => (
                    <li key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/30 rounded-md">
                        <div className="mb-2 sm:mb-0">
                        <p className="font-medium">{t('invitationToLabel')} {inv.invited_email}</p>
                        {inv.inviter_email && <p className="text-xs text-muted-foreground">{t('invitedByLabel')} {inv.inviter_email}</p>}
                        {inv.capital_name && <p className="text-xs text-muted-foreground">{t('forCapitalLabel')} {inv.capital_name}</p>}
                        </div>
                        {user?.email === inv.invited_email && (
                        <div className="flex gap-2 self-end sm:self-center">
                            <Button size="sm" variant="outline" onClick={() => handleInvitationAction(inv.id, 'accept')} disabled={actionLoading[`invitation_${inv.id}`]}>
                            {actionLoading[`invitation_${inv.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                            {t('acceptInvitationButton')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleInvitationAction(inv.id, 'reject')} disabled={actionLoading[`invitation_${inv.id}`]}>
                            {actionLoading[`invitation_${inv.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                            {t('rejectInvitationButton')}
                            </Button>
                        </div>
                        )}
                    </li>
                    ))}
                    {invitations.filter(inv => inv.status === 'pending').length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noPendingInvitations')}</p>
                    )}
                </ul>
                ) : (
                <p className="text-sm text-muted-foreground">{t('noInvitationsFound')}</p>
                )}
            </CardContent>
            </Card>
        )}
      </div>
    </MainLayout>
  );
}

