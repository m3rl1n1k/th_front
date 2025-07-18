
"use client";

import React from 'react';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context'; // Import useAuth

interface CurrencyDisplayProps {
  amountInCents: number;
  currencyCode?: string; // Optional currency code from transaction
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amountInCents, currencyCode }) => {
  const { language } = useTranslation();
  const { user, showAmounts } = useAuth(); // Get user and showAmounts from AuthContext

  if (!showAmounts) {
    return <span className="font-mono tracking-widest">••••••</span>;
  }

  const locale = language === 'uk' ? 'uk-UA' : (language === 'en' ? 'en-US' : 'en-US'); // Default to en-US if lang not 'uk'

  // Determine display currency with new fallback logic
  let displayCurrency: string;
  if (currencyCode) {
    displayCurrency = currencyCode;
  } else if (user && user.userCurrency && user.userCurrency.code) {
    displayCurrency = user.userCurrency.code;
  } else {
    // Fallback to language-based default
    displayCurrency = language === 'uk' ? 'UAH' : 'USD'; // Default to USD if not UK
  }

  let formattedAmount;
  try {
    // Ensure amountInCents is a number before division
    const amount = typeof amountInCents === 'number' ? amountInCents / 100 : 0;
    formattedAmount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code', // Explicitly show the ISO currency code
    }).format(amount);
  } catch (error) {
    const amount = typeof amountInCents === 'number' ? (amountInCents / 100).toFixed(2) : '0.00';
    // Fallback displays the amount and the ISO code
    formattedAmount = `${amount} ${displayCurrency}`;
  }

  return <span className="font-mono">{formattedAmount}</span>;
};
