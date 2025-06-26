
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, createPortalSession } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const proPlanPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID || '';

export default function SubscriptionPage() {
  const { user, token } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCreateCheckout = async (priceId: string) => {
    if (!token) return;
    setIsRedirecting(true);
    try {
      const { sessionId } = await createCheckoutSession(token, priceId);
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errorCreatingSession'), description: error.message });
      setIsRedirecting(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!token) return;
    setIsRedirecting(true);
    try {
      const { url } = await createPortalSession(token);
      window.location.href = url;
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errorCreatingSession'), description: error.message });
      setIsRedirecting(false);
    }
  };

  const subscription = user?.subscription;
  const planName = subscription?.plan_name || t('freePlanTitle');
  const status = subscription?.status || 'free';
  const endsAt = subscription?.ends_at ? format(parseISO(subscription.ends_at), 'PPP', { locale: dateFnsLocale }) : null;
  const trialEndsAt = subscription?.trial_ends_at ? format(parseISO(subscription.trial_ends_at), 'PPP', { locale: dateFnsLocale }) : null;

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'trialing': return 'secondary';
      case 'past_due':
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const PlanFeatures = () => (
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />{t('proPlanFeature1')}</li>
      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />{t('proPlanFeature2')}</li>
      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />{t('proPlanFeature3')}</li>
    </ul>
  );

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <Star className="mr-3 h-8 w-8 text-primary" />
          {t('manageSubscriptionTitle')}
        </h1>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t('currentPlanLabel')}</CardTitle>
            <CardDescription>{t('manageSubscriptionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-semibold text-xl">{planName}</p>
                {trialEndsAt && status === 'trialing' && (
                  <p className="text-sm text-muted-foreground">{t('trialEndsOn', { date: trialEndsAt })}</p>
                )}
                {endsAt && status === 'canceled' && (
                  <p className="text-sm text-muted-foreground">{t('subscriptionExpiresOn', { date: endsAt })}</p>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(status)} className="capitalize text-base">
                {t(`status_${status}`, { defaultValue: status })}
              </Badge>
            </div>
            {status === 'active' || status === 'trialing' && (
              <Button onClick={handleManageSubscription} disabled={isRedirecting} className="w-full sm:w-auto">
                {isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('billingPortalButton')}
              </Button>
            )}
          </CardContent>
        </Card>

        {(status === 'free' || status === 'canceled') && (
          <Card className="shadow-xl border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">{t('proPlanTitle')}</CardTitle>
              <CardDescription>{t('proPlanDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanFeatures />
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleCreateCheckout(proPlanPriceId)} disabled={isRedirecting || !proPlanPriceId} className="w-full">
                {isRedirecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Star className="mr-2 h-4 w-4" />
                )}
                {t('upgradeToProButton')}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
