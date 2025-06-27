
"use client";

import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainCategory as ApiMainCategory } from '@/types';
import { useTranslation } from '@/context/i18n-context';
import { ChevronsUpDown, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
  mainCategories: ApiMainCategory[];
  disabled?: boolean;
  placeholder?: string;
  allowNoCategory?: boolean; // For transactions
  allowAllCategories?: boolean; // For filtering
  triggerClassName?: string;
}

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  mainCategories,
  disabled,
  placeholder,
  allowNoCategory = false,
  allowAllCategories = false,
  triggerClassName,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const allSubCategories = useMemo(() => {
    return mainCategories.flatMap(mc => mc.subCategories || []);
  }, [mainCategories]);

  const selectedCategoryName = useMemo(() => {
    if (allowAllCategories && (value === undefined || value === 'all')) return t('allCategories');
    if (allowNoCategory && (value === null || value === 'none')) return t('noCategoryOption');
    if (!value) return placeholder || t('selectCategoryPlaceholder');

    const subCategory = allSubCategories.find(sc => String(sc.id) === value);
    return subCategory ? t(generateCategoryTranslationKey(subCategory.name), { defaultValue: subCategory.name }) : placeholder || t('selectCategoryPlaceholder');
  }, [value, allSubCategories, t, placeholder, allowNoCategory, allowAllCategories]);
  
  const handleSelect = (newValue: string | null | undefined) => {
    onChange(newValue);
    setIsOpen(false);
  };

  const renderCategoryList = (categories: ApiMainCategory['subCategories']) => (
    <div className="space-y-1">
      {categories.map(subCat => (
        <Button
          key={subCat.id}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left h-auto py-1.5 px-2",
            String(subCat.id) === value && "bg-accent text-accent-foreground"
          )}
          onClick={() => handleSelect(String(subCat.id))}
        >
          {t(generateCategoryTranslationKey(subCat.name), { defaultValue: subCat.name })}
        </Button>
      ))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between", triggerClassName)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Shapes className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{selectedCategoryName}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1 h-auto">
             <TabsTrigger value="all">{t('allCategories')}</TabsTrigger>
            {mainCategories.slice(0, 2).map(mainCat => (
              <TabsTrigger key={mainCat.id} value={String(mainCat.id)} className="truncate">
                {t(generateCategoryTranslationKey(mainCat.name), { defaultValue: mainCat.name })}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-64">
            <TabsContent value="all" className="p-1">
                <div className="space-y-2">
                    {allowAllCategories && (
                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start text-left h-auto py-1.5 px-2", (value === undefined || value === 'all') && "bg-accent text-accent-foreground")}
                            onClick={() => handleSelect(undefined)}
                        >
                            {t('allCategories')}
                        </Button>
                    )}
                    {allowNoCategory && (
                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start text-left h-auto py-1.5 px-2", (value === null || value === 'none') && "bg-accent text-accent-foreground")}
                            onClick={() => handleSelect(null)}
                        >
                            {t('noCategoryOption')}
                        </Button>
                    )}
                    {(allowAllCategories || allowNoCategory) && <hr/>}
                    {mainCategories.map(mainCat => (
                        <div key={mainCat.id}>
                            <h4 className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {t(generateCategoryTranslationKey(mainCat.name), { defaultValue: mainCat.name })}
                            </h4>
                            {renderCategoryList(mainCat.subCategories)}
                        </div>
                    ))}
                </div>
            </TabsContent>

            {mainCategories.map(mainCat => (
              <TabsContent key={mainCat.id} value={String(mainCat.id)} className="p-1">
                {renderCategoryList(mainCat.subCategories)}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
