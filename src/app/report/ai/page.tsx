
"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { Brain } from 'lucide-react';

export default function AiReportPage() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <Brain className="mr-3 h-8 w-8 text-primary" />
          {t('aiReportPageTitle')}
        </h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('aiReportComingSoon')}</CardTitle>
            <CardDescription>{t('aiReportPageDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This feature is currently under development. Stay tuned for AI-powered insights into your finances!</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
