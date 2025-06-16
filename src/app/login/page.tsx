
"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleCaptcha, type SimpleCaptchaRef } from '@/components/common/simple-captcha';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock } from 'lucide-react';
import type { ApiError } from '@/types';

const createLoginSchema = (t: Function) => z.object({
  email: z.string().email({ message: t('invalidEmail') }),
  password: z.string().min(1, { message: t('passwordRequiredError') }),
  captcha: z.string().min(1, { message: t('captchaRequiredError') }),
});

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const captchaRef = useRef<SimpleCaptchaRef>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const loginSchema = createLoginSchema(t);

  const { control, handleSubmit, setError, getValues, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', captcha: '' },
  });

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authIsLoading, isAuthenticated, router]);

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    const captchaValueFromRHF = getValues("captcha");
    if (captchaRef.current && !captchaRef.current.validateWithValue(captchaValueFromRHF)) {
      setError("captcha", { type: "manual", message: t('captchaIncorrectError') });
      captchaRef.current.refresh();
      return;
    }
    setIsSubmittingForm(true);
    try {
      await login({ username: data.email, password: data.password });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('loginFailedTitle'),
        description: apiError.message || t('loginFailedDesc'),
      });
      captchaRef.current?.refresh();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (authIsLoading && !isAuthenticated) { 
    return (
      <PublicLayout>
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-foreground">{t('loading')}</p>
        </div>
      </PublicLayout>
    );
  }
  
  if (isAuthenticated) { 
      return null;
  }

  return (
    <PublicLayout>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn size={32} />
          </div>
          <CardTitle className="font-headline text-3xl">{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...field} className={`pl-10 ${errors.email ? 'border-destructive' : ''}`} />
                  )}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input id="password" type="password" placeholder="••••••••" {...field} className={`pl-10 ${errors.password ? 'border-destructive' : ''}`} />
                  )}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            
            <Controller
              name="captcha"
              control={control}
              render={({ field }) => (
                <SimpleCaptcha ref={captchaRef} {...field} error={errors.captcha?.message} />
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmittingForm || authIsLoading}>
              {isSubmittingForm || authIsLoading ? t('loggingInButton') : t('loginButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-center justify-center text-sm">
          <p className="text-muted-foreground">
            {t('noAccountPrompt')}{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('registerHereLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </PublicLayout>
  );
}
