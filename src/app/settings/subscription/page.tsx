
"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { Loader2 } from 'lucide-react';

export default function DeprecatedSubscriptionPage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('loading')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {/* This page is deprecated. Subscription management is now on the Profile page. */}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
