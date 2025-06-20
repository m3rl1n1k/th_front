
"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/i18n-context';
import { Brain, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const GEMINI_API_KEY_STORAGE_KEY = 'financeflow_gemini_api_key';

export default function AiReportPage() {
  const { t } = useTranslation();
  const [apiKeySet, setApiKeySet] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      setApiKeySet(!!storedKey);
    }
    setIsLoadingKey(false);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <Brain className="mr-3 h-8 w-8 text-primary" />
          {t('aiReportPageTitle')}
        </h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('aiReportPageTitle')}</CardTitle>
            <CardDescription>{t('aiReportPageDesc') || 'Leverage AI for deeper insights into your financial patterns and potential optimizations.'}</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-10">
            {isLoadingKey ? (
               <p>{t('loading')}...</p>
            ) : apiKeySet ? (
              <>
                <Brain className="mx-auto h-16 w-16 text-primary mb-4" />
                <p className="text-lg text-muted-foreground">
                  {t('aiReportComingSoon') || 'AI-powered reporting features are under development.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('aiReportEnsureKeyNote') || 'Ensure your Gemini API Key remains valid for future features.'}
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
                <p className="text-lg font-semibold text-destructive-foreground mb-2">
                  {t('aiReportApiKeyMissingTitle') || 'Gemini API Key Required'}
                </p>
                <p className="text-muted-foreground mb-4">
                  {t('aiReportApiKeyMissingDesc') || 'To use AI-powered reporting features, please configure your Gemini API Key in the settings.'}
                </p>
                <Button asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('navigateToSettings')}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
