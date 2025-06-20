
'use server';
/**
 * @fileOverview A Genkit flow to generate AI-powered financial report summaries.
 *
 * - generateReportSummary - A function that handles the financial report summary generation.
 * - GenerateReportSummaryInput - The input type for the generateReportSummary function.
 * - GenerateReportSummaryOutput - The return type for the generateReportSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas internally, do not export them from a 'use server' file.
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

const GenerateReportSummaryInputInternalSchema = z.object({
  reportStats: ReportStatsSchema.describe("Key financial statistics for the selected month."),
  yearlySummary: z.array(MonthlyFinancialSummarySchema).optional().describe("Summary of income and expenses for each month of the selected year."),
  categorySummary: z.array(CategoryMonthlySummarySchema).optional().describe("Summary of expenses by category for the selected month."),
  selectedYear: z.number().describe("The year selected for the report."),
  selectedMonth: z.number().min(1).max(12).describe("The month selected for the report (1-12)."),
  monthName: z.string().describe("Full name of the selected month in the target language (e.g., 'January', 'Січень')."),
  currencyCode: z.string().length(3).describe("The currency code (e.g., USD, UAH)."),
  language: z.string().describe("The language for the report summary (e.g., 'en', 'uk')."),
});
export type GenerateReportSummaryInput = z.infer<typeof GenerateReportSummaryInputInternalSchema>;

const GenerateReportSummaryOutputInternalSchema = z.object({
  summaryText: z.string().describe("AI-generated financial summary and analysis in the requested language."),
});
export type GenerateReportSummaryOutput = z.infer<typeof GenerateReportSummaryOutputInternalSchema>;

export async function generateReportSummary(input: GenerateReportSummaryInput): Promise<GenerateReportSummaryOutput> {
  return generateReportSummaryFlow(input);
}

const generateReportSummaryPrompt = ai.definePrompt({
  name: 'generateFinancialReportSummaryPrompt',
  input: { schema: GenerateReportSummaryInputInternalSchema }, // Use internal schema
  output: { schema: GenerateReportSummaryOutputInternalSchema }, // Use internal schema
  prompt: `You are a helpful financial assistant. Analyze the provided financial data for {{monthName}} {{selectedYear}} and generate a concise summary in {{language}}.
The currency for all amounts is {{currencyCode}}. All monetary values are provided in cents and should be presented to the user in a human-readable format (e.g., by dividing by 100 and showing two decimal places).

Data Overview for {{monthName}} {{selectedYear}}:
{{#if reportStats.startOfMonthBalance}}
- Starting Balance: {{reportStats.startOfMonthBalance}} cents
{{/if}}
{{#if reportStats.endOfMonthBalance}}
- Ending Balance: {{reportStats.endOfMonthBalance}} cents
{{/if}}
- Total Income: {{reportStats.selectedMonthIncome}} cents
- Total Expenses: {{reportStats.selectedMonthExpense}} cents

{{#if yearlySummary.length}}
Monthly Breakdown for {{selectedYear}} (Income/Expense in cents):
{{#each yearlySummary}}
- {{month}}: Income {{income}}, Expense {{expense}}
{{/each}}
{{else}}
{{#unless reportStats.startOfMonthBalance}} 
{{#unless reportStats.endOfMonthBalance}}
{{! If no yearly data AND no balance data, consider mentioning no extensive historical data }}
- No detailed yearly breakdown available for {{selectedYear}}.
{{/unless}}
{{/unless}}
{{/if}}


Top Expense Categories for {{monthName}} {{selectedYear}} (Amount in cents):
{{#if categorySummary.length}}
  {{#each categorySummary}}
  - {{categoryName}}: {{amount}}
  {{/each}}
{{else}}
- No specific category spending data provided for this month.
{{/if}}

Based on this data:
1. Provide a brief overview of the financial situation for {{monthName}} {{selectedYear}}.
2. Comment on the income vs. expense for the month. Was there a surplus or deficit?
{{#if yearlySummary.length}}
3. Highlight any notable trends from the yearly summary if applicable (e.g., consistently high/low income/expense months).
{{/if}}
4. Mention the top 2-3 spending categories for {{monthName}} and their significance. If no category data is available, state that.
5. Offer one or two general, actionable insights or observations if possible, based strictly on the data provided. Avoid making investment advice or predictions.
Keep the summary clear, concise, and easy to understand for a general user. Ensure the output is in {{language}}.
Present monetary values by dividing them by 100 and formatting with the currency code (e.g., $123.45 {{currencyCode}}). Do not show "cents" in the output.
`,
});

const generateReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateReportSummaryFlow',
    inputSchema: GenerateReportSummaryInputInternalSchema, // Use internal schema
    outputSchema: GenerateReportSummaryOutputInternalSchema, // Use internal schema
  },
  async (input) => {
    const { output } = await generateReportSummaryPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a summary.");
    }
    return output;
  }
);
