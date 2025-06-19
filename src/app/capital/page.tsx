
"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  getWalletTypes
} from '@/lib/api';
import type {
  CapitalData,
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  ApiError,
  WalletDetails,
  WalletTypeMap,
  GetInvitationsApiResponse,
} from '@/types';
import {
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, UserPlus, Mail, Users, CheckCircle, XCircle, Send, UserX,
  Landmark, PiggyBank, WalletCards as WalletIconLucide, CreditCard, Archive, ShieldCheck, HelpCircle as HelpCircleLucide
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

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
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();

  const [capitalData, setCapitalData] = useState<CapitalData | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [personalWallets, setPersonalWallets] = useState<WalletDetails[]>([]);
  const [personalWalletTypes, setPersonalWalletTypes] = useState<WalletTypeMap>({});
  
  const [capitalExists, setCapitalExists] = useState(false); 

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingPersonalWallets, setIsLoadingPersonalWallets] = useState(false);
  const [isLoadingPersonalWalletTypes, setIsLoadingPersonalWalletTypes] = useState(false);
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
    setPersonalWallets([]);
    setPersonalWalletTypes({});

    try {
      const response: CapitalDetailsApiResponse = await getCapitalDetails(MOCK_CAPITAL_ID, token);
      setCapitalData(response.capital);
      setCapitalExists(true); 
      setIsLoadingPersonalWallets(false); 
      setIsLoadingPersonalWalletTypes(false);

      try {
        const invitationsResponse: GetInvitationsApiResponse = await getInvitations(token);
        setInvitations(invitationsResponse.invitation || []);
      } catch (invitationError: any) {
        const apiInvError = invitationError as ApiError;
        if (apiInvError.code === 404 || (apiInvError.message && typeof apiInvError.message === 'string' && apiInvError.message.toLowerCase().includes("not found"))) {
            setInvitations([]);
            console.warn("[CapitalPage] No invitations found or API indicated not found:", apiInvError.message);
        } else {
            console.error("[CapitalPage] Failed to fetch invitations (non-404):", apiInvError.message);
            setInvitations([]); 
        }
      }

    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 404 && (apiError.message && typeof apiError.message === 'string' && (apiError.message.toLowerCase().includes('capital not found') || apiError.message.toLowerCase().includes('shared capital pool not found')))) {
        setCapitalExists(false);
        setCapitalData(null);
        setInvitations([]); 
        
        setIsLoadingPersonalWallets(true);
        setIsLoadingPersonalWalletTypes(true);
        try {
          const [walletsData, typesData] = await Promise.all([
            getWalletsList(token),
            getWalletTypes(token)
          ]);
          setPersonalWallets(walletsData.wallets || []);
          setPersonalWalletTypes(typesData.types || {});
        } catch (dataError: any) {
          console.error("[CapitalPage] Failed to fetch personal wallets or types:", dataError.message);
          setPersonalWallets([]);
          setPersonalWalletTypes({});
        } finally {
          setIsLoadingPersonalWallets(false);
          setIsLoadingPersonalWalletTypes(false);
        }

      } else {
        setError(apiError.message || t('errorFetchingData'));
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: typeof apiError.message === 'string' ? apiError.message : t('unexpectedError') });
      }
    } finally {
      setIsLoadingPage(false);
    }
  }, [isAuthenticated, token, t, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processedPersonalWallets = useMemo(() => {
    if (isLoadingPersonalWalletTypes || personalWallets.length === 0) return [];
    return personalWallets.map(wallet => {
      const typeKey = wallet.type;
      const mappedDisplayValue = personalWalletTypes[typeKey];
      const typeIdentifierForTranslation = mappedDisplayValue || typeKey.toUpperCase();
      const userFriendlyDefault = mappedDisplayValue || typeKey;
      const translationKey = `walletType_${typeIdentifierForTranslation}`;
      return {
        ...wallet,
        typeName: t(translationKey as any, { defaultValue: userFriendlyDefault })
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [personalWallets, personalWalletTypes, t, isLoadingPersonalWalletTypes]);

  const getPersonalWalletVisualIcon = (wallet: WalletDetails) => {
    const typeKey = wallet.type;
    const iconClass = "h-5 w-5"; 
    
    switch (typeKey) {
      case 'main': return <Landmark className={`${iconClass} text-blue-500`} />;
      case 'deposit': return <PiggyBank className={`${iconClass} text-green-500`} />;
      case 'cash': return <WalletIconLucide className={`${iconClass} text-yellow-600`} />;
      case 'credit': return <CreditCard className={`${iconClass} text-purple-500`} />;
      case 'archive': return <Archive className={`${iconClass} text-gray-500`} />;
      case 'block': return <ShieldCheck className={`${iconClass} text-red-500`} />;
      default: return <HelpCircleLucide className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const handleCreateCapital: SubmitHandler<CreateCapitalFormData> = async (data) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, createCapital: true }));
    try {
      const response: CapitalDetailsApiResponse = await createCapital({ name: data.name }, token);
      toast({ title: t('capitalCreatedSuccessTitle'), description: t('capitalCreatedSuccessDesc', { name: response.capital.name }) });
      capitalForm.reset();
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('capitalCreateFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, createCapital: false }));
    }
  };
  
  const handleDeleteCapital = async () => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
        toast({ variant: 'destructive', title: t('error'), description: t('capitalDetailsMissingError') });
        return;
    }
    setActionLoading(prev => ({ ...prev, deleteCapital: true }));
    try {
      await deleteCapital(capitalData.id, token);
      toast({ title: t('capitalDeletedSuccessTitle') });
      setCapitalData(null);
      setInvitations([]);
      setCapitalExists(false); 
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('capitalDeleteFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, deleteCapital: false }));
    }
  };
  
  const handleCreateInvitation: SubmitHandler<CreateInvitationFormData> = async (data) => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
      toast({ variant: 'destructive', title: t('error'), description: t('capitalDetailsMissingError')});
      return;
    }
    setActionLoading(prev => ({ ...prev, createInvitation: true }));
    try {
      await createInvitation(capitalData.id, { invited: data.invitedEmail, capital_id: capitalData.id }, token);
      toast({ title: t('invitationSentSuccessTitle') });
      invitationForm.reset();
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('invitationSendFailedTitle'), description: (err as ApiError).message });
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
      toast({ variant: 'destructive', title: t('invitationActionFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: false }));
    }
  };

  const handleRemoveUser = async (userIdToRemove: number) => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
       toast({ variant: 'destructive', title: t('error'), description: t('capitalDetailsMissingError')});
      return;
    }
    if (capitalData.owner && userIdToRemove === capitalData.owner.id) {
      toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: t('cannotRemoveOwnerError')});
      return;
    }

    setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: true }));
    try {
      await removeUserFromCapital(userIdToRemove, token); 
      toast({ title: t('userRemovedSuccessTitle') });
      fetchData(); 
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: false }));
    }
  };

  if (isLoadingPage) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error && !capitalExists) { 
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
              <CardDescription>{t('createCapitalPromptShort')}</CardDescription>
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

          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>{t('yourPersonalWalletsTitle')}</CardTitle>
                <CardDescription>{t('yourPersonalWalletsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingPersonalWallets || isLoadingPersonalWalletTypes ? (
                     <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : processedPersonalWallets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{t('noPersonalWalletsFound')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>{t('nameLabel')}</TableHead>
                                    <TableHead>{t('walletTypeLabel')}</TableHead>
                                    <TableHead className="text-right">{t('balanceLabel')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedPersonalWallets.map(wallet => (
                                    <TableRow key={wallet.id}>
                                        <TableCell>{getPersonalWalletVisualIcon(wallet)}</TableCell>
                                        <TableCell className="font-medium">{wallet.name}</TableCell>
                                        <TableCell>{wallet.typeName}</TableCell>
                                        <TableCell className="text-right">
                                            <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />
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
      </MainLayout>
    );
  }
  
  const usersInCapital = capitalData?.users || [];
  const ownerOfCapital = capitalData?.owner;

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" />
          {capitalData?.name || t('capitalPageTitle')}
        </h1>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('capitalSummaryTitle')}</CardTitle>
             {ownerOfCapital && <CardDescription>{t('ownerLabel')}: {ownerOfCapital.login} ({ownerOfCapital.email})</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">{t('capitalFinancialDetailsNotAvailable')}</p>
          </CardContent>
          {capitalData && (
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
                    <AlertDialogDescription>{t('confirmCloseCapitalMessage', { name: capitalData.name })}</AlertDialogDescription>
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

        {capitalData && usersInCapital.length > 0 && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('sharedWithTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {usersInCapital.map(participant => (
                  <li key={participant.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                    <div>
                      <span className="font-medium">{participant.login}</span> ({participant.email})
                      {ownerOfCapital && participant.id === ownerOfCapital.id && <span className="ml-2 text-xs font-semibold text-primary">({t('ownerLabel')})</span>}
                    </div>
                    {user?.id === ownerOfCapital?.id && participant.id !== ownerOfCapital?.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(participant.id)} disabled={actionLoading[`removeUser_${participant.id}`]}>
                        {actionLoading[`removeUser_${participant.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4 text-destructive" />}
                        <span className="sr-only">{t('removeUserButton')}</span>
                        </Button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}


        {capitalData && (
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
                    {invitations.map(inv => (
                    <li key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/30 rounded-lg shadow-sm">
                        <div className="mb-2 sm:mb-0">
                        <p className="font-medium">{t('invitationToLabel')} {inv.invitedUser.email}</p>
                        {inv.inviter && <p className="text-xs text-muted-foreground">{t('invitedByLabel')} {inv.inviter.email}</p>}
                        <p className="text-xs text-muted-foreground">{t('invitedOnLabel')} {format(parseISO(inv.createdAt), "PP", { locale: dateFnsLocale })}</p>
                        </div>
                        {user?.email === inv.invitedUser.email && (
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

