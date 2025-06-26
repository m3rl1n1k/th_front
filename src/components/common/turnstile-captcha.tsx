
"use client";

import React, { forwardRef, useImperativeHandle } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/i18n-context';

interface TurnstileCaptchaProps {
  onSuccess: (token: string) => void;
  error?: string;
}

export interface TurnstileCaptchaRef {
    reset: () => void;
}

// Site Key provided by the user
const SITE_KEY = '0x4AAAAAABick5l4CGDJ6YlI';

export const TurnstileCaptcha = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
    ({ onSuccess, error }, ref) => {
    const { resolvedTheme } = useTheme();
    const { t } = useTranslation();
    const turnstileRef = React.useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            turnstileRef.current?.reset();
        }
    }));
  
    return (
        <div className="space-y-2">
            <Label htmlFor="cf-turnstile">{t('captchaLabel')}</Label>
            <Turnstile
                ref={turnstileRef}
                id="cf-turnstile"
                siteKey={SITE_KEY}
                onSuccess={onSuccess}
                options={{
                    theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                    language: 'auto',
                }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
});

TurnstileCaptcha.displayName = 'TurnstileCaptcha';
