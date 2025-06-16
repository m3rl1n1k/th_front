
"use client";

import React from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <PublicLayout>
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline text-center">
            {t('termsOfServiceTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert mx-auto py-8 px-6 space-y-4">
          <p>{t('termsContentPlaceholder1')}</p>
          <p>{t('termsContentPlaceholder2')}</p>
          
          <h2 className="font-semibold text-xl pt-4">{t('termsSection1Title')}</h2>
          <p>{t('termsSection1Content')}</p>

          <h2 className="font-semibold text-xl pt-4">{t('termsSection2Title')}</h2>
          <p>{t('termsSection2Content')}</p>
          
          <p className="text-sm text-muted-foreground pt-6">{t('termsLastUpdated')}: {new Date().toLocaleDateString()}</p>

           <div className="text-center pt-8">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PublicLayout>
  );
}
