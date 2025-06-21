
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { submitFeedback, getFeedbacks } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { FeedbackTypeOption, type SubmitFeedbackPayload, type Feedback as FeedbackItemType } from '@/types';
import { Send, MessageSquare, ArrowLeft, Loader2, History, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const createFeedbackSchema = (t: Function) => z.object({
  type: z.nativeEnum(FeedbackTypeOption, {
    required_error: t('feedbackTypeRequiredError'),
  }),
  subject: z.string().min(5, { message: t('feedbackSubjectMinLengthError') }).max(100, { message: t('feedbackSubjectMaxLengthError') }),
  message: z.string().min(10, { message: t('feedbackMessageMinLengthError') }).max(1000, { message: t('feedbackMessageMaxLengthError') }),
});

type FeedbackFormData = z.infer<ReturnType<typeof createFeedbackSchema>>;

export default function FeedbackPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackItemType[]>([]);
  const [isLoadingMyFeedbacks, setIsLoadingMyFeedbacks] = useState(true);

  const feedbackSchema = createFeedbackSchema(t);

  const { control, handleSubmit, formState: { errors, isSubmitting: formIsSubmitting }, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: undefined,
      subject: '',
      message: '',
    },
  });

  const fetchMyFeedbacks = useCallback(() => {
    if (isAuthenticated && token && user) {
      setIsLoadingMyFeedbacks(true);
      getFeedbacks(token)
        .then(response => {
          const allFeedbacks = response.feedbacks || [];
          const userFeedbacks = allFeedbacks
            .filter(fb => fb.user?.id === user.id)
            .map(fb => ({
              ...fb,
              type: String(fb.type || '').toUpperCase() as FeedbackTypeOption,
            }));
          setMyFeedbacks(userFeedbacks);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setMyFeedbacks([]);
        })
        .finally(() => {
          setIsLoadingMyFeedbacks(false);
        });
    } else {
        setIsLoadingMyFeedbacks(false);
        setMyFeedbacks([]);
    }
  }, [token, isAuthenticated, user, toast, t]);


  useEffect(() => {
    fetchMyFeedbacks();
  }, [fetchMyFeedbacks]);


  const onSubmit: SubmitHandler<FeedbackFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }

    const payload: SubmitFeedbackPayload = {
      type: data.type,
      subject: data.subject,
      message: data.message,
    };

    try {
      await submitFeedback(payload, token);
      toast({
        title: t('feedbackSubmittedTitle'),
        description: t('feedbackSubmittedDesc'),
      });
      reset(); // Clear the form
      fetchMyFeedbacks(); // Refresh the list after submission
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('feedbackSubmitFailedTitle'),
        description: error.message || t('unexpectedError'),
      });
    }
  };

  const feedbackTypeOptions = Object.values(FeedbackTypeOption).map((value) => ({
    value,
    label: t(`feedbackType_${value}` as any, { defaultValue: value.replace(/_/g, ' ') }),
  }));

  const getFeedbackTypeBadgeVariant = (type: FeedbackTypeOption): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case FeedbackTypeOption.BUG_REPORT: return "destructive";
      case FeedbackTypeOption.FEATURE_REQUEST: return "default"; // primary
      case FeedbackTypeOption.QUESTION: return "secondary";
      case FeedbackTypeOption.GENERAL_FEEDBACK: return "outline";
      default: return "outline";
    }
  };


  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
            <MessageSquare className="mr-3 h-8 w-8 text-primary" />
            {t('feedbackPageTitle')}
          </h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>{t('feedbackFormTitle')}</CardTitle>
                <CardDescription>{t('feedbackFormDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('feedbackTypeLabel')}</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
                            <SelectValue placeholder={t('feedbackTypePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {feedbackTypeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('feedbackSubjectLabel')}</Label>
                    <Input
                      id="subject"
                      {...control.register('subject')}
                      placeholder={t('feedbackSubjectPlaceholder')}
                      className={errors.subject ? 'border-destructive' : ''}
                    />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('feedbackMessageLabel')}</Label>
                    <Textarea
                      id="message"
                      {...control.register('message')}
                      placeholder={t('feedbackMessagePlaceholder')}
                      className={errors.message ? 'border-destructive' : ''}
                      rows={6}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={formIsSubmitting || !isAuthenticated}>
                      {formIsSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {formIsSubmitting ? t('feedbackSubmittingButton') : t('feedbackSubmitButton')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="mr-2 h-5 w-5 text-primary" />
                  {t('yourSubmittedFeedbackTitle')}
                </CardTitle>
                <CardDescription>{t('yourSubmittedFeedbackDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMyFeedbacks ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : myFeedbacks.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                    <p>{t('youHaveNotSubmittedFeedback')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('feedbackTypeLabel')}</TableHead>
                          <TableHead>{t('feedbackSubjectLabel')}</TableHead>
                          <TableHead className="text-right">{t('feedbackSubmittedAtLabel')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myFeedbacks.map(fb => (
                          <TableRow key={fb.id}>
                            <TableCell>
                              <Badge variant={getFeedbackTypeBadgeVariant(fb.type)}>
                                {t(`feedbackType_${fb.type}` as any, { defaultValue: (fb.type || '').replace(/_/g, ' ') })}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{fb.subject}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                                {fb.createdAt ? format(parseISO(fb.createdAt), "PP", { locale: dateFnsLocale }) : t('notApplicable')}
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
        </div>
      </div>
    </MainLayout>
  );
}
