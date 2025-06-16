
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { KeyRound, ArrowLeft } from 'lucide-react'; // Replaced LogIn with ArrowLeft
import Link from 'next/link';

const SetTokenSchema = z.object({
  token: z.string().min(1, { message: "Token cannot be empty." }),
});

type SetTokenFormData = z.infer<typeof SetTokenSchema>;

export default function SetTokenPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setTokenManually, token: currentToken, isLoading: authLoading } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SetTokenFormData>({
    resolver: zodResolver(SetTokenSchema),
    defaultValues: {
      token: currentToken || '', 
    },
  });

  const onSubmit: SubmitHandler<SetTokenFormData> = async (data) => {
    try {
      await setTokenManually(data.token);
      router.push('/dashboard'); // If token is valid, auth context should redirect or update user state
    } catch (error: any) {
      // Auth context handles toasts for success/revert
    }
  };

  return (
    <PublicLayout>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound size={32} />
          </div>
          <CardTitle className="font-headline text-3xl">{t('manualTokenTitle')}</CardTitle>
          <CardDescription>{t('manualTokenDescriptionDev')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">{t('jwtToken')}</Label>
              <Input
                id="token"
                type="text"
                {...register('token')}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className={errors.token ? 'border-destructive' : ''}
              />
              {errors.token && <p className="text-sm text-destructive">{errors.token.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
              {isSubmitting || authLoading ? t('submittingTokenButton') : t('submitTokenButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-center justify-center text-sm">
          <Button variant="outline" onClick={() => router.back()} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
          <p className="mt-4 text-muted-foreground">
            {t('orGoTo')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('loginPageLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </PublicLayout>
  );
}
