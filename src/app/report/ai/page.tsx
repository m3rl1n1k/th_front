
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/i18n-context';
import { Brain, Settings, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getDashboardMonthlyIncome, getDashboardMonthExpenses, getDashboardChartTotalExpense } from '@/lib/api';
import type { GenerateReportSummaryInput, CategoryMonthlySummary } from '@/ai/flows/generate-report-summary-flow';
import { format, getYear, getMonth } from 'date-fns';

const GEMINI_API_KEY_STORAGE_KEY = 'financeflow_gemini_api_key';

export default function AiReportPage() {
  const { t, language, dateFnsLocale } = useTranslation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [apiKeySet, setApiKeySet] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      setApiKeySet(!!storedKey);
    }
    setIsLoadingKey(false);
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!token || !user?.userCurrency?.code) {
      toast({ variant: "destructive", title: t('error'), description: t('aiReport.missingPrerequisites') });
      return;
    }

    setIsGeneratingReport(true);
    setReportSummary(null);
    setReportError(null);

    try {
      const currentMonthDate = new Date();
      const selectedYear = getYear(currentMonthDate);
      const selectedMonth = getMonth(currentMonthDate) + 1; // 1-12
      const monthName = format(currentMonthDate, 'MMMM', { locale: dateFnsLocale });
      const currencyCode = user.userCurrency.code;

      const [incomeData, expenseData, chartDataResponse] = await Promise.all([
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
        getDashboardChartTotalExpense(token),
      ]);

      const categorySummaryForAI: CategoryMonthlySummary[] = chartDataResponse?.month_expense_chart
        ? Object.entries(chartDataResponse.month_expense_chart).map(([name, data]) => ({
            categoryName: name,
            amount: data.amount,
            color: data.color,
          }))
        : [];

      const inputPayload: GenerateReportSummaryInput = {
        reportStats: {
          selectedMonthIncome: incomeData.month_income,
          selectedMonthExpense: expenseData.month_expense,
          // startOfMonthBalance and endOfMonthBalance are optional and not easily available from dashboard
        },
        categorySummary: categorySummaryForAI,
        selectedYear,
        selectedMonth,
        monthName,
        currencyCode,
        language,
        // yearlySummary is optional and omitted for now
      };

      const response = await fetch('/api/generate-report-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('aiReport.generationFailedError'));
      }

      const result = await response.json();
      setReportSummary(result.summaryText);

    } catch (error: any) {
      console.error("Error generating AI report:", error);
      setReportError(error.message || t('aiReport.unexpectedError'));
      toast({ variant: "destructive", title: t('aiReport.generationFailedTitle'), description: error.message });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [token, user, language, dateFnsLocale, t, toast]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <Brain className="mr-3 h-8 w-8 text-primary" />
          {t('aiReportPageTitle')}
        </h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('aiReport.getYourSummaryTitle')}</CardTitle>
            <CardDescription>{t('aiReport.getYourSummaryDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingKey ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !apiKeySet ? (
              <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
                <p className="text-lg font-semibold text-destructive-foreground mb-2">
                  {t('aiReportApiKeyMissingTitle')}
                </p>
                <p className="text-muted-foreground mb-4">
                  {t('aiReportApiKeyMissingDesc')}
                </p>
                <Button asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('navigateToSettings')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isGeneratingReport ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isGeneratingReport ? t('aiReport.generatingButton') : t('aiReport.generateButton')}
                </Button>
              </div>
            )}

            {reportSummary && (
              <Card className="mt-6 bg-muted/30 dark:bg-muted/10">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    {t('aiReport.summaryTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    <p>{reportSummary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {reportError && (
              <Card className="mt-6 border-destructive bg-destructive/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t('aiReport.errorTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive-foreground">{reportError}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
