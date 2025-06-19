
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
} from '@/lib/api';
import type {
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  ApiError
} from '@/types';
import {
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, UserPlus, Mail, Users, CheckCircle, XCircle, Send, UserX
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

export default function CapitalPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [capitalDetails, setCapitalDetails] = useState<CapitalDetailsApiResponse | null>(null);
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
    setInvitations([]); 

    try {
      const capitalData = await getCapitalDetails(MOCK_CAPITAL_ID, token);
      setCapitalDetails(capitalData);
      setCapitalExists(true); 

      try {
        const invitationsData = await getInvitations(token);
        setInvitations(invitationsData.invitations || []);
      } catch (invitationError: any) {
        console.warn("[CapitalPage] Failed to fetch invitations, treating as empty:", invitationError.message);
        setInvitations([]); 
      }

    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 404 && apiError.message?.toLowerCase().includes('capital not found')) {
        setCapitalExists(false);
        setCapitalDetails(null);
        setInvitations([]); 
        // No longer fetching user wallets if capital not found
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
    if (!token || !capitalDetails || typeof capitalDetails.id !== 'number') {
      toast({ variant: 'destructive', title: t('error'), description: t('capitalDetailsMissingError')});
      return;
    }
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
    if (!token || !capitalDetails || typeof capitalDetails.id !== 'number') {
       toast({ variant: 'destructive', title: t('error'), description: t('capitalDetailsMissingError')});
      return;
    }
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
          <Card className="max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Briefcase className="mr-3 h-7 w-7 text-primary" /> {t('createCapitalTitle')}
              </CardTitle>
              <CardDescription>{t('createCapitalPrompt')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={capitalForm.handleSubmit(handleCreateCapital)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="capitalNameForm">{t('capitalNameLabel')}</Label>
                  <Input 
                    id="capitalNameForm" 
                    {...capitalForm.register('name')} 
                    placeholder={t('capitalNamePlaceholder', {defaultValue: "e.g., Family Savings"})}
                    className={capitalForm.formState.errors.name ? 'border-destructive' : ''} 
                  />
                  {capitalForm.formState.errors.name && <p className="text-sm text-destructive">{capitalForm.formState.errors.name.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={actionLoading.createCapital}>
                  {actionLoading.createCapital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('createCapitalButton')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  const sharedUsers = (capitalDetails?.participants || []).filter(p => !p.is_owner);
  const primarySharedUser = sharedUsers.length > 0 ? sharedUsers[0] : null;
  const ownerWalletContributions = capitalDetails?.owner_wallet_contributions || [];


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
                  {ownerWalletContributions.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {ownerWalletContributions.map(wallet => (
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
                <CardTitle className="flex items-center text-xl">
                    <UserPlus className="mr-3 h-6 w-6 text-primary" />
                    {t('manageInvitationsTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={invitationForm.handleSubmit(handleCreateInvitation)} className="space-y-4 mb-6">
                <div>
                    <Label htmlFor="invitedEmail" className="font-medium">{t('inviteUserEmailLabel')}</Label>
                    <div className="flex gap-2 mt-1">
                    <Input id="invitedEmail" type="email" {...invitationForm.register('invitedEmail')} placeholder={t('emailPlaceholder')} className={invitationForm.formState.errors.invitedEmail ? 'border-destructive' : ''} />
                    <Button type="submit" disabled={actionLoading.createInvitation}>
                        {actionLoading.createInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {t('sendInviteButton')}
                    </Button>
                    </div>
                    {invitationForm.formState.errors.invitedEmail && <p className="text-sm text-destructive mt-1">{invitationForm.formState.errors.invitedEmail.message}</p>}
                </div>
                </form>

                <h3 className="text-lg font-semibold mb-3 pt-4 border-t">{t('pendingInvitationsTitle')}</h3>
                {invitations.length > 0 ? (
                <ul className="space-y-3">
                    {invitations.filter(inv => inv.status === 'pending').map(inv => (
                    <li key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/30 rounded-lg shadow-sm">
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

