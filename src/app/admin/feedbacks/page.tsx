
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { getFeedbacks, updateFeedbackStatus, deleteFeedback } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { FeedbackTypeOption } from '@/types';
import type { Feedback as FeedbackItemType, ApiError, UpdateFeedbackStatusPayload } from '@/types';
import { Loader2, ShieldAlert, ClipboardList, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const REQUIRED_ROLE = "ROLE_MODERATOR_FEEDBACK";

type FeedbackStatus = 'pending' | 'active' | 'complete';

const feedbackStatuses: FeedbackStatus[] = ['pending', 'active', 'complete'];

export default function AdminFeedbacksPage() {
  const { token, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  const [feedbacks, setFeedbacks] = useState<FeedbackItemType[] | null>(null);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [statusChanges, setStatusChanges] = useState<Record<string, FeedbackStatus>>({});

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FeedbackItemType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userHasRequiredRole = useCallback(() => {
    return user?.roles?.includes(REQUIRED_ROLE) || false;
  }, [user]);

  const fetchFeedbacks = useCallback(() => {
    if (token && userHasRequiredRole()) {
      setIsLoadingFeedbacks(true);
      getFeedbacks(token)
        .then(response => {
          const normalizedFeedbacks = (response.feedbacks || []).map(fb => ({
            ...fb,
            type: String(fb.type).toUpperCase() as FeedbackTypeOption,
            status: fb.status || 'pending',
          })).sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
          setFeedbacks(normalizedFeedbacks);
        })
        .catch((error: ApiError) => {
          setFeedbacks([]);
        })
        .finally(() => {
          setIsLoadingFeedbacks(false);
        });
    }
  }, [token, userHasRequiredRole]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!userHasRequiredRole()) {
      setAccessDenied(true);
      setIsLoadingFeedbacks(false);
      return;
    }
    setAccessDenied(false);
    fetchFeedbacks();
  }, [token, isAuthenticated, authLoading, userHasRequiredRole, router, fetchFeedbacks]);


  const getFeedbackTypeBadgeVariant = (type: FeedbackTypeOption): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case FeedbackTypeOption.BUG_REPORT: return "destructive";
      case FeedbackTypeOption.FEATURE_REQUEST: return "default";
      case FeedbackTypeOption.QUESTION: return "secondary";
      case FeedbackTypeOption.GENERAL_FEEDBACK: return "outline";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status?: string | null): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'active': return 'default';
      case 'complete': return 'secondary';
      case 'pending':
      default:
        return 'destructive';
    }
  }

  const handleStatusChange = (feedbackId: string | number, newStatus: FeedbackStatus) => {
    setStatusChanges(prev => ({ ...prev, [feedbackId]: newStatus }));
  };

  const handleSaveStatus = async (feedbackId: string | number) => {
    const newStatus = statusChanges[feedbackId];
    if (!newStatus || !token) return;

    setUpdatingStatus(prev => ({ ...prev, [feedbackId]: true }));
    try {
      const payload: UpdateFeedbackStatusPayload = { status: newStatus };
      await updateFeedbackStatus(feedbackId, payload, token);
      toast({ title: t('statusUpdatedSuccess') });
      fetchFeedbacks(); // Refresh data
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorUpdatingStatus'), description: error.message || t('unexpectedError') });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [feedbackId]: false }));
      setStatusChanges(prev => {
        const newChanges = {...prev};
        delete newChanges[feedbackId];
        return newChanges;
      });
    }
  };

  const openDeleteDialog = (item: FeedbackItemType) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete || !token) return;

    setIsDeleting(true);
    try {
      await deleteFeedback(itemToDelete.id, token);
      toast({ title: t('feedbackDeletedTitle', { defaultValue: 'Feedback deleted' }), description: t('feedbackDeletedDesc', { defaultValue: `Feedback "${itemToDelete.subject}" has been deleted.` }) });
      fetchFeedbacks(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorDeletingFeedback'), description: error.message || t('unexpectedError') });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  if (authLoading || (!accessDenied && isLoadingFeedbacks && feedbacks === null)) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (accessDenied) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <ShieldAlert className="mr-2 h-6 w-6" />
              {t('accessDeniedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('accessDeniedMessage')}</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <ClipboardList className="mr-3 h-8 w-8 text-primary" />
          {t('adminFeedbacksPageTitle')}
        </h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('submittedFeedbacksTitle')}</CardTitle>
            <CardDescription>{t('submittedFeedbacksDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFeedbacks ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !feedbacks || feedbacks.length === 0 ? (
              <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('noFeedbacksFound')}</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {feedbacks.map(fb => (
                  <AccordionItem value={String(fb.id)} key={fb.id} className="bg-muted/30 rounded-lg">
                    <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{fb.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('feedbackSubmittedByLabel')}: {fb.user?.login || t('anonymousUser')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                            <Badge variant={getFeedbackTypeBadgeVariant(fb.type)} className="text-xs">
                              {t(`feedbackType_${fb.type}` as any, { defaultValue: (fb.type || '').replace(/_/g, ' ') })}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(fb.status)} className="text-xs">
                                {t(`status_${fb.status || 'pending'}` as any, { defaultValue: (fb.status || 'pending') })}
                            </Badge>
                          </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                      <p className="mb-4 text-sm text-foreground whitespace-pre-wrap">{fb.message}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {t('feedbackSubmittedAtLabel')}: {fb.createdAt ? format(parseISO(fb.createdAt), "PPp", { locale: dateFnsLocale }) : t('notApplicable')}
                      </p>
                      <div className="flex flex-col sm:flex-row items-end gap-2">
                        <div className="space-y-1 flex-grow w-full sm:w-auto">
                          <Label htmlFor={`status-${fb.id}`} className="text-xs">{t('feedbackStatusLabel')}</Label>
                           <Select
                            onValueChange={(value) => handleStatusChange(fb.id, value as FeedbackStatus)}
                            defaultValue={fb.status || 'pending'}
                          >
                            <SelectTrigger id={`status-${fb.id}`} className="w-full sm:w-48 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {feedbackStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                  {t(`status_${status}` as any, {defaultValue: status})}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => handleSaveStatus(fb.id)}
                            disabled={!statusChanges[fb.id] || updatingStatus[fb.id]}
                            size="sm"
                            className="flex-grow sm:flex-grow-0"
                          >
                            {updatingStatus[fb.id] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {t('saveStatusButton')}
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(fb)}
                            disabled={isDeleting}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteFeedbackConfirmTitle', { defaultValue: 'Confirm Deletion' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteFeedbackConfirmMessage', { defaultValue: 'Are you sure you want to delete this feedback item?' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
