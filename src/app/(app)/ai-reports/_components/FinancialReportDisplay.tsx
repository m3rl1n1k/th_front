
'use client';

import React,
{
  useState,
  useEffect,
  useTransition // Added useTransition
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GenerateFinancialReportOutput } from '../../../../ai/flows/financial-report-flow'; // Changed to relative path
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FinancialReportDisplayProps {
  onGenerateReport: () => Promise<GenerateFinancialReportOutput>;
  translations: {
    generateButton?: string;
    generatingButton?: string;
    reportTitle?: string;
    noReport?: string;
    errorTitle?: string;
    errorDescription?: string;
    summary?: string; 
    suggestions?: string; 
  };
}

export function FinancialReportDisplay({ onGenerateReport, translations }: FinancialReportDisplayProps) {
  const [reportData, setReportData] = useState<GenerateFinancialReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();


  const handleGenerate = () => {
    setError(null);
    setReportData(null);

    startTransition(async () => {
      try {
        const result = await onGenerateReport();
        setReportData(result);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Button onClick={handleGenerate} disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {translations.generatingButton || 'Generating...'}
          </>
        ) : (
          translations.generateButton || 'Generate Financial Report'
        )}
      </Button>

      {isPending && !reportData && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{translations.reportTitle || 'Financial Report'}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading report...</p>
          </CardContent>
        </Card>
      )}

      {error && (
         <Card className="shadow-lg border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{translations.errorTitle || 'Report Generation Failed'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{translations.errorDescription?.replace('{error}', error) || error}</p>
          </CardContent>
        </Card>
      )}

      {reportData && !error && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{translations.reportTitle || 'Financial Report'}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reportData.reportContent}
              </ReactMarkdown>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{translations.summary || 'Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reportData.summary}
              </ReactMarkdown>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{translations.suggestions || 'Suggestions'}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
              <ul>
                {reportData.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {!isPending && !reportData && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{translations.reportTitle || 'Financial Report'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{translations.noReport || 'No report generated yet. Click the button above to generate one.'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
