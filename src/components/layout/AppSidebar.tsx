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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth'; // Mock logout
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
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import React from 'react';


const NavItem = ({ href, icon: Icon, label, currentPath, subItems }: { href: string; icon: React.ElementType; label: string; currentPath: string, subItems?: {href: string, label: string}[] }) => {
  const isActive = subItems ? subItems.some(sub => currentPath.startsWith(sub.href)) || currentPath === href : currentPath.startsWith(href);
  const [isOpen, setIsOpen] = React.useState(isActive);

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
                        <Link href={subItem.href} legacyBehavior passHref>
                            <SidebarMenuSubButton isActive={currentPath.startsWith(subItem.href)} aria-label={subItem.label}>
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
        <Link href={href} legacyBehavior passHref>
            <SidebarMenuButton isActive={isActive} tooltip={{children: label, className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"}} aria-label={label}>
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
            </SidebarMenuButton>
        </Link>
    </SidebarMenuItem>
  );
};


export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { href: '/categories', icon: Tags, label: 'Categories' },
    { href: '/wallets', icon: Wallet, label: 'Wallets' },
    { href: '/transfers', icon: Repeat, label: 'Transfers' },
  ];
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-headline text-xl text-sidebar-primary-foreground hover:text-sidebar-primary-foreground/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M8 6h10M6 12h10M4 18h10"/><path d="m18 12 4-4-4-4"/><path d="m18 12 4 4-4 4"/></svg>
                <span className="group-data-[collapsible=icon]:hidden">FinanceFlow</span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} currentPath={pathname} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="w-full" tooltip={{children: "Logout", className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border"}} aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                    <span className="truncate">Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 justify-between md:justify-end">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            {/* Add user menu or other header items here if needed */}
             <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
