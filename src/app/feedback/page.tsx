
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { submitFeedback } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { FeedbackTypeOption, type SubmitFeedbackPayload } from '@/types';
import { Send, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';

const createFeedbackSchema = (t: Function) => z.object({
  type: z.nativeEnum(FeedbackTypeOption, {
    required_error: t('feedbackTypeRequiredError'),
  }),
  subject: z.string().min(5, { message: t('feedbackSubjectMinLengthError') }).max(100, { message: t('feedbackSubjectMaxLengthError') }),
  message: z.string().min(10, { message: t('feedbackMessageMinLengthError') }).max(1000, { message: t('feedbackMessageMaxLengthError') }),
});

type FeedbackFormData = z.infer<ReturnType<typeof createFeedbackSchema>>;

export default function FeedbackPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const feedbackSchema = createFeedbackSchema(t);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: undefined,
      subject: '',
      message: '',
    },
  });

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


  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
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

        <Card className="shadow-lg">
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
                <Button type="submit" disabled={isSubmitting || !isAuthenticated}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isSubmitting ? t('feedbackSubmittingButton') : t('feedbackSubmitButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
