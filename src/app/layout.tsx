import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/context/app-providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: {
    template: '%s | FinanceFlow',
    default: 'FinanceFlow - Your Personal Finance Manager',
  },
  description: 'Track expenses, manage budgets, and achieve your financial goals with FinanceFlow. The all-in-one finance app for clarity and control.',
  keywords: ['finance', 'budget', 'expense tracker', 'money manager', 'personal finance', 'savings', 'financial planning'],
  openGraph: {
    title: 'FinanceFlow - Your Personal Finance Manager',
    description: 'Track expenses, manage budgets, and achieve your financial goals with FinanceFlow.',
    url: 'https://financeflow.app', // placeholder
    siteName: 'FinanceFlow',
    images: [
      {
        url: 'https://placehold.co/1200x630.png', // placeholder OG image
        width: 1200,
        height: 630,
        alt: 'An overview of the FinanceFlow dashboard showing charts and financial data.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanceFlow - Your Personal Finance Manager',
    description: 'Track expenses, manage budgets, and achieve your financial goals with FinanceFlow.',
    images: ['https://placehold.co/1200x630.png'], // placeholder
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
            <Toaster />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
