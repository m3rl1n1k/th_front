
"use client";

import React from 'react';
import { useTranslation } from '@/context/i18n-context';

interface CurrencyDisplayProps {
  amountInCents: number;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amountInCents }) => {
  const { language } = useTranslation(); 

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  // Default currency based on language for simplicity at this stage
  const currency = language === 'es' ? 'EUR' : 'USD';

  let formattedAmount;
  try {
    formattedAmount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  } catch (error) {
    console.warn(`Error formatting currency ${currency} for locale ${locale}:`, error);
    // Fallback display
    formattedAmount = `${(amountInCents / 100).toFixed(2)} ${currency}`;
  }
  

  return <span className="font-mono">{formattedAmount}</span>;
};
