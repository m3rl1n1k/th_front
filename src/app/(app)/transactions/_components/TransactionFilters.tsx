
'use client';

import React, { useState, useEffect } from 'react';
import type { Wallet, SubCategory, MainCategory, TransactionType } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, XCircle } from 'lucide-react';
import { format, isValid, type Locale } from 'date-fns';
import { enUS, es, uk } from 'date-fns/locale'; 
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ALL_VALUE = '_ALL_';
const UNCAT_VALUE = '_UNCATEGORIZED_';

export interface TransactionFiltersState {
  type: TransactionType | typeof ALL_VALUE;
  walletId: string | typeof ALL_VALUE;
  subCategoryId: string | typeof ALL_VALUE | typeof UNCAT_VALUE;
  startDate: Date | null;
  endDate: Date | null;
  searchTerm: string;
}

interface TransactionFiltersProps {
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  onApplyFilters: (filters: TransactionFiltersState) => void;
  initialFilters: TransactionFiltersState;
  translations: any;
  locale: string;
}

const dateFnsLocales: { [key: string]: Locale } = {
  en: enUS,
  es: es,
  uk: uk,
};

export function TransactionFilters({
  wallets,
  subCategories,
  mainCategories,
  onApplyFilters,
  initialFilters,
  translations,
  locale
}: TransactionFiltersProps) {
  const [type, setType] = useState<TransactionType | typeof ALL_VALUE>(initialFilters.type);
  const [walletId, setWalletId] = useState<string | typeof ALL_VALUE>(initialFilters.walletId);
  const [subCategoryId, setSubCategoryId] = useState<string | typeof ALL_VALUE | typeof UNCAT_VALUE>(initialFilters.subCategoryId);
  const [startDate, setStartDate] = useState<Date | null>(initialFilters.startDate);
  const [endDate, setEndDate] = useState<Date | null>(initialFilters.endDate);
  const [searchTerm, setSearchTerm] = useState<string>(initialFilters.searchTerm);

  const transactionTypes: (TransactionType | typeof ALL_VALUE)[] = [ALL_VALUE, 'Income', 'Expense'];
  const currentDtsLocale = dateFnsLocales[locale] || enUS;

  const handleApply = () => {
    onApplyFilters({ type, walletId, subCategoryId, startDate, endDate, searchTerm });
  };

  const handleClear = () => {
    setType(ALL_VALUE);
    setWalletId(ALL_VALUE);
    setSubCategoryId(ALL_VALUE);
    setStartDate(null);
    setEndDate(null);
    setSearchTerm('');
    onApplyFilters({
      type: ALL_VALUE,
      walletId: ALL_VALUE,
      subCategoryId: ALL_VALUE,
      startDate: null,
      endDate: null,
      searchTerm: ''
    });
  };
  
  const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc.name]));

  return (
    <Accordion type="single" collapsible className="w-full mb-6">
      <AccordionItem value="filters-accordion" className="border-none">
        <Card className="shadow-lg">
          <AccordionTrigger
            className="w-full flex items-center justify-between text-left p-4 hover:no-underline data-[state=closed]:rounded-lg data-[state=open]:rounded-t-lg focus-visible:ring-inset focus-visible:!ring-offset-0"
          >
            <CardTitle className="text-lg font-headline">
              {translations.filterTitle || 'Filter Transactions'}
            </CardTitle>
            {/* AccordionTrigger component appends its own chevron icon here, justify-between will place it to the right */}
          </AccordionTrigger>
          <AccordionContent className="border-t p-0 data-[state=open]:rounded-b-lg">
            <div className="p-4 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="searchTerm">{translations.searchLabel || 'Search Description'}</Label>
                <Input
                  id="searchTerm"
                  placeholder={translations.searchPlaceholder || 'Enter search term...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="filter-type">{translations.typeLabel || 'Type'}</Label>
                <Select value={type} onValueChange={(value) => setType(value as TransactionType | typeof ALL_VALUE)}>
                  <SelectTrigger id="filter-type" className="h-9">
                    <SelectValue placeholder={translations.typePlaceholder || 'Select Type'} />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === ALL_VALUE ? (translations.allTypes || 'All Types') : t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="filter-wallet">{translations.walletLabel || 'Wallet'}</Label>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger id="filter-wallet" className="h-9">
                    <SelectValue placeholder={translations.walletPlaceholder || 'Select Wallet'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>{translations.allWallets || 'All Wallets'}</SelectItem>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({w.currency})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="filter-subcategory">{translations.categoryLabel || 'Category'}</Label>
                <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                  <SelectTrigger id="filter-subcategory" className="h-9">
                    <SelectValue placeholder={translations.categoryPlaceholder || 'Select Category'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value={ALL_VALUE}>{translations.allCategories || 'All Categories'}</SelectItem>
                    <SelectItem value={UNCAT_VALUE}>{translations.uncategorized || 'Uncategorized'}</SelectItem>
                    {mainCategories.map(mc => (
                      <React.Fragment key={mc.id}>
                        <SelectItem value={mc.id} disabled className="font-semibold text-muted-foreground pt-2">{mc.name}</SelectItem>
                        {subCategories.filter(sc => sc.mainCategoryId === mc.id).map(sc => (
                          <SelectItem key={sc.id} value={sc.id} className="pl-6">{sc.name}</SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                    {subCategories.filter(sc => !mainCategoryMap.has(sc.mainCategoryId)).length > 0 && (
                      <>
                        <SelectItem value="unassigned-header" disabled className="font-semibold text-muted-foreground pt-2">{translations.unassignedSubCategories || 'Unassigned Sub-Categories'}</SelectItem>
                        {subCategories.filter(sc => !mainCategoryMap.has(sc.mainCategoryId)).map(sc => (
                          <SelectItem key={sc.id} value={sc.id} className="pl-6">{sc.name}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="filter-start-date">{translations.startDateLabel || 'Start Date'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="filter-start-date"
                      variant={'outline'}
                      className={cn('w-full justify-start text-left font-normal h-9', !startDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && isValid(startDate) ? format(startDate, 'PPP', { locale: currentDtsLocale }) : <span>{translations.datePlaceholder || 'Pick a date'}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={currentDtsLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label htmlFor="filter-end-date">{translations.endDateLabel || 'End Date'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="filter-end-date"
                      variant={'outline'}
                      className={cn('w-full justify-start text-left font-normal h-9', !endDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate && isValid(endDate) ? format(endDate, 'PPP', { locale: currentDtsLocale }) : <span>{translations.datePlaceholder || 'Pick a date'}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                      locale={currentDtsLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end space-x-2 col-span-full md:col-span-1 xl:col-span-2">
                <Button onClick={handleApply} className="w-full sm:w-auto h-9">{translations.applyButton || 'Apply Filters'}</Button>
                <Button onClick={handleClear} variant="outline" className="w-full sm:w-auto h-9">
                  <XCircle className="mr-2 h-4 w-4" />
                  {translations.clearButton || 'Clear'}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
