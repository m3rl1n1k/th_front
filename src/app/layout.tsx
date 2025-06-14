
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GenkitClientProvider } from '@/components/GenkitClientProvider';
import { cookies } from 'next/headers';
import { ThemeProvider } from 'next-themes';
import { GlobalLoadingProvider } from '@/contexts/GlobalLoadingContext'; // Added
import { GlobalLoadingOverlay } from '@/components/shared/GlobalLoadingOverlay'; // Added

export const metadata: Metadata = {
  title: 'FinanceFlow',
  description: 'Manage your finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const currentLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  return (
    <html lang={currentLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground">
        <GlobalLoadingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GenkitClientProvider>
              {children}
            </GenkitClientProvider>
            <Toaster />
          </ThemeProvider>
          <GlobalLoadingOverlay />
        </GlobalLoadingProvider>
      </body>
    </html>
  );
}
