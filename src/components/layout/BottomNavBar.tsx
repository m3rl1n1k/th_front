
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/i18n-context';

export function BottomNavBar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const navItems = [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/transactions/new/select-category', label: t('newTransaction'), icon: PlusCircle },
        { href: '/report/general', label: t('reportsGroup'), icon: FileSignature }
    ];

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border md:hidden">
            <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
                {navItems.map(item => {
                    const isActive = item.href === '/transactions/new/select-category' 
                        ? pathname.startsWith('/transactions/new') 
                        : pathname.startsWith(item.href);
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="w-8 h-8" />
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
