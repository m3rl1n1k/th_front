
"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';

interface SimpleCaptchaProps {
  onChange: (value: string) => void;
  value: string;
  id?: string;
  error?: string;
}

export interface SimpleCaptchaRef {
  validateWithValue: (currentValue: string) => boolean; // Changed method signature
  refresh: () => void;
}

const SimpleCaptcha = forwardRef<SimpleCaptchaRef, SimpleCaptchaProps>(
  ({ onChange, value, id = "captcha", error }, ref) => {
    const { t } = useTranslation();
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [expectedSum, setExpectedSum] = useState(0);

    const generateNewChallenge = () => {
      const n1 = Math.floor(Math.random() * 10) + 1;
      const n2 = Math.floor(Math.random() * 10) + 1;
      setNum1(n1);
      setNum2(n2);
      setExpectedSum(n1 + n2);
      onChange(''); // Clear previous answer
    };

    useEffect(() => {
      generateNewChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      validateWithValue: (currentValue: string) => {
        const numericValue = parseInt(currentValue, 10);
        return !isNaN(numericValue) && numericValue === expectedSum;
      },
      refresh: generateNewChallenge,
    }));

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center">
          {t('captchaLabel')} ({num1} + {num2} = ?)
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={generateNewChallenge}
            className="ml-2 h-6 w-6"
            aria-label={t('refreshCaptchaLabel')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Label>
        <Input
          id={id}
          type="text" // Changed type to text
          inputMode="numeric" // Added inputMode
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('captchaPlaceholder')}
          className={error ? 'border-destructive' : ''}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

SimpleCaptcha.displayName = 'SimpleCaptcha';
export { SimpleCaptcha };

