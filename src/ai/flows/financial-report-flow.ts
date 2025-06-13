
'use server';
/**
 * @fileOverview Generates a financial analysis report using AI.
 *
 * - generateFinancialReport - A function that triggers the financial report generation flow.
 * - GenerateFinancialReportInput - The input type (currently empty, implies user context).
 * - GenerateFinancialReportOutput - The output type, containing the report.
 */

import {z} from 'genkit';
import {ai} from '@/ai/genkit';
import type {Transaction, MainCategory, SubCategory} from '@/lib/definitions';
import {getTransactions, getMainCategories, getSubCategories} from '@/lib/actions';

export const GenerateFinancialReportInputSchema = z.object({
  // For this flow, we'll fetch data based on the authenticated user contextually
  // No explicit userId needed in the input for this version.
  // placeholder: z.string().optional().describe("A placeholder if any input is ever needed."),
});
export type GenerateFinancialReportInput = z.infer<typeof GenerateFinancialReportInputSchema>;

export const GenerateFinancialReportOutputSchema = z.object({
  reportContent: z.string().describe("The generated financial report content in Markdown format."),
  summary: z.string().describe("A brief summary of the financial status."),
  suggestions: z.array(z.string()).describe("Actionable suggestions based on the analysis."),
});
export type GenerateFinancialReportOutput = z.infer<typeof GenerateFinancialReportOutputSchema>;

export async function generateFinancialReport(
  // input: GenerateFinancialReportInput // No input needed for now
  input: Record<string, never> // Using Record for empty object
): Promise<GenerateFinancialReportOutput> {
  return financialReportFlow(input);
}

const reportPrompt = ai.definePrompt({
  name: 'financialReportPrompt',
  input: { schema: z.object({ transactionsJson: z.string(), categoriesJson: z.string() }) },
  output: { schema: GenerateFinancialReportOutputSchema },
  prompt: `
You are a financial analyst AI. Analyze the following financial data for a user and generate a comprehensive report.
The report should be in Markdown format. Transactions without a sub-category or main-category should be treated as 'Uncategorized'.

Data:
Transactions (JSON):
{{{transactionsJson}}}

Categories (JSON):
{{{categoriesJson}}}

Based on this data, provide:
1.  A general "reportContent" in Markdown that includes:
    *   An overview of income vs. expenses.
    *   Spending breakdown by main categories (include an 'Uncategorized' section if applicable).
    *   Identification of any significant trends or unusual spending.
    *   Observations about spending habits.
2.  A concise "summary" of the overall financial health.
3.  A list of actionable "suggestions" for better financial management (e.g., areas to cut costs, budgeting tips).

Ensure the output is structured according to the Output Schema (reportContent, summary, suggestions).
Be insightful and provide practical advice.
`,
});

const financialReportFlow = ai.defineFlow(
  {
    name: 'financialReportFlow',
    inputSchema: GenerateFinancialReportInputSchema, // Use the empty input schema
    outputSchema: GenerateFinancialReportOutputSchema,
  },
  async (/*input*/) => { // Input is not used as data is fetched internally
    // In a real app, you'd get the current user's ID securely
    // For mock, data is filtered by 'user-123' in actions.ts based on getCurrentUser()
    const transactions: Transaction[] = await getTransactions();
    const mainCategories: MainCategory[] = await getMainCategories();
    const subCategoriesData: SubCategory[] = await getSubCategories(); // Renamed to avoid conflict

    const categoryMap = new Map(mainCategories.map(mc => [mc.id, mc.name]));
    const subCategoryToMainCategoryMap = new Map(subCategoriesData.map(sc => [sc.id, {mainCategoryId: sc.mainCategoryId, mainCategoryName: categoryMap.get(sc.mainCategoryId) || 'N/A'}]));

    const processedTransactions = transactions.map(t => {
      let mainCatName = 'Uncategorized';
      let subCatName = 'Uncategorized';

      if (t.subCategoryId) {
        const subCatDetails = subCategoriesData.find(sc => sc.id === t.subCategoryId);
        if (subCatDetails) {
          subCatName = subCatDetails.name;
          const mainCat = mainCategories.find(mc => mc.id === subCatDetails.mainCategoryId);
          if (mainCat) {
            mainCatName = mainCat.name;
          } else {
            mainCatName = 'N/A (Main Category Missing)';
          }
        } else {
          subCatName = 'N/A (Sub Category Missing)';
        }
      }
      
      return {
        ...t,
        amount: t.type === 'Expense' ? -t.amount : t.amount, // Represent expenses as negative
        mainCategoryName: mainCatName,
        subCategoryName: subCatName,
        createdAt: t.createdAt.toISOString().split('T')[0], // Format date for readability
      };
    });
    
    const transactionsJson = JSON.stringify(processedTransactions, null, 2);
    const categoriesJson = JSON.stringify(mainCategories.map(c => ({ name: c.name, color: c.color})), null, 2);

    const {output} = await reportPrompt({ transactionsJson, categoriesJson });

    if (!output) {
      console.error('Financial report prompt did not return structured output.');
      return {
        reportContent: 'Error: Could not generate report content.',
        summary: 'Error: Could not generate summary.',
        suggestions: ['Investigate report generation error.'],
      };
    }
    return output;
  }
);
