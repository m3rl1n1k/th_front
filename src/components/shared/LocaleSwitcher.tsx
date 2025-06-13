
'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { setLocaleCookie } from '@/lib/actions';

interface LocaleSwitcherProps {
  currentLocale: string;
}

const locales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocaleCookie(newLocale, pathname);
      router.refresh();
    });
  };

  const currentLanguageName = locales.find(l => l.code === currentLocale)?.name || currentLocale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language" disabled={isPending}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">{currentLanguageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            disabled={currentLocale === locale.code || isPending}
          >
            {locale.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


    