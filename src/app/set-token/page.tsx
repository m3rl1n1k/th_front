
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useGlobalLoader } from '@/context/global-loader-context';
import { useTranslation } from '@/context/i18n-context';
import { KeyRound, LogIn } from 'lucide-react';
import Link from 'next/link';

const SetTokenSchema = z.object({
  token: z.string().min(1, { message: "Token cannot be empty." }), // Basic validation
});

type SetTokenFormData = z.infer<typeof SetTokenSchema>;

export default function SetTokenPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setTokenManually, token: currentToken, isLoading: authLoading } = useAuth();
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SetTokenFormData>({
    resolver: zodResolver(SetTokenSchema),
    defaultValues: {
      token: currentToken || '', // Pre-fill with current token if available
    },
  });

  const onSubmit: SubmitHandler<SetTokenFormData> = async (data) => {
    setGlobalLoading(true);
    try {
      await setTokenManually(data.token); // Auth context handles toast for success/revert
      // No need for an additional toast here as auth-context handles it.
      router.push('/dashboard');
    } catch (error: any) {
      // This catch is unlikely to be hit if setTokenManually itself doesn't throw
      // and handles its errors with toasts.
      console.error("Error setting token:", error);
    } finally {
      // setGlobalLoading(false) // Global loader is turned off by navigation events
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound size={32} />
          </div>
          <CardTitle className="font-headline text-3xl">{t('manualTokenTitle')}</CardTitle>
          <CardDescription>{t('manualTokenDescription')}</CardDescription>
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
              {isSubmitting || authLoading ? t('loading') : t('submitTokenButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-center justify-center text-sm">
          <p className="text-muted-foreground">
            {/* Link to dashboard or login if applicable */}
            Go back to{' '}
            <Link href="/dashboard" className="font-medium text-primary hover:underline">
              {t('dashboard')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
