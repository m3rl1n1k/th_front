"use client";

// This file is deprecated. The new verification page is at /email-verification.

import React from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { Loader2 } from 'lucide-react';

export default function DeprecatedVerifyPage() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('loading')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </PublicLayout>
  );
}
