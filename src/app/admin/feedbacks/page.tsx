
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { getFeedbacks } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { FeedbackTypeOption } from '@/types';
import type { Feedback as FeedbackItemType } from '@/types';
import { Loader2, ShieldAlert, ClipboardList, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REQUIRED_ROLE = "ROLE_MODERATOR_FEEDBACK";

export default function AdminFeedbacksPage() {
  const { token, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  const [feedbacks, setFeedbacks] = useState<FeedbackItemType[] | null>(null);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const userHasRequiredRole = useCallback(() => {
    return user?.roles?.includes(REQUIRED_ROLE) || false;
  }, [user]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to settle

    if (!isAuthenticated) {
      router.replace('/login'); // Should be handled by MainLayout, but good fallback
      return;
    }

    if (!userHasRequiredRole()) {
      setAccessDenied(true);
      setIsLoadingFeedbacks(false);
      return;
    }
    setAccessDenied(false);

    if (token) {
      setIsLoadingFeedbacks(true);
      getFeedbacks(token)
        .then(response => {
          // Normalize the 'type' field from snake_case to UPPER_SNAKE_CASE
          const normalizedFeedbacks = (response.feedbacks || []).map(fb => ({
            ...fb,
            type: String(fb.type).toUpperCase() as FeedbackTypeOption,
          }));
          setFeedbacks(normalizedFeedbacks);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setFeedbacks([]);
        })
        .finally(() => {
          setIsLoadingFeedbacks(false);
        });
    }
  }, [token, isAuthenticated, authLoading, userHasRequiredRole, router, t, toast]);


  const getFeedbackTypeBadgeVariant = (type: FeedbackTypeOption): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case FeedbackTypeOption.BUG_REPORT: return "destructive";
      case FeedbackTypeOption.FEATURE_REQUEST: return "default"; // primary
      case FeedbackTypeOption.QUESTION: return "secondary";
      case FeedbackTypeOption.GENERAL_FEEDBACK: return "outline";
      default: return "outline";
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('feedbackTypeLabel')}</TableHead>
                      <TableHead>{t('feedbackSubjectLabel')}</TableHead>
                      <TableHead>{t('feedbackMessageLabel')}</TableHead>
                      <TableHead>{t('feedbackSubmittedByLabel')}</TableHead>
                      <TableHead>{t('feedbackSubmittedAtLabel')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map(fb => (
                      <TableRow key={fb.id}>
                        <TableCell>
                          <Badge variant={getFeedbackTypeBadgeVariant(fb.type)}>
                            {t(`feedbackType_${fb.type}` as any, { defaultValue: (fb.type || '').replace(/_/g, ' ') })}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{fb.subject}</TableCell>
                        <TableCell className="max-w-xs truncate" title={fb.message}>{fb.message}</TableCell>
                        <TableCell>{fb.user?.login || t('anonymousUser')}</TableCell>
                        <TableCell>{fb.createdAt ? format(parseISO(fb.createdAt), "PPp", { locale: dateFnsLocale }) : t('notApplicable')}</TableCell>
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
