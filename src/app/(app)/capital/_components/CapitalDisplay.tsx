
'use client';

import React, { useState, useEffect } from 'react';
import type { Wallet, SharedCapitalSession } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { startSharedCapitalSession, stopSharedCapitalSession } from '@/lib/actions';
import { Handshake, UserMinus, Wallet as WalletIcon } from 'lucide-react'; // Users icon for sharing

interface CapitalDisplayProps {
  wallets: Wallet[];
  totalCapitalByCurrency: Record<string, number>;
  initialSession: SharedCapitalSession | null;
  translations: any; // From capitalPage namespace
  locale: string;
}

export function CapitalDisplay({
  wallets,
  totalCapitalByCurrency,
  initialSession,
  translations,
  locale,
}: CapitalDisplayProps) {
  const [currentSession, setCurrentSession] = useState<SharedCapitalSession | null>(initialSession);
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentSession(initialSession);
  }, [initialSession]);

  const handleShareCapital = async () => {
    if (!partnerEmailInput.trim()) {
      toast({
        title: translations.startShareErrorTitle,
        description: "Partner's email cannot be empty.",
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await startSharedCapitalSession(partnerEmailInput.trim());
      setCurrentSession(session);
      toast({
        title: translations.startShareSuccessTitle,
        description: translations.startShareSuccessDescription.replace('{email}', session.partnerEmail),
      });
      setPartnerEmailInput('');
    } catch (error) {
      toast({
        title: translations.startShareErrorTitle,
        description: translations.startShareErrorDescription.replace('{error}', error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopSharing = async () => {
    setIsSubmitting(true);
    try {
      await stopSharedCapitalSession();
      setCurrentSession(null);
      toast({
        title: translations.stopShareSuccessTitle,
        description: translations.stopShareSuccessDescription,
      });
    } catch (error) {
      toast({
        title: translations.stopShareErrorTitle,
        description: translations.stopShareErrorDescription.replace('{error}', error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCurrency = (amount: number, currencyCode: string) => {
    return amount.toLocaleString(locale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">{translations.yourTotalCapital}</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {Object.keys(totalCapitalByCurrency).length > 0 ? (
            Object.entries(totalCapitalByCurrency).map(([currency, total]) => (
              <div key={currency} className="mb-1">{formatCurrency(total, currency)}</div>
            ))
          ) : (
            <p className="text-base text-muted-foreground">{translations.noWallets}</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">{translations.walletBalances}</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map(wallet => (
                <Card key={wallet.id} className="bg-card-foreground/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <WalletIcon className="mr-2 h-5 w-5 text-primary" />
                      {wallet.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">{formatCurrency(wallet.initialAmount, wallet.currency)}</p>
                    <p className="text-xs text-muted-foreground">{wallet.type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{translations.noWallets}</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            {currentSession?.isActive ? <UserMinus className="mr-2 h-6 w-6 text-destructive" /> : <Handshake className="mr-2 h-6 w-6 text-primary" />}
            {currentSession?.isActive ? translations.sharingWith.replace('{email}', currentSession.partnerEmail) : translations.shareCapitalButton}
          </CardTitle>
          <CardDescription>
            {currentSession?.isActive 
              ? `You started sharing on ${new Date(currentSession.createdAt).toLocaleDateString(locale)}.`
              : "Share an overview of your capital with a partner."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSession?.isActive && (
            <div className="space-y-2">
              <Label htmlFor="partnerEmail">{translations.partnerEmailLabel}</Label>
              <Input
                id="partnerEmail"
                type="email"
                placeholder={translations.partnerEmailPlaceholder}
                value={partnerEmailInput}
                onChange={(e) => setPartnerEmailInput(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}
          {currentSession?.isActive ? (
            <Button onClick={handleStopSharing} variant="destructive" className="w-full" disabled={isSubmitting}>
              <UserMinus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Processing...' : translations.stopSharingButton}
            </Button>
          ) : (
            <Button onClick={handleShareCapital} className="w-full" disabled={isSubmitting}>
              <Handshake className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Processing...' : translations.shareCapitalButton}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
