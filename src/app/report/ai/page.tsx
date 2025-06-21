
"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/i18n-context';
import { Brain, Settings } from 'lucide-react';
import Link from 'next/link';

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
          <CardContent className="space-y-6">
            <p>{t('aiReportEnsureKeyNote')}</p>
            <div className="flex justify-start">
              <Button asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigateToSettings')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
