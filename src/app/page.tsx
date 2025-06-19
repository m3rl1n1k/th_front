
"use client";

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Target, Users, Shapes } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';
import Image from 'next/image';

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    { icon: <LayoutDashboard className="h-8 w-8 text-primary" />, titleKey: "featureComprehensiveOverviewTitle", descriptionKey: "featureComprehensiveOverviewDesc" },
    { icon: <Target className="h-8 w-8 text-primary" />, titleKey: "featureSmartBudgetingTitle", descriptionKey: "featureSmartBudgetingDesc" },
    { icon: <Users className="h-8 w-8 text-primary" />, titleKey: "featureCollaborativeFinancesTitle", descriptionKey: "featureCollaborativeFinancesDesc" },
    { icon: <Shapes className="h-8 w-8 text-primary" />, titleKey: "featureOrganizeYourWayTitle", descriptionKey: "featureOrganizeYourWayDesc" },
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 md:py-16 text-center">
        <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('homePageTitle')}
            </h1>
            <CardDescription className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('homePageSubtitle')}
            </CardDescription>
             <div className="relative mx-auto w-full max-w-lg h-64 md:h-80 mb-8 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="https://placehold.co/800x600.png"
                  alt={t('altFinancialPlanning')}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="financial planning dashboard"
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href="/register">{t('getStartedButton')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href="/login">{t('loginToAccountButton')}</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="py-12 md:py-16 px-6">
            <h2 className="text-3xl font-semibold text-foreground mb-10">{t('featuresTitle')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center p-6 bg-background rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-3 bg-primary/10 rounded-full mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{t(feature.titleKey as any)}</h3>
                  <p className="text-muted-foreground text-center">{t(feature.descriptionKey as any)}</p>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="p-8 md:p-12 bg-muted/30 text-center">
             <p className="text-muted-foreground">{t('homePageFooterText')}</p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}

