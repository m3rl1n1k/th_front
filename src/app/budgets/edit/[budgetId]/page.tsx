
"use client";

// This file is effectively replaced by /src/app/budgets/summary/[date]/[id]/page.tsx
// Its content is intentionally left blank as per the migration to the new route.

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { Loader2 } from 'lucide-react';

export default function DeprecatedEditBudgetPage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('loading')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {/* This page should not be directly accessed. */}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
