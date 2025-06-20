
"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Save, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const LAST_TRANSACTIONS_LIMIT_KEY = 'dashboardLastTransactionsLimit';
const DEFAULT_LAST_TRANSACTIONS_LIMIT = 10;
const GEMINI_API_KEY_STORAGE_KEY = 'financeflow_gemini_api_key';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [lastTransactionsLimit, setLastTransactionsLimit] = useState<string>(
    String(DEFAULT_LAST_TRANSACTIONS_LIMIT)
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load transactions limit
      const storedLimit = localStorage.getItem(LAST_TRANSACTIONS_LIMIT_KEY);
      if (storedLimit) {
        const parsedLimit = parseInt(storedLimit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          setLastTransactionsLimit(String(parsedLimit));
        } else {
          localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
        }
      } else {
         localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
      }

      // Load Gemini API Key
      const storedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      if (storedApiKey) {
        setGeminiApiKey(storedApiKey);
      }
    }
  }, []);

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLastTransactionsLimit(event.target.value);
  };

  const handleSaveDashboardSettings = () => {
    const newLimit = parseInt(lastTransactionsLimit, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(newLimit));
      }
      toast({
        title: t('settingsSavedTitle'),
        description: t('settingsSavedDesc'),
      });
    } else {
      setLastTransactionsLimit(String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
      }
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('invalidLimitValueResetToDefault'),
      });
    }
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGeminiApiKey(event.target.value);
  };

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      if (geminiApiKey.trim()) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, geminiApiKey.trim());
        toast({
          title: t('geminiApiKeySavedTitle'),
          description: t('geminiApiKeySavedDesc'),
        });
      } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
         toast({
          title: t('geminiApiKeyRemovedTitle'),
          description: t('geminiApiKeyRemovedDesc'),
        });
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          {t('settingsPageTitle')}
        </h1>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('dashboardSettingsTitle')}</CardTitle>
            <CardDescription>{t('dashboardSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lastTransactionsLimit">{t('lastTransactionsLimitLabel')}</Label>
              <Input
                id="lastTransactionsLimit"
                type="number"
                min="1"
                value={lastTransactionsLimit}
                onChange={handleLimitChange}
                placeholder={String(DEFAULT_LAST_TRANSACTIONS_LIMIT)}
              />
            </div>
            <Button onClick={handleSaveDashboardSettings} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {t('saveSettingsButton')}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('geminiApiKeySettingsTitle')}</CardTitle>
            <CardDescription>{t('geminiApiKeySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">{t('geminiApiKeyLabel')}</Label>
              <Input
                id="geminiApiKey"
                type="password" // Use password type for API keys
                value={geminiApiKey}
                onChange={handleApiKeyChange}
                placeholder={t('geminiApiKeyPlaceholder')}
              />
            </div>
             <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary-foreground dark:bg-primary/10 dark:border-primary/30">
              <Info className="h-4 w-4 !text-primary" />
              <AlertDescription className="text-xs">
                {t('geminiApiKeyNote')}
              </AlertDescription>
            </Alert>
            <Button onClick={handleSaveApiKey} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {t('geminiApiKeySaveButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
