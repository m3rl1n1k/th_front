"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MailWarning, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resendVerificationEmail } from '@/lib/api';
import type { ApiError } from '@/types';

export function EmailVerificationBanner() {
  const { user, token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleResend = async () => {
    if (!token) return;
    setIsSending(true);
    try {
      const response = await resendVerificationEmail(token);
      toast({
        title: t('emailSentTitle'),
        description: response.message,
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: 'destructive',
        title: t('errorSendingEmailTitle'),
        description: apiError.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated || !user || user.isVerified || !isVisible) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-800 dark:bg-yellow-500/20 dark:border-yellow-500/40 dark:text-yellow-200 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
        <MailWarning className="h-5 w-5" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
            <AlertTitle className="font-bold">{t('verifyYourEmailTitle')}</AlertTitle>
            <AlertDescription>
                {t('verifyYourEmailDesc')}
            </AlertDescription>
            </div>
            <div className="flex-shrink-0 flex gap-2 w-full sm:w-auto">
                <Button onClick={handleResend} variant="outline" className="w-full sm:w-auto border-yellow-500/50 hover:bg-yellow-500/20" disabled={isSending}>
                    {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('resendEmailButton')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="hover:bg-yellow-500/20">
                    {t('dismissButton')}
                </Button>
            </div>
        </div>
        </Alert>
    </div>
  );
}