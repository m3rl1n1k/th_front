
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  Repeat,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
  UserCircle, 
  PiggyBank, // Added PiggyBank icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout, getCurrentUser } from '@/lib/auth'; 
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSubItem, 
} from '@/components/ui/sidebar';
import React, { useEffect, useState } from 'react';
import type { User } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  locale: string;
  subItems?: { href: string; label: string }[];
}

const NavItem = ({ href, icon: Icon, label, currentPath, locale, subItems }: NavItemProps) => {
  const localePrefixedHref = `/${locale}${href}`;
  const isActive = subItems 
    ? subItems.some(sub => currentPath.startsWith(`/${locale}${sub.href}`)) || currentPath === localePrefixedHref
    : currentPath.startsWith(localePrefixedHref);
  
  const [isOpen, setIsOpen] = React.useState(isActive && !!subItems);

  if (subItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
            onClick={() => setIsOpen(!isOpen)}
            className="justify-between"
            isActive={isActive}
            tooltip={{children: label, className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"}}
        >
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </SidebarMenuButton>
        {isOpen && (
            <SidebarMenuSub>
                {subItems.map(subItem => (
                    <SidebarMenuSubItem key={subItem.href}>
                        <Link href={`/${locale}${subItem.href}`}>
                            <SidebarMenuSubButton isActive={currentPath.startsWith(`/${locale}${subItem.href}`)} aria-label={subItem.label}>
                                {subItem.label}
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                ))}
            </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
        <Link href={localePrefixedHref} aria-label={label}>
            <SidebarMenuButton isActive={isActive} tooltip={{children: label, className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"}}>
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
            </SidebarMenuButton>
        </Link>
    </SidebarMenuItem>
  );
};

interface AppSidebarProps {
  children: React.ReactNode;
  locale: string;
  translations: {
    dashboard: string;
    transactions: string;
    categories: string;
    wallets: string;
    transfers: string;
    budgets: string; // Added budgets translation
    settings: string;
    profile: string; 
    logout: string;
  };
}

export function AppSidebar({ children, locale, translations }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, [pathname]); // Refetch user if path changes, e.g., after profile update

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push(`/${locale}/login`);
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: translations.dashboard },
    { href: '/transactions', icon: ArrowLeftRight, label: translations.transactions },
    { href: '/categories', icon: Tags, label: translations.categories },
    { href: '/wallets', icon: Wallet, label: translations.wallets },
    { href: '/transfers', icon: Repeat, label: translations.transfers },
    { href: '/budgets', icon: PiggyBank, label: translations.budgets },
  ];
  
  const utilityNavItems = [
     { href: '/settings', icon: Settings, label: translations.settings },
     { href: '/profile', icon: UserCircle, label: translations.profile }, 
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 font-headline text-xl text-sidebar-primary-foreground hover:text-sidebar-primary-foreground/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M8 6h10M6 12h10M4 18h10"/><path d="m18 12 4-4-4-4"/><path d="m18 12 4 4-4 4"/></svg>
                <span className="group-data-[collapsible=icon]:hidden">FinanceFlow</span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex-grow">
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} currentPath={pathname} locale={locale} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
             {utilityNavItems.map((item) => (
                <NavItem key={item.href} {...item} currentPath={pathname} locale={locale} />
              ))}
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="w-full" tooltip={{children: translations.logout, className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"}} aria-label={translations.logout}>
                    <LogOut className="h-5 w-5" />
                    <span className="truncate">{translations.logout}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 justify-between">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1"> 
            </div>
            <Link href={`/${locale}/profile`} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.name ? `https://placehold.co/40x40.png?text=${getInitials(currentUser.name)}` : undefined} alt={currentUser?.name || "User Avatar"} />
                  <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
                </Avatar>
                 <span className="text-sm font-medium hidden sm:inline">{currentUser?.name || 'User'}</span>
            </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
