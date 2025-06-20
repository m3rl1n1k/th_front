
import { NextRequest, NextResponse } from 'next/server';
import { generateReportSummary, type GenerateReportSummaryInput } from '@/ai/flows/generate-report-summary-flow';
import { z } from 'zod'; // Use zod from the zod package directly

// Define the input schema for validation within the API route,
// as it cannot be directly imported from a 'use server' file.
// This schema should match the GenerateReportSummaryInput type structure.
const ReportStatsSchema = z.object({
  startOfMonthBalance: z.number().optional().describe("Balance at the start of the selected month, in cents."),
  endOfMonthBalance: z.number().optional().describe("Balance at the end of the selected month, in cents."),
  selectedMonthIncome: z.number().describe("Total income for the selected month, in cents."),
  selectedMonthExpense: z.number().describe("Total expenses for the selected month, in cents."),
});

const MonthlyFinancialSummarySchema = z.object({
  month: z.string().describe("Month name (e.g., 'Jan', 'Feb')."),
  income: z.number().describe("Total income for this month, in cents."),
  expense: z.number().describe("Total expenses for this month, in cents."),
});

const CategoryMonthlySummarySchema = z.object({
  categoryName: z.string().describe("Name of the expense category."),
  amount: z.number().describe("Total amount spent in this category for the month, in cents."),
  color: z.string().optional().describe("Color associated with the category (hex code)."),
});

const ApiGenerateReportSummaryInputSchema = z.object({
  reportStats: ReportStatsSchema.describe("Key financial statistics for the selected month."),
  yearlySummary: z.array(MonthlyFinancialSummarySchema).optional().describe("Summary of income and expenses for each month of the selected year."),
  categorySummary: z.array(CategoryMonthlySummarySchema).optional().describe("Summary of expenses by category for the selected month."),
  selectedYear: z.number().describe("The year selected for the report."),
  selectedMonth: z.number().min(1).max(12).describe("The month selected for the report (1-12)."),
  monthName: z.string().describe("Full name of the selected month in the target language (e.g., 'January', 'Січень')."),
  currencyCode: z.string().length(3).describe("The currency code (e.g., USD, UAH)."),
  language: z.string().describe("The language for the report summary (e.g., 'en', 'uk')."),
});


export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_API_KEY) {
    const errorMessage = 'CRITICAL SERVER CONFIGURATION ERROR: GOOGLE_API_KEY environment variable is not set. AI API cannot function.';
    console.error("***********************************************************************************");
    console.error(errorMessage);
    console.error("***********************************************************************************");
    return NextResponse.json(
      { 
        message: 'Server configuration error: AI API key is missing. Please ensure GOOGLE_API_KEY is set in the server environment.',
        details: 'GOOGLE_API_KEY environment variable not found on the server.'
      }, 
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    const validationResult = ApiGenerateReportSummaryInputSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn('Invalid input data for /api/generate-report-summary:', validationResult.error.flatten());
      return NextResponse.json({ message: 'Invalid input data', errors: validationResult.error.flatten() }, { status: 400 });
    }

    // The body is now validated against ApiGenerateReportSummaryInputSchema.
    // It is structurally compatible with GenerateReportSummaryInput type.
    const validatedInput = validationResult.data as GenerateReportSummaryInput;

    const result = await generateReportSummary(validatedInput);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('--- UNHANDLED ERROR IN /api/generate-report-summary ---');
    console.error('Error Type:', typeof error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.cause) {
      console.error('Error Cause:', error.cause);
    }
    
    try {
      console.error('Full Error Object (stringified):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.error('Full Error Object (raw):', error);
    }
    console.error('--- END OF UNHANDLED ERROR ---');

    let errorMessage = 'Failed to generate AI summary due to a server-side issue.';
    let errorDetails = 'No additional details available from the error object.';

    if (typeof error.message === 'string') {
        errorMessage = error.message;
    } else if (error.message) {
        try {
            errorMessage = JSON.stringify(error.message);
        } catch {
            errorMessage = String(error.message);
        }
    }
    
    if (typeof error.stack === 'string') {
        errorDetails = error.stack;
    } else {
         try {
            errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch {
            errorDetails = String(error);
        }
    }
    
    const lowerErrorMessage = errorMessage.toLowerCase();
    if (lowerErrorMessage.includes('api key') || 
        lowerErrorMessage.includes('permission denied') || 
        lowerErrorMessage.includes('authentication failed') ||
        lowerErrorMessage.includes('quota') ||
        (error.status === 403 || error.code === 403) ||
        (error.status === 401 || error.code === 401)) {
      errorMessage = "AI model API key error or permission issue. Ensure GOOGLE_API_KEY is correctly set and valid on the server.";
      errorDetails = `Original error: ${errorMessage}. Full details logged on server.`;
    }


    return NextResponse.json(
        { 
            message: `Server Error: ${errorMessage}`, 
            details: errorDetails 
        }, 
        { status: 500 }
    );
  }
}
