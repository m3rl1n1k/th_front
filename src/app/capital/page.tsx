
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
} from '@/lib/api';
import type {
  CapitalData,
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  ApiError,
  GetInvitationsApiResponse,
} from '@/types';
import {
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, Mail, Users, CheckCircle, XCircle, Send, UserX, LogOut, Eye, Coins, ListChecks, History
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CurrencyDisplay } from '@/components/common/currency-display';

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
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [capitalExists, setCapitalExists] = useState(false);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [capitalLoadingError, setCapitalLoadingError] = useState<string | null>(null);
  const [invitationsLoadingError, setInvitationsLoadingError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const capitalForm = useForm<CreateCapitalFormData>({ resolver: zodResolver(createCapitalSchema(t)) });
  const invitationForm = useForm<CreateInvitationFormData>({ resolver: zodResolver(createInvitationSchema(t)) });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingPageData(false);
      setCapitalExists(false);
      setCapitalData(null);
      setReceivedInvitations([]);
      setSentInvitations([]);
      return;
    }

    setIsLoadingPageData(true);
    setCapitalLoadingError(null);
    setInvitationsLoadingError(null);

    let fetchedCapitalData: CapitalData | null = null;
    let fetchedCapitalExists = false;

    if (user && user.capital && typeof user.capital.id === 'number') {
      try {
        const response: CapitalDetailsApiResponse = await getCapitalDetails(user.capital.id, token);
        fetchedCapitalData = response.capital;
        fetchedCapitalExists = true;
      } catch (err: any) {
        const apiError = err as ApiError;
        if (apiError.code === 404) {
          // Capital not found, this is okay, proceed to set to null/false
          fetchedCapitalData = null;
          fetchedCapitalExists = false;
          await fetchUser(); // Ensure user context is updated if capital was removed
        } else {
          setCapitalLoadingError(t('capitalLoadingError'));
          toast({ variant: 'destructive', title: t('errorFetchingData'), description: apiError.message || t('unexpectedError') });
          fetchedCapitalData = null;
          fetchedCapitalExists = false;
        }
      }
    } else {
      fetchedCapitalExists = false;
    }
    setCapitalData(fetchedCapitalData);
    setCapitalExists(fetchedCapitalExists);

    try {
      const invitationsResponse = await getInvitations(token);
      setReceivedInvitations(invitationsResponse.invitation || []);
      setSentInvitations(invitationsResponse.invitation_list || []);
    } catch (err: any) {
      const apiError = err as ApiError;
      setInvitationsLoadingError(t('errorFetchingInvitations'));
      toast({ variant: 'destructive', title: t('errorFetchingData'), description: apiError.message || t('unexpectedError')});
      setReceivedInvitations([]);
      setSentInvitations([]);
    }

    setIsLoadingPageData(false);
  }, [isAuthenticated, token, user, t, toast, fetchUser]);


  useEffect(() => {
    if (!authIsLoading) {
        fetchData();
    }
  }, [authIsLoading, user, fetchData]);


  const handleCreateCapital: SubmitHandler<CreateCapitalFormData> = async (data) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, createCapital: true }));
    try {
      await createCapital({ name: data.name }, token);
      toast({ title: t('sharingGroupCreatedSuccessTitle'), description: t('sharingGroupCreatedSuccessDesc', { name: data.name }) });
      capitalForm.reset();
      await fetchUser(); // This will update user context, triggering fetchData
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
      await fetchUser(); // Update user context, will trigger fetchData
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
        await fetchUser(); // Update user context, triggers fetchData
      } else {
        await rejectInvitation(invitationId, token);
        toast({ title: t('invitationRejectedSuccessTitle') });
        fetchData(); // Just refresh invitations list
      }
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
      fetchData(); // Refresh capital details and member list
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
      await removeUserFromCapital(user.id, token); // API expects user ID to remove
      toast({ title: t('leftSharingGroupSuccessTitle') });
      await fetchUser(); // Update user context, triggers fetchData
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('leaveSharingGroupFailedTitle'), description: (err as ApiError).message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`leaveCapital_${capitalIdToLeave}`]: false }));
    }
  };
  
  const ownerOfCurrentCapital = capitalData?.owner;

  const renderContent = () => {
    if (isLoadingPageData || authIsLoading) {
      return (
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
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
              <Briefcase className="mr-3 h-8 w-8 text-primary" />
              {capitalData.name}
            </h1>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>{t('sharingGroupOverviewTitle')}</CardTitle>
                {ownerOfCurrentCapital && <CardDescription>{t('ownerLabel')}: {ownerOfCurrentCapital.login} ({ownerOfCurrentCapital.email})</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-md">
                        <Label className="text-xs text-muted-foreground">{t('totalVisibleCapitalInGroupLabel')}</Label>
                        <p className="text-xl font-semibold">
                            <CurrencyDisplay amountInCents={capitalData.total_capital_amount} currencyCode={user?.userCurrency?.code} />
                        </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-md">
                        <Label className="text-xs text-muted-foreground">{t('yourVisibleCapitalInThisGroupLabel')}</Label>
                        <p className="text-xl font-semibold">
                            <CurrencyDisplay amountInCents={capitalData.user_capital_total} currencyCode={user?.userCurrency?.code} />
                        </p>
                    </div>
                </div>
                 {capitalData.users && capitalData.users.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-2">{t('sharingWithTitle')}</h3>
                        <ul className="space-y-2">
                        {capitalData.users.map(participant => (
                            <li key={participant.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                            <div>
                                <span className="font-medium">{participant.login}</span> ({participant.email})
                                {ownerOfCurrentCapital && participant.id === ownerOfCurrentCapital.id && <span className="ml-2 text-xs font-semibold text-primary">({t('ownerLabel')})</span>}
                            </div>
                            {user?.id === ownerOfCurrentCapital?.id && participant.id !== ownerOfCurrentCapital?.id && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(participant.id)} disabled={actionLoading[`removeUser_${participant.id}`]}>
                                {actionLoading[`removeUser_${participant.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4 text-destructive" />}
                                <span className="sr-only">{t('removeUserButton')}</span>
                                </Button>
                            )}
                            {user?.id !== ownerOfCurrentCapital?.id && user?.id === participant.id && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLeaveCapital(capitalData.id)}
                                    disabled={actionLoading[`leaveCapital_${capitalData.id}`]}
                                >
                                    {actionLoading[`leaveCapital_${capitalData.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LogOut className="mr-1 h-3 w-3" />}
                                    {t('leaveSharingGroupButton')}
                                </Button>
                            )}
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}
              </CardContent>
               {user?.id === ownerOfCurrentCapital?.id && (
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
          </>
        ) : capitalLoadingError ? ( 
            <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
                <CardHeader className="bg-destructive/10">
                    <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6" /> {t('errorTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6"><p>{capitalLoadingError}</p></CardContent>
            </Card>
        ) : null }

        {isAuthenticated && (
            <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                <Mail className="mr-3 h-6 w-6 text-primary" />
                {t('manageInvitationsTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {capitalExists && capitalData && user?.id === ownerOfCurrentCapital?.id ? (
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
                ) : capitalExists && capitalData && user?.id !== ownerOfCurrentCapital?.id ? (
                    <p className="text-sm text-muted-foreground mb-6">{t('ownerCanInvite')}</p>
                ) : !capitalExists && (
                <p className="text-sm text-muted-foreground mb-6">{t('createSharingGroupToInvite')}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sent Invitations Column */}
                  <div>
                    {capitalExists && capitalData && user?.id === ownerOfCurrentCapital?.id && (
                      <div className="mb-6 pt-4 border-t md:border-t-0">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <ListChecks className="mr-2 h-5 w-5 text-primary" />
                          {t('sentInvitationsTitle')}
                        </h3>
                        {sentInvitations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('invitedUserLabel')}</TableHead>
                                  <TableHead>{t('invitationStatusLabel')}</TableHead>
                                  <TableHead>{t('sentOnLabel')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sentInvitations.map(inv => (
                                  <TableRow key={`sent-${inv.id}`}>
                                    <TableCell className="text-xs">{inv.invitedUser.email}</TableCell>
                                    <TableCell className="text-xs">
                                      {inv.status === 'pending' ? t('statusPending') : 
                                      inv.status === 'accepted' ? t('statusAccepted') :
                                      inv.status === 'rejected' ? t('statusRejected') : inv.status}
                                    </TableCell>
                                    <TableCell className="text-xs">{format(parseISO(inv.createdAt), "PP", { locale: dateFnsLocale })}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                           !invitationsLoadingError && <p className="text-sm text-muted-foreground">{t('noSentInvitationsFound')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Received Invitations Column */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 pt-4 border-t md:border-t-0 flex items-center">
                      <History className="mr-2 h-5 w-5 text-primary" />
                      {t('receivedInvitationsTitle')}
                    </h3>
                    {invitationsLoadingError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <CardTitle>{t('errorTitle')}</CardTitle>
                            <CardDescription>{invitationsLoadingError}</CardDescription>
                        </Alert>
                    )}
                    { receivedInvitations.length > 0 ? (
                    <ul className="space-y-3">
                        {receivedInvitations.map(inv => {
                        const isCurrentUserInvited = user?.id === inv.invitedUser.id;
                        const isResponded = !!inv.respondedAt;
                        const isCurrentUserMemberOfThisCapitalViaThisInvite = isResponded && isCurrentUserInvited && user?.capital?.id === inv.capital.id;

                        return (
                        <li key={`received-${inv.id}`} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/30 rounded-lg shadow-sm">
                            <div className="mb-2 sm:mb-0">
                            <p className="font-medium text-sm">
                              {t('invitationForCapitalLabel', { capitalName: inv.capital.name })}
                            </p>
                            {inv.inviter && (
                                <p className="text-xs text-muted-foreground">
                                    {t('invitedByLabel')} {inv.inviter.email}
                                </p>
                            )}
                            {!isResponded && (
                                <p className="text-xs text-muted-foreground">
                                    {t('invitedUserEmailLabel')}: {inv.invitedUser.email}
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
                    !invitationsLoadingError && <p className="text-sm text-muted-foreground">{t('noInvitationsFound')}</p>
                    )}
                  </div>
                </div>
            </CardContent>
            </Card>
        )}
      </div>
    </MainLayout>
  );
}
