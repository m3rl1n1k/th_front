
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Calculator, type LucideProps } from 'lucide-react'; // Import icons here

// Define the type for accepted icon names
export type StatCardIconName = 'DollarSign' | 'Users' | 'CreditCard' | 'Calculator';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: StatCardIconName; // Changed from icon: React.ElementType
  currency?: boolean;
  dataAiHint?: string;
  locale?: string;
  localStorageKey: string;
  initialVisible: boolean;
}

export function StatCard({
  title,
  value,
  iconName, // Changed from icon
  currency = false,
  dataAiHint,
  locale = 'en',
  localStorageKey,
  initialVisible,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    const storedSetting = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
    if (storedSetting !== null) {
      setIsVisible(storedSetting === 'true');
    } else {
      setIsVisible(initialVisible); 
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === localStorageKey && event.newValue !== null) {
        setIsVisible(event.newValue === 'true');
      } else if (event.key === 'dashboard_settings_updated') { 
        const freshStoredSetting = localStorage.getItem(localStorageKey);
        if (freshStoredSetting !== null) {
          setIsVisible(freshStoredSetting === 'true');
        }
      }
    };
    
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
    }
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorageChange);
        }
    };
  }, [localStorageKey, initialVisible]);

  const renderIcon = () => {
    const iconProps: LucideProps = { className: "h-5 w-5 text-primary" };
    switch (iconName) {
      case 'DollarSign':
        return <DollarSign {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      case 'CreditCard':
        return <CreditCard {...iconProps} />;
      case 'Calculator':
        return <Calculator {...iconProps} />;
      default:
        // Optionally return a default icon or null
        return null; 
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {renderIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency
            ? Number(value).toLocaleString(locale, {
                style: 'currency',
                currency: 'USD', 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : typeof value === 'number'
            ? value.toLocaleString(locale)
            : value}
        </div>
        {dataAiHint && (
          <div className="text-xs text-muted-foreground hidden" data-ai-hint={dataAiHint}>
            Hint for AI image generation
          </div>
        )}
      </CardContent>
    </Card>
  );
}
