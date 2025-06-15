"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { KeyRound, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGlobalLoader } from '@/context/global-loader-context';

const tokenSchema = z.object({
  token: z.string().min(1, { message: "tokenRequired" }),
});

type TokenFormInputs = z.infer<typeof tokenSchema>;

export default function SetTokenPage() {
  const { setTokenManually, isLoading: authLoading, isAuthenticated, token: currentToken } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<TokenFormInputs>({
    resolver: zodResolver(tokenSchema),
  });

  useEffect(() => {
    if (currentToken) {
      setValue('token', currentToken);
    }
  }, [currentToken, setValue]);

  useEffect(() => {
    // Added this to ensure loader turns off after initial auth check or token set completes
    if (!authLoading) {
      setGlobalLoading(false);
    }
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router, setGlobalLoading]);


  const onSubmit: SubmitHandler<TokenFormInputs> = async (data) => {
    setIsSubmitting(true);
    setGlobalLoading(true); // Ensure global loader is on
    setTokenManually(data.token);
    // Auth context will set its isLoading to false once fetchUser completes.
    // We rely on the useEffect above to turn off global loader when authLoading becomes false.
    // Or, if navigation to dashboard occurs, NavigationEvents will handle it.
    setIsSubmitting(false); // Local submit state
  };
  
  if (isAuthenticated) {
     return ( // Full screen loader while redirecting
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-foreground">{t('loading')}</p>
          </div>
        </div>
      );
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block mx-auto p-3 bg-primary/10 rounded-full mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">{t('manualTokenTitle')}</CardTitle>
          <CardDescription>{t('manualTokenDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-foreground/80">{t('jwtToken')}</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your JWT token here"
                {...register('token')}
                aria-invalid={errors.token ? "true" : "false"}
              />
              {errors.token && <p className="text-sm text-destructive">{t(errors.token.message as keyof ReturnType<typeof useTranslation>['translations'] || 'Token is required')}</p>}
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={isSubmitting || authLoading}>
              {(isSubmitting || authLoading) && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {t('submitTokenButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full" onClick={() => setGlobalLoading(true)}>
            <Button variant="outline" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              {t('login')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
