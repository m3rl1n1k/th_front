
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import {
  getCapitalDetails,
  createCapital,
  deleteCapital,
  getInvitations,
  createInvitation,
  acceptInvitation,
  rejectInvitation,
  removeUserFromCapital,
  getWalletsList, // Re-added
  getWalletTypes, // Re-added
} from '@/lib/api';
import type {
  CapitalData,
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  ApiError,
  GetInvitationsApiResponse,
  WalletDetails, // Re-added
  WalletTypeMap, // Re-added
} from '@/types';
import {
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, Mail, Users, CheckCircle, XCircle, Send, UserX, LogOut,
  Landmark, PiggyBank, WalletCards as WalletIconLucide, CreditCard as CreditCardIconLucide, Archive as ArchiveIcon, ShieldCheck as ShieldCheckIcon, HelpCircle as HelpCircleIcon, Coins, Eye
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Skeleton } from '@/components/ui/skeleton';

const createCapitalSchema = (t: Function) => z.object({
  name: z.string().min(3, { message: t('sharingGroupNameMinLengthError') }).max(50, { message: t('sharingGroupNameMaxLengthError') }),
});
type CreateCapitalFormData = z.infer<ReturnType<typeof createCapitalSchema>>;

const createInvitationSchema = (t: Function) => z.object({
  invitedEmail: z.string().email({ message: t('invalidEmail') }),
});
type CreateInvitationFormData = z.infer<ReturnType<typeof createInvitationSchema>>;

export default function CapitalPage() {
  const { user, token, isAuthenticated, isLoading: authIsLoading, fetchUser } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();

  const [capitalData, setCapitalData] = useState<CapitalData | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [capitalExists, setCapitalExists] = useState(false);

  // Re-add states for personal wallets
  const [personalWallets, setPersonalWallets] = useState<WalletDetails[]>([]);
  const [personalWalletTypes, setPersonalWalletTypes] = useState<WalletTypeMap>({});
  const [isLoadingPersonalWallets, setIsLoadingPersonalWallets] = useState(true);
  const [isLoadingPersonalWalletTypes, setIsLoadingPersonalWalletTypes] = useState(true);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const capitalForm = useForm<CreateCapitalFormData>({ resolver: zodResolver(createCapitalSchema(t)) });
  const invitationForm = useForm<CreateInvitationFormData>({ resolver: zodResolver(createInvitationSchema(t)) });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingPageData(false);
      setCapitalExists(false);
      setCapitalData(null);
      setInvitations([]);
      setPersonalWallets([]); // Ensure personal wallets are cleared if not authenticated
      return;
    }

    setError(null);
    setIsLoadingPageData(true);
    setIsLoadingPersonalWallets(true); // For personal wallets
    setIsLoadingPersonalWalletTypes(true); // For personal wallet types

    try {
      // Always fetch user's invitations, personal wallets, and wallet types
      const [invitationsResponse, walletsData, typesData] = await Promise.all([
        getInvitations(token),
        getWalletsList(token),
        getWalletTypes(token)
      ]);
      setInvitations(invitationsResponse.invitation || []);
      setPersonalWallets(walletsData.wallets || []);
      setPersonalWalletTypes(typesData.types || {});
      setIsLoadingPersonalWallets(false);
      setIsLoadingPersonalWalletTypes(false);

      if (user && user.capital && typeof user.capital.id === 'number') {
        const response: CapitalDetailsApiResponse = await getCapitalDetails(user.capital.id, token);
        setCapitalData(response.capital);
        setCapitalExists(true);
      } else {
        setCapitalData(null);
        setCapitalExists(false);
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 404 && user?.capital?.id) {
        setCapitalData(null);
        setCapitalExists(false);
        toast({ variant: 'destructive', title: t('sharingGroupNotFoundErrorTitle'), description: t('sharingGroupNotFoundErrorDesc') });
      } else if (apiError.message) {
        setError(apiError.message);
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: apiError.message });
      } else {
        setError(t('unexpectedError'));
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: t('unexpectedError') });
      }
      // Ensure personal data is still set even if capital fetch fails if those fetches succeeded
      if (personalWallets.length === 0 && !(err.url?.includes('/wallets') || err.url?.includes('wallet/types'))) setPersonalWallets([]);
      if (Object.keys(personalWalletTypes).length === 0 && !err.url?.includes('wallet/types')) setPersonalWalletTypes({});
      if (invitations.length === 0 && !err.url?.includes('/invitations')) setInvitations([]);
    } finally {
      setIsLoadingPageData(false);
    }
  // FIX: Removed personalWallets, personalWalletTypes, invitations from dependency array
  }, [isAuthenticated, token, user, t, toast]);

  useEffect(() => {
    if (!authIsLoading) {
        fetchData();
    }
  }, [authIsLoading, user, fetchData]);

  const processedPersonalWallets = useMemo(() => {
    if (personalWallets.length === 0 || Object.keys(personalWalletTypes).length === 0) return [];
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
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [personalWallets, personalWalletTypes, t]);

  const getPersonalWalletVisualIcon = (wallet: WalletDetails) => {
    const typeKey = wallet.type;
    const iconClass = "h-5 w-5 text-muted-foreground";
    switch (typeKey) {
      case 'main': return <Landmark className={iconClass} />;
      case 'deposit': return <PiggyBank className={iconClass} />;
      case 'cash': return <WalletIconLucide className={iconClass} />;
      case 'credit': return <CreditCardIconLucide className={iconClass} />;
      case 'archive': return <ArchiveIcon className={iconClass} />;
      case 'block': return <ShieldCheckIcon className={iconClass} />;
      default: return <HelpCircleIcon className={iconClass} />;
    }
  };


  const handleCreateCapital: SubmitHandler<CreateCapitalFormData> = async (data) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, createCapital: true }));
    try {
      await createCapital({ name: data.name }, token);
      toast({ title: t('sharingGroupCreatedSuccessTitle'), description: t('sharingGroupCreatedSuccessDesc', { name: data.name }) });
      capitalForm.reset();
      await fetchUser();
      // fetchData will be re-triggered by useEffect watching `user`
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('sharingGroupCreateFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, createCapital: false }));
    }
  };

  const handleDeleteCapital = async () => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
        toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError') });
        return;
    }
    setActionLoading(prev => ({ ...prev, deleteCapital: true }));
    try {
      await deleteCapital(capitalData.id, token);
      toast({ title: t('sharingGroupDeletedSuccessTitle') });
      await fetchUser();
      // fetchData will be re-triggered by useEffect watching `user`
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('sharingGroupDeleteFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, deleteCapital: false }));
    }
  };

  const handleCreateInvitation: SubmitHandler<CreateInvitationFormData> = async (data) => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
      toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError')});
      return;
    }
    setActionLoading(prev => ({ ...prev, createInvitation: true }));
    try {
      await createInvitation(capitalData.id, { invited: data.invitedEmail, capital_id: capitalData.id }, token);
      toast({ title: t('invitationSentSuccessTitle') });
      invitationForm.reset();
      fetchData(); // Refresh invitations list
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('invitationSendFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, createInvitation: false }));
    }
  };

  const handleInvitationAction = async (invitationId: number, actionType: 'accept' | 'reject') => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: true }));
    try {
      if (actionType === 'accept') {
        await acceptInvitation(invitationId, token);
        toast({ title: t('invitationAcceptedSuccessTitle') });
        await fetchUser(); // This will trigger a re-fetch of capital data
      } else {
        await rejectInvitation(invitationId, token);
        toast({ title: t('invitationRejectedSuccessTitle') });
      }
      fetchData(); // Refresh invitations list
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('invitationActionFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: false }));
    }
  };

  const handleRemoveUser = async (userIdToRemove: number) => {
    if (!token || !capitalData || typeof capitalData.id !== 'number') {
       toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError')});
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
      fetchData(); // Refresh capital details (user list)
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: false }));
    }
  };

  const handleLeaveCapital = async (capitalIdToLeave: number) => {
    if (!token || !user) return;
    setActionLoading(prev => ({ ...prev, [`leaveCapital_${capitalIdToLeave}`]: true }));
    try {
      await removeUserFromCapital(user.id, token);
      toast({ title: t('leftSharingGroupSuccessTitle') });
      await fetchUser(); // This will update user.capital and trigger fetchData
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('leaveSharingGroupFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`leaveCapital_${capitalIdToLeave}`]: false }));
    }
  };

  const ownerOfCapital = capitalData?.owner;

  const renderContent = () => {
    if (isLoadingPageData || authIsLoading) {
      return (
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error && !isAuthenticated) {
      return (
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" /> {t('errorTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6"><p>{error}</p></CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {/* Personal Wallets Section - Always Visible if authenticated */}
        {isAuthenticated && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{t('yourPersonalFinancialOverviewTitle')}</CardTitle>
              <CardDescription>{t('yourPersonalFinancialOverviewDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPersonalWallets || isLoadingPersonalWalletTypes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-3 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-6 w-1/2" /></Card>
                  ))}
                </div>
              ) : processedPersonalWallets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {processedPersonalWallets.map(wallet => (
                    <Card key={wallet.id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold truncate" title={wallet.name}>{wallet.name}</h4>
                        {getPersonalWalletVisualIcon(wallet)}
                      </div>
                      <p className="text-lg font-bold text-primary">
                        <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />
                      </p>
                      <p className="text-xs text-muted-foreground">{wallet.typeName}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noPersonalWalletsFound')}</p>
              )}
              {/* Display user's visible capital if part of a group */}
              {capitalExists && capitalData && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-semibold mb-3">{t('yourVisibleCapitalTitle')}</h4>
                  <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('yourVisiblePersonalCapitalLabel')}</span>
                      <span className="text-lg font-semibold">
                        <CurrencyDisplay amountInCents={capitalData.user_capital_total} currencyCode={user?.userCurrency?.code} />
                      </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* Sharing Group Section OR Create Sharing Group Form */}
        {!capitalExists ? (
          <Card className="max-w-lg mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Eye className="mr-3 h-7 w-7 text-primary" /> {t('createSharingGroupTitle')}
              </CardTitle>
              <CardDescription>{t('createSharingGroupPrompt')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={capitalForm.handleSubmit(handleCreateCapital)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="capitalNameForm">{t('sharingGroupNameLabel')}</Label>
                  <Input
                    id="capitalNameForm"
                    {...capitalForm.register('name')}
                    placeholder={t('sharingGroupNamePlaceholder')}
                    className={capitalForm.formState.errors.name ? 'border-destructive' : ''}
                  />
                  {capitalForm.formState.errors.name && <p className="text-sm text-destructive">{capitalForm.formState.errors.name.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={actionLoading.createCapital}>
                  {actionLoading.createCapital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('createSharingGroupButton')}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : capitalData ? (
          <>
            <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
              <Eye className="mr-3 h-8 w-8 text-primary" />
              {capitalData.name}
            </h1>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>{t('sharingGroupOverviewTitle')}</CardTitle>
                {ownerOfCapital && <CardDescription>{t('ownerLabel')}: {ownerOfCapital.login} ({ownerOfCapital.email})</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-muted/30 rounded-md">
                    <Label className="text-xs text-muted-foreground">{t('totalVisibleCapitalInGroupLabel')}</Label>
                    <p className="text-xl font-semibold">
                        <CurrencyDisplay amountInCents={capitalData.total_capital_amount} currencyCode={user?.userCurrency?.code} />
                    </p>
                  </div>
                </div>
              </CardContent>
               {user?.id === ownerOfCapital?.id && (
                  <CardFooter>
                      <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={actionLoading.deleteCapital}>
                          {actionLoading.deleteCapital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('deleteSharingGroupButton')}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmDeleteSharingGroupTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('confirmDeleteSharingGroupMessage', { name: capitalData.name })}</AlertDialogDescription>
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

            {capitalData.users && capitalData.users.length > 0 && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>{t('sharingWithTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {capitalData.users.map(participant => (
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
          </>
        ) : null }

        {/* Invitations Section - Always Visible if authenticated */}
        {isAuthenticated && (
            <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                <Mail className="mr-3 h-6 w-6 text-primary" />
                {t('manageInvitationsTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {capitalExists && capitalData && user?.id === ownerOfCapital?.id ? (
                <form onSubmit={invitationForm.handleSubmit(handleCreateInvitation)} className="space-y-4 mb-6">
                    <div>
                    <Label htmlFor="invitedEmail" className="font-medium">{t('inviteUserToShareLabel')}</Label>
                    <div className="flex gap-2 mt-1">
                        <Input id="invitedEmail" type="email" {...invitationForm.register('invitedEmail')} placeholder={t('emailPlaceholder')} className={invitationForm.formState.errors.invitedEmail ? 'border-destructive' : ''} />
                        <Button type="submit" disabled={actionLoading.createInvitation || !capitalData}>
                        {actionLoading.createInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {t('sendInviteButton')}
                        </Button>
                    </div>
                    {invitationForm.formState.errors.invitedEmail && <p className="text-sm text-destructive mt-1">{invitationForm.formState.errors.invitedEmail.message}</p>}
                    </div>
                </form>
                ) : capitalExists && capitalData && user?.id !== ownerOfCapital?.id ? (
                    <p className="text-sm text-muted-foreground mb-6">{t('ownerCanInvite')}</p>
                ) : !capitalExists && (
                <p className="text-sm text-muted-foreground mb-6">{t('createSharingGroupToInvite')}</p>
                )}

                <h3 className="text-lg font-semibold mb-3 pt-4 border-t">{t('pendingInvitationsTitle')}</h3>
                { invitations.length > 0 ? (
                <ul className="space-y-3">
                    {invitations.map(inv => {
                    const isCurrentUserInvited = user?.id === inv.invitedUser.id;
                    const isResponded = !!inv.respondedAt;
                    const isCurrentUserMemberOfThisCapitalViaThisInvite = isResponded && isCurrentUserInvited && user?.capital?.id === inv.capital.id;

                    return (
                    <li key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/30 rounded-lg shadow-sm">
                        <div className="mb-2 sm:mb-0">
                        <p className="font-medium">
                            {t('invitationToSharingGroupLabel')} <span className="text-primary">{inv.capital.name}</span>
                        </p>
                        {!isResponded && (
                            <p className="text-xs text-muted-foreground">
                                {t('invitedUserEmailLabel')}: {inv.invitedUser.email}
                            </p>
                            )}
                        {inv.inviter && (
                            <p className="text-xs text-muted-foreground">
                                {t('invitedByLabel')} {inv.inviter.email}
                            </p>
                            )}
                        <p className="text-xs text-muted-foreground">
                            {t('invitedOnLabel')} {format(parseISO(inv.createdAt), "PP", { locale: dateFnsLocale })}
                        </p>
                        {isResponded && inv.respondedAt && (
                            <p className="text-xs text-muted-foreground">
                            {t('invitationRespondedOnLabel')} {format(parseISO(inv.respondedAt), "PPp", { locale: dateFnsLocale })}
                            </p>
                        )}
                        </div>

                        <div className="flex gap-2 self-end sm:self-center">
                        {isCurrentUserInvited && !isResponded && (
                            <>
                            <Button size="sm" variant="outline" onClick={() => handleInvitationAction(inv.id, 'accept')} disabled={actionLoading[`invitation_${inv.id}`]}>
                                {actionLoading[`invitation_${inv.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                                {t('acceptInvitationButton')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleInvitationAction(inv.id, 'reject')} disabled={actionLoading[`invitation_${inv.id}`]}>
                                {actionLoading[`invitation_${inv.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                                {t('rejectInvitationButton')}
                            </Button>
                            </>
                        )}
                        {isCurrentUserMemberOfThisCapitalViaThisInvite && (
                            <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLeaveCapital(inv.capital.id)}
                            disabled={actionLoading[`leaveCapital_${inv.capital.id}`]}
                            >
                            {actionLoading[`leaveCapital_${inv.capital.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LogOut className="mr-1 h-3 w-3" />}
                            {t('leaveSharingGroupButton')}
                            </Button>
                        )}
                        {isCurrentUserInvited && isResponded && !isCurrentUserMemberOfThisCapitalViaThisInvite && (
                            <p className="text-sm text-muted-foreground italic">{t('invitationProcessedLabel')}</p>
                        )}
                        </div>
                    </li>
                    )})}
                </ul>
                ) : (
                <p className="text-sm text-muted-foreground">{t('noInvitationsFound')}</p>
                )}
            </CardContent>
            </Card>
        )}
      </div>
    );
  }


  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
}
