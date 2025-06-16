
"use client";

import React, { useRef, useState } from 'react';
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
import { UserPlus, LogIn, Mail, User, Lock } from 'lucide-react';
import type { ApiError } from '@/types';

const createRegistrationSchema = (t: Function) => z.object({
  email: z.string().email({ message: t('invalidEmail') }),
  login: z.string().min(3, { message: t('loginMinLengthError') }).max(50, { message: t('loginMaxLengthError') }),
  password: z.string().min(6, { message: t('passwordMinLengthError') }),
  confirmPassword: z.string(),
  captcha: z.string().min(1, { message: t('captchaRequiredError') }),
}).refine(data => data.password === data.confirmPassword, {
  message: t('passwordsDoNotMatchError'),
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<ReturnType<typeof createRegistrationSchema>>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const captchaRef = useRef<SimpleCaptchaRef>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const registrationSchema = createRegistrationSchema(t);

  const { control, handleSubmit, setError, getValues, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { email: '', login: '', password: '', confirmPassword: '', captcha: '' },
  });

  const onSubmit: SubmitHandler<RegistrationFormData> = async (data) => {
    const captchaValueFromRHF = getValues("captcha");
    if (captchaRef.current && !captchaRef.current.validateWithValue(captchaValueFromRHF)) {
      setError("captcha", { type: "manual", message: t('captchaIncorrectError') });
      captchaRef.current.refresh();
      return;
    }
    setIsSubmittingForm(true);
    try {
      await registerUser({ email: data.email, login: data.login, password: data.password });
      toast({
        title: t('registrationSuccessTitle'),
        description: t('registrationSuccessDesc'),
      });
      router.push('/login');
    } catch (error) {
      const apiError = error as ApiError;
       let errorMessage = apiError.message || t('registrationFailedError');
       if (apiError.errors) {
         Object.entries(apiError.errors).forEach(([field, messages]) => {
           if (field as keyof RegistrationFormData) {
            setError(field as keyof RegistrationFormData, { type: 'server', message: messages.join(', ') });
           }
         });
         errorMessage = t('validationFailedCheckFields');
       }
      toast({ variant: "destructive", title: t('registrationFailedTitle'), description: errorMessage });
      captchaRef.current?.refresh();
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <PublicLayout>
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus size={32} />
          </div>
          <CardTitle className="font-headline text-3xl">{t('createAccountTitle')}</CardTitle>
          <CardDescription>{t('createAccountSubtitle')}</CardDescription>
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
              <Label htmlFor="login">{t('loginLabel')}</Label>
               <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Controller
                  name="login"
                  control={control}
                  render={({ field }) => (
                    <Input id="login" type="text" placeholder={t('loginPlaceholder')} {...field} className={`pl-10 ${errors.login ? 'border-destructive' : ''}`} />
                  )}
                />
              </div>
              {errors.login && <p className="text-sm text-destructive">{errors.login.message}</p>}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input id="confirmPassword" type="password" placeholder="••••••••" {...field} className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`} />
                  )}
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            
            <Controller
              name="captcha"
              control={control}
              render={({ field }) => (
                <SimpleCaptcha ref={captchaRef} {...field} error={errors.captcha?.message} />
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmittingForm}>
              {isSubmittingForm ? t('registeringButton') : t('registerButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-center justify-center text-sm">
          <p className="text-muted-foreground">
            {t('alreadyHaveAccountPrompt')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('loginHereLink')}
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('byRegisteringAgreeTo')}{' '}
            <Link href="/terms" className="underline hover:text-primary">
              {t('termsOfServiceLink')}
            </Link>.
          </p>
        </CardFooter>
      </Card>
    </PublicLayout>
  );
}
