
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChartBig, CheckCircle, ListChecks, Target, Users } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Target className="h-10 w-10 text-primary" />,
      titleKey: "featureSmartBudgetingTitle",
      descriptionKey: "featureSmartBudgetingDesc",
      image: {
        src: "https://placehold.co/600x400.png",
        alt: "Screenshot of the budgeting feature in FinanceFlow.",
        hint: "budget tracking"
      }
    },
    {
      icon: <ListChecks className="h-10 w-10 text-primary" />,
      titleKey: "transactions",
      descriptionKey: "homePageFeatureTrackDesc",
      image: {
        src: "https://placehold.co/600x400.png",
        alt: "Screenshot of the transaction list in FinanceFlow.",
        hint: "expense list"
      }
    },
    {
      icon: <BarChartBig className="h-10 w-10 text-primary" />,
      titleKey: "homePageFeatureReportsTitle",
      descriptionKey: "homePageFeatureReportsDesc",
      image: {
        src: "https://placehold.co/600x400.png",
        alt: "Screenshot of a financial report chart in FinanceFlow.",
        hint: "financial report"
      }
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      titleKey: "featureCollaborativeFinancesTitle",
      descriptionKey: "featureCollaborativeFinancesDesc",
      image: {
        src: "https://placehold.co/600x400.png",
        alt: "Illustration of multiple users collaborating.",
        hint: "team collaboration"
      }
    }
  ];
  
  const howItWorksSteps = [
    {
      icon: CheckCircle,
      titleKey: 'homePageHowItWorks1Title',
      descriptionKey: 'homePageHowItWorks1Desc'
    },
    {
      icon: CheckCircle,
      titleKey: 'homePageHowItWorks2Title',
      descriptionKey: 'homePageHowItWorks2Desc'
    },
    {
      icon: CheckCircle,
      titleKey: 'homePageHowItWorks3Title',
      descriptionKey: 'homePageHowItWorks3Desc'
    }
  ]

  return (
    <PublicLayout>
      <div className="w-full">
        {/* Hero Section */}
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 max-w-4xl mx-auto">
              {t('homePageTitle')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('homePageSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href="/register">
                  {t('getStartedButton')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href="/login">{t('loginToAccountButton')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Feature Screenshot */}
        <section className="container mx-auto px-4 -mt-16">
           <div className="relative mx-auto w-full max-w-5xl h-auto aspect-video rounded-xl overflow-hidden shadow-2xl border">
              <Image
                src="https://storage.googleapis.com/project-osprey-428717-assets/56108151-ff72-466a-937e-616997675e8d.png"
                alt="A screenshot of the FinanceFlow application dashboard showing various financial metrics and charts."
                fill
                className="object-cover"
                data-ai-hint="financial dashboard analytics"
              />
            </div>
        </section>


        {/* Detailed Features Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">{t('featuresTitle')}</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">{t('homePageFeatureMainDesc')}</p>
            </div>
            <div className="space-y-24">
              {features.map((feature, index) => (
                <div key={feature.titleKey} className="grid md:grid-cols-2 items-center gap-12">
                  <div className={`md:order-${index % 2 === 0 ? '1' : '2'}`}>
                    <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                      {feature.icon}
                      <h3 className="text-xl font-semibold">{t(feature.titleKey as any)}</h3>
                    </div>
                    <p className="text-muted-foreground text-lg">{t(feature.descriptionKey as any)}</p>
                  </div>
                  <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg border md:order-${index % 2 === 0 ? '2' : '1'}`}>
                     <Image
                      src={feature.image.src}
                      alt={feature.image.alt}
                      fill
                      className="object-cover"
                      data-ai-hint={feature.image.hint}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">{t('homePageHowItWorksTitle')}</h2>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">{t('homePageHowItWorksDesc')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((step, index) => (
                 <Card key={index} className="text-center p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-6">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t(step.titleKey as any)}</h3>
                  <p className="text-muted-foreground">{t(step.descriptionKey as any)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary text-primary-foreground p-12 rounded-lg text-center shadow-xl">
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">{t('homePageFinalCTATitle')}</h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">{t('homePageFinalCTADesc')}</p>
              <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Link href="/register">{t('getStartedButton')}</Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
