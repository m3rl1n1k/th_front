
"use client";

import React from 'react';
import { useTranslation } from '@/context/i18n-context';

interface CurrencyDisplayProps {
  amountInCents: number;
  currencyCode?: string; // e.g., "USD", "EUR", "PLN"
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amountInCents, currencyCode }) => {
  const { language } = useTranslation(); 

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  
  // Determine currency for formatting. Fallback to USD if no code provided.
  // This makes currencyCode essential for correct display if not USD/EUR based on lang.
  const displayCurrency = currencyCode || (language === 'es' ? 'EUR' : 'USD');

  let formattedAmount;
  try {
    formattedAmount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  } catch (error) {
    console.warn(`Error formatting currency ${displayCurrency} for locale ${locale}:`, error);
    // Fallback display if Intl.NumberFormat fails (e.g. unsupported currency code)
    formattedAmount = `${(amountInCents / 100).toFixed(2)} ${currencyCode || ''}`.trim();
  }
  

  return <span className="font-mono">{formattedAmount}</span>;
};
