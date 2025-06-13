
'use client';

import React from 'react';
import type { Transaction, Wallet, SubCategory, MainCategory } from '@/lib/definitions';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, ListX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentActivityListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  translations: {
    noRecentActivity?: string;
    income?: string;
    expense?: string;
  };
  locale: string;
  defaultCurrencyCode: string;
}

export function RecentActivityList({
  transactions,
  wallets,
  subCategories,
  mainCategories,
  translations,
  locale,
  defaultCurrencyCode,
}: RecentActivityListProps) {
  const getWalletCurrency = (walletId: string) => {
    return wallets.find(w => w.id === walletId)?.currency || defaultCurrencyCode;
  };

  const getCategoryInfo = (subCategoryId?: string) => {
    if (!subCategoryId) {
      return { name: 'Uncategorized', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    }
    const sub = subCategories.find(sc => sc.id === subCategoryId);
    if (!sub) return { name: 'N/A', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    const main = mainCategories.find(mc => mc.id === sub.mainCategoryId);
    return { name: sub.name, color: sub.color, mainCategoryName: main?.name || 'N/A' };
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <ListX className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{translations.noRecentActivity || "No recent activity to display."}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] md:h-[350px]"> {/* Adjust height as needed */}
      <ul className="space-y-3 pr-4">
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(transaction.subCategoryId);
          const currency = getWalletCurrency(transaction.walletId);
          const isIncome = transaction.type === 'Income';

          return (
            <li key={transaction.id} className="flex items-center justify-between p-3 bg-card-foreground/5 hover:bg-card-foreground/10 rounded-md transition-colors">
              <div className="flex items-center space-x-3">
                {isIncome ? (
                  <ArrowUpCircle className="h-6 w-6 text-accent" />
                ) : (
                  <ArrowDownCircle className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                    {transaction.description || categoryInfo.name}
                  </p>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span
                      className="h-2 w-2 rounded-full mr-1.5 border"
                      style={{ backgroundColor: categoryInfo.color }}
                    ></span>
                    {categoryInfo.mainCategoryName === 'N/A' && categoryInfo.name === 'Uncategorized' ? 'Uncategorized' : `${categoryInfo.mainCategoryName} / ${categoryInfo.name}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isIncome ? 'text-accent' : 'text-destructive'}`}>
                  {isIncome ? '+' : '-'}{transaction.amount.toLocaleString(locale, { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
