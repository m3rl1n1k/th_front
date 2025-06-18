
"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const LAST_TRANSACTIONS_LIMIT_KEY = 'dashboardLastTransactionsLimit';
const DEFAULT_LAST_TRANSACTIONS_LIMIT = 10;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [lastTransactionsLimit, setLastTransactionsLimit] = useState<string>(
    String(DEFAULT_LAST_TRANSACTIONS_LIMIT)
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLimit = localStorage.getItem(LAST_TRANSACTIONS_LIMIT_KEY);
      if (storedLimit) {
        const parsedLimit = parseInt(storedLimit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          setLastTransactionsLimit(String(parsedLimit));
        } else {
          // If stored value is invalid, reset to default in storage
          localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
        }
      } else {
        // If not set, initialize with default
         localStorage.setItem(LAST_TRANSACTIONS_LIMIT_KEY, String(DEFAULT_LAST_TRANSACTIONS_LIMIT));
      }
    }
  }, []);

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLastTransactionsLimit(event.target.value);
  };

  const handleSaveSettings = () => {
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
      // Reset to default if input is invalid and notify user
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

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
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
            <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {t('saveSettingsButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
