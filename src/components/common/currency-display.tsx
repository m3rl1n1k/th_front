"use client";

import React from 'react';
import { useTranslation } from '@/context/i18n-context';

interface CurrencyDisplayProps {
  amountInCents: number;
  currencySymbol?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amountInCents, currencySymbol = '$' }) => {
  const { language } = useTranslation(); // For potential locale-specific formatting

  const formattedAmount = new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: language === 'es' ? 'EUR' : 'USD', // Example, could be configurable
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);

  // Intl.NumberFormat already includes the symbol, so we might not need `currencySymbol` prop unless for override.
  // For simplicity here, directly using the output of Intl.NumberFormat.
  return <span className="font-mono">{formattedAmount}</span>;
};
