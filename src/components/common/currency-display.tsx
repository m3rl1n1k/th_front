
"use client";

import React from 'react';
import { useTranslation } from '@/context/i18n-context';

interface CurrencyDisplayProps {
  amountInCents: number;
  currencyCode?: string; // Optional currency code from transaction
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amountInCents, currencyCode }) => {
  const { language } = useTranslation(); 

  const locale = language === 'uk' ? 'uk-UA' : (language === 'es' ? 'es-ES' : 'en-US');
  // Default currency based on language, overridden by currencyCode if provided
  const defaultCurrency = language === 'uk' ? 'UAH' : (language === 'es' ? 'EUR' : 'USD');
  const displayCurrency = currencyCode || defaultCurrency;

  let formattedAmount;
  try {
    formattedAmount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100); // Assuming amountInCents is indeed in cents
  } catch (error) {
    console.warn(`Error formatting currency ${displayCurrency} for locale ${locale}:`, error);
    // Fallback display
    formattedAmount = `${(amountInCents / 100).toFixed(2)} ${displayCurrency}`;
  }
  

  return <span className="font-mono">{formattedAmount}</span>;
};
