
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
  Briefcase, Loader2, AlertTriangle, PlusCircle, Trash2, Mail, Users, CheckCircle, XCircle, Send, UserX, LogOut, Eye, PieChart
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
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

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
  const { t, dateFnsLocale, language } = useTranslation();
  const { toast } = useToast();

  const [activeCapitalDetails, setActiveCapitalDetails] = useState<CapitalDetailsApiResponse | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [capitalExists, setCapitalExists] = useState(false);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [capitalLoadingError, setCapitalLoadingError] = useState<string | null>(null);
  const [invitationsLoadingError, setInvitationsLoadingError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const capitalForm = useForm<CreateCapitalFormData>({ resolver: zodResolver(createCapitalSchema(t)) });
  const invitationForm = useForm<CreateInvitationFormData>({ resolver: zodResolver(createInvitationSchema(t)) });
  
  const generateCategoryTranslationKey = (name: string | undefined | null): string => {
    if (!name) return '';
    if (name === 'no_category') return 'noCategory';
    return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingPageData(false);
      setCapitalExists(false);
      setActiveCapitalDetails(null);
      setReceivedInvitations([]);
      setSentInvitations([]);
      return;
    }

    setIsLoadingPageData(true);
    setCapitalLoadingError(null);
    setInvitationsLoadingError(null);

    let fetchedCapitalDetails: CapitalDetailsApiResponse | null = null;
    let fetchedCapitalExists = false;

    if (user && user.capital && typeof user.capital.id === 'number') {
      try {
        const response: CapitalDetailsApiResponse = await getCapitalDetails(user.capital.id, token);
        fetchedCapitalDetails = response;
        fetchedCapitalExists = true;
      } catch (err: any) {
        const apiError = err as ApiError;
        if (apiError.code === 401) {
          setIsLoadingPageData(false);
          return;
        }
        if (apiError.code === 404) {
          fetchedCapitalDetails = null;
          fetchedCapitalExists = false;
          await fetchUser(); 
        } else {
          setCapitalLoadingError(t('capitalLoadingError'));
          fetchedCapitalDetails = null;
          fetchedCapitalExists = false;
        }
      }
    } else {
      fetchedCapitalExists = false;
    }
    setActiveCapitalDetails(fetchedCapitalDetails);
    setCapitalExists(fetchedCapitalExists);

    try {
      const invitationsResponse = await getInvitations(token);
      setReceivedInvitations(invitationsResponse.invitation || []);
      setSentInvitations(invitationsResponse.invitation_list || []);
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 401) {
        setIsLoadingPageData(false);
        return;
      }
      const message = typeof apiError.message === 'string'
  ? apiError.message
  : t('unexpectedError');
      setInvitationsLoadingError(t('errorFetchingInvitations'));
      if (!capitalLoadingError) {
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: message || t('unexpectedError')});
      }
      setReceivedInvitations([]);
      setSentInvitations([]);
    }

    if (capitalLoadingError && !invitationsLoadingError) {
        toast({ variant: 'destructive', title: t('errorFetchingData'), description: capitalLoadingError });
    }


    setIsLoadingPageData(false);
  }, [isAuthenticated, token, user, t, toast, fetchUser, capitalLoadingError, invitationsLoadingError]);


  useEffect(() => {
    if (!authIsLoading) {
        fetchData();
    }
  }, [authIsLoading, user, fetchData]);


  const handleCreateCapital: SubmitHandler<CreateCapitalFormData> = async (data) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, createCapital: true }));
    try {
      const newCapitalDetails = await createCapital({ name: data.name }, token);
      toast({ title: t('sharingGroupCreatedSuccessTitle'), description: t('sharingGroupCreatedSuccessDesc', { name: data.name }) });
      capitalForm.reset();
      setActiveCapitalDetails(newCapitalDetails);
      setCapitalExists(true);
      await fetchUser();
    } catch (err: any) {
      if ((err as ApiError).code !== 401) {
        toast({ variant: 'destructive', title: t('sharingGroupCreateFailedTitle'), description: (err as ApiError).message });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, createCapital: false }));
    }
  };

  const handleDeleteCapital = async () => {
    if (!token || !activeCapitalDetails || typeof activeCapitalDetails.capital.id !== 'number') {
        toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError') });
        return;
    }
    setActionLoading(prev => ({ ...prev, deleteCapital: true }));
    try {
      await deleteCapital(activeCapitalDetails.capital.id, token);
      toast({ title: t('sharingGroupDeletedSuccessTitle') });
      await fetchUser();
    } catch (err: any) {
      if ((err as ApiError).code !== 401) {
        toast({ variant: 'destructive', title: t('capitalDeleteFailedTitle'), description: (err as ApiError).message });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, deleteCapital: false }));
    }
  };

  const handleCreateInvitation: SubmitHandler<CreateInvitationFormData> = async (data) => {
    if (!token || !activeCapitalDetails || typeof activeCapitalDetails.capital.id !== 'number') {
      toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError')});
      return;
    }
    setActionLoading(prev => ({ ...prev, createInvitation: true }));
    try {
      await createInvitation(activeCapitalDetails.capital.id, { invited: data.invitedEmail, capital_id: activeCapitalDetails.capital.id }, token);
      toast({ title: t('invitationSentSuccessTitle') });
      invitationForm.reset();
      fetchData();
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.code === 401) return;

      let description = apiError.message as string || t('unexpectedError');
      if (typeof apiError.message === 'string' && apiError.message.includes("User have capital")) {
        description = t('userAlreadyInCapitalError');
      }

      toast({ variant: 'destructive', title: t('invitationSendFailedTitle'), description });
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
        await fetchUser(); 
      } else {
        await rejectInvitation(invitationId, token);
        toast({ title: t('invitationRejectedSuccessTitle') });
        fetchData();
      }
    } catch (err: any) {
      if ((err as ApiError).code !== 401) {
        toast({ variant: 'destructive', title: t('invitationActionFailedTitle'), description: (err as ApiError).message });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`invitation_${invitationId}`]: false }));
    }
  };

  const handleRemoveUser = async (userIdToRemove: number) => {
    if (!token || !activeCapitalDetails || typeof activeCapitalDetails.capital.id !== 'number') {
       toast({ variant: 'destructive', title: t('error'), description: t('sharingGroupDetailsMissingError')});
      return;
    }
    if (activeCapitalDetails.capital.owner && userIdToRemove === activeCapitalDetails.capital.owner.id) {
      toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: t('cannotRemoveOwnerError')});
      return;
    }

    setActionLoading(prev => ({ ...prev, [`removeUser_${userIdToRemove}`]: true }));
    try {
      await removeUserFromCapital(userIdToRemove, token);
      toast({ title: t('userRemovedSuccessTitle') });
      fetchData();
    } catch (err: any) {
      if ((err as ApiError).code !== 401) {
        toast({ variant: 'destructive', title: t('userRemoveFailedTitle'), description: (err as ApiError).message });
      }
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
      await fetchUser();
    } catch (err: any) {
      if ((err as ApiError).code !== 401) {
        toast({ variant: 'destructive', title: t('leaveSharingGroupFailedTitle'), description: (err as ApiError).message });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [`leaveCapital_${capitalIdToLeave}`]: false }));
    }
  };
  
  const ownerOfCurrentCapital = useMemo(() => activeCapitalDetails?.capital?.owner, [activeCapitalDetails]);

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
        ) : activeCapitalDetails ? (
          <>
            <h1 className="font-headline text-4xl font-bold text-foreground flex items-center">
              <Briefcase className="mr-3 h-8 w-8 text-primary" />
              {activeCapitalDetails.capital.name}
            </h1>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">{t('capitalOverviewTab')}</TabsTrigger>
                <TabsTrigger value="settings">{t('capitalSettingsTab')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>{t('sharingGroupOverviewTitle')}</CardTitle>
                    {ownerOfCurrentCapital && <CardDescription>{t('ownerLabel')}: {ownerOfCurrentCapital.login} ({ownerOfCurrentCapital.email})</CardDescription>}
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-md">
                          <Label className="text-xs text-muted-foreground">{t('totalVisibleCapitalInGroupLabel')}</Label>
                          <p className="text-2xl font-semibold">
                              <CurrencyDisplay amountInCents={activeCapitalDetails.details.total_capital_sum} currencyCode={user?.userCurrency?.code} />
                          </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-md">
                          <Label className="text-xs text-muted-foreground">{t('yourVisibleCapitalInThisGroupLabel')}</Label>
                          <p className="text-2xl font-semibold">
                              <CurrencyDisplay amountInCents={activeCapitalDetails.details.user_capital_sum} currencyCode={user?.userCurrency?.code} />
                          </p>
                      </div>
                  </CardContent>
                   {user?.id !== ownerOfCurrentCapital?.id && (
                     <CardFooter>
                       <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeaveCapital(activeCapitalDetails.capital.id)}
                          disabled={actionLoading[`leaveCapital_${activeCapitalDetails.capital.id}`]}
                        >
                          {actionLoading[`leaveCapital_${activeCapitalDetails.capital.id}`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LogOut className="mr-1 h-3 w-3" />}
                          {t('leaveSharingGroupButton')}
                        </Button>
                     </CardFooter>
                   )}
                </Card>

                {activeCapitalDetails.details.expenses_by_categories && (
                   <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <PieChart className="h-5 w-5 text-primary" />
                           {t('userExpensesTitle')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <Accordion type="multiple" className="w-full space-y-2">
                            {Object.entries(activeCapitalDetails.details.expenses_by_categories).map(([username, categories]) => {
                               const categoryEntries = Object.entries(categories);
                               return(
                                <AccordionItem value={username} key={username} className="bg-muted/30 rounded-lg">
                                  <AccordionTrigger className="px-4 py-3 text-left hover:no-underline font-medium">
                                    {username}
                                  </AccordionTrigger>
                                  <AccordionContent className="p-4 border-t">
                                    {categoryEntries.length > 0 ? (
                                        <ul className="space-y-2">
                                          {categoryEntries.map(([categoryName, data]) => (
                                              <li key={categoryName} className="flex justify-between items-center text-sm">
                                                  <div className="flex items-center gap-2">
                                                      <div className="h-3 w-3 rounded-full" style={{backgroundColor: data.color || 'hsl(var(--muted-foreground))'}} />
                                                      <span>{t(generateCategoryTranslationKey(categoryName), { defaultValue: categoryName })}</span>
                                                  </div>
                                                  <span className="font-semibold">
                                                      <CurrencyDisplay amountInCents={data.amount} currencyCode={user?.userCurrency?.code} />
                                                  </span>
                                              </li>
                                          ))}
                                        </ul>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">{t('noExpensesReported')}</p>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              )
                            })}
                          </Accordion>
                      </CardContent>
                   </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="mt-6 space-y-6">
                {user?.id === ownerOfCurrentCapital?.id && (
                   <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Users className="h-5 w-5 text-primary" />
                           {t('sharingWithTitle')}
                        </CardTitle>
                        <CardDescription>{t('ownerCanManageUsers')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                         {activeCapitalDetails.capital.users && activeCapitalDetails.capital.users.length > 0 && (
                            <ul className="space-y-2">
                            {activeCapitalDetails.capital.users.map(participant => (
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
                                </li>
                            ))}
                            </ul>
                          )}
                      </CardContent>
                   </Card>
                )}
                 {user?.id === ownerOfCurrentCapital?.id && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Mail className="h-5 w-5 text-primary" />
                           {t('inviteUserToShareLabel')}
                        </CardTitle>
                      </CardHeader>
                       <CardContent>
                          <form onSubmit={invitationForm.handleSubmit(handleCreateInvitation)} className="space-y-4">
                            <div>
                            <div className="flex gap-2 mt-1">
                                <Input id="invitedEmail" type="email" {...invitationForm.register('invitedEmail')} placeholder={t('emailPlaceholder')} className={invitationForm.formState.errors.invitedEmail ? 'border-destructive' : ''} />
                                <Button type="submit" disabled={actionLoading.createInvitation || !activeCapitalDetails}>
                                {actionLoading.createInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {t('sendInviteButton')}
                                </Button>
                            </div>
                            {invitationForm.formState.errors.invitedEmail && <p className="text-sm text-destructive mt-1">{invitationForm.formState.errors.invitedEmail.message}</p>}
                            </div>
                         </form>
                       </CardContent>
                       <Separator className="my-4" />
                       <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            {t('sentInvitationsTitle')}
                          </CardTitle>
                       </CardHeader>
                       <CardContent>
                         {sentInvitations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">{t('invitedUserLabel')}</TableHead>
                                  <TableHead className="text-xs">{t('invitationStatusLabel')}</TableHead>
                                  <TableHead className="text-xs">{t('sentOnLabel')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sentInvitations.map(inv => (
                                  <TableRow key={`sent-${inv.id}`}>
                                    <TableCell className="text-sm">{inv.invitedUser.email}</TableCell>
                                    <TableCell className="text-sm">
                                      {inv.status === 'pending' ? t('statusPending') : 
                                      inv.status === 'accepted' ? t('statusAccepted') :
                                      inv.status === 'rejected' ? t('statusRejected') : inv.status}
                                    </TableCell>
                                    <TableCell className="text-sm">{format(parseISO(inv.createdAt), "PP", { locale: dateFnsLocale })}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                           !invitationsLoadingError && <p className="text-sm text-muted-foreground">{t('noSentInvitationsFound')}</p>
                        )}
                       </CardContent>
                    </Card>
                 )}
                 {user?.id === ownerOfCurrentCapital?.id && (
                    <Card className="shadow-lg border-destructive">
                      <CardHeader>
                         <CardTitle className="text-destructive flex items-center gap-2">
                           <AlertTriangle className="h-5 w-5" />
                           {t('dangerZone')}
                         </CardTitle>
                         <CardDescription>{t('dangerZoneDesc')}</CardDescription>
                      </CardHeader>
                      <CardContent>
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
                              <AlertDialogDescription>{t('confirmDeleteSharingGroupMessage', { name: activeCapitalDetails.capital.name })}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCapital} className="bg-destructive hover:bg-destructive/90">{t('deleteButtonConfirm')}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                          </AlertDialog>
                      </CardContent>
                    </Card>
                 )}
              </TabsContent>

            </Tabs>
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

        {/* Received Invitations Card */}
        {isAuthenticated && receivedInvitations.length > 0 && (
            <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                <Mail className="mr-3 h-6 w-6 text-primary" />
                {t('receivedInvitationsTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {invitationsLoadingError && !capitalLoadingError && ( 
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <CardTitle>{t('errorTitle')}</CardTitle>
                        <CardDescription>{invitationsLoadingError}</CardDescription>
                    </Alert>
                )}
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
            </CardContent>
            </Card>
        )}
      </div>
    );
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          {t('capitalPageTitle')}
        </h1>
        {renderContent()}
      </div>
    </MainLayout>
  );
}
