
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/i18n-context';
import { verifyEmail } from '@/lib/api';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ApiError } from '@/types';

function VerifyEmailContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>(t('verifyingYourEmail'));

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verificationTokenMissing'));
      return;
    }

    const doVerification = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
      } catch (error) {
        const apiError = error as ApiError;
        setStatus('error');
        setMessage(apiError.message || t('verificationFailedError'));
      }
    };

    doVerification();
  }, [token, t]);

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
        {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500" />}
        {status === 'error' && <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />}
        <CardTitle className="font-headline text-3xl mt-4">
          {status === 'loading' && t('verificationInProgressTitle')}
          {status === 'success' && t('verificationSuccessTitle')}
          {status === 'error' && t('verificationFailedTitle')}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {status !== 'loading' && (
          <Button asChild className="w-full">
            <Link href="/login">{t('proceedToLoginButton')}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmailVerificationPage() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>{t('loading')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </PublicLayout>
  );
}
