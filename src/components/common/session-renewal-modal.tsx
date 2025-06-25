"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '@/lib/api';
import type { ApiError, LoginCredentials } from '@/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SessionRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  email: string | null;
}

const createSessionRenewalSchema = (t: Function) => z.object({
  password: z.string().min(1, { message: t('passwordRequiredError') }),
});

type SessionRenewalFormData = z.infer<ReturnType<typeof createSessionRenewalSchema>>;

export function SessionRenewalModal({ isOpen, onClose, onSuccess, email }: SessionRenewalModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const sessionRenewalSchema = createSessionRenewalSchema(t);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SessionRenewalFormData>({
    resolver: zodResolver(sessionRenewalSchema),
    defaultValues: { password: '' },
  });

  const handleFormSubmit: SubmitHandler<SessionRenewalFormData> = async (data) => {
    if (!email) return;
    setIsSubmitting(true);
    setLocalError(null);

    const credentials: LoginCredentials = {
      username: email,
      password: data.password,
    };

    try {
      const response = await loginUser(credentials);
      onSuccess(response.token);
      reset();
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message as string || t('loginFailedDesc');
      setLocalError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setLocalError(null);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sessionExpiredTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('sessionExpiredDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-password">{t('passwordLabel')}</Label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                id="session-password"
                type="password"
                {...register('password')}
                autoFocus
                className="pl-10"
                />
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {localError && (
             <Alert variant="destructive">
                <AlertTitle>{t('loginFailedTitle')}</AlertTitle>
                <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('logout')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('loginButton')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
