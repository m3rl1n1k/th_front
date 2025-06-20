
import { NextRequest, NextResponse } from 'next/server';
import { generateReportSummary, GenerateReportSummaryInputSchema } from '@/ai/flows/generate-report-summary-flow';
import { z } from 'genkit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input against the Zod schema
    const validationResult = GenerateReportSummaryInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid input data', errors: validationResult.error.flatten() }, { status: 400 });
    }

    const validatedInput = validationResult.data;

    // Call the Genkit flow
    const result = await generateReportSummary(validatedInput);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/generate-report-summary:', error);
    // Check if error is from Genkit/AI or a general error
    let errorMessage = 'Failed to generate AI summary.';
    if (error.message) {
        errorMessage = error.message;
    }
    // Provide a more specific message if it's a known type of error from the flow, e.g. API key missing
    // For now, a generic message is fine for the prototype.
    
    return NextResponse.json({ message: errorMessage, details: error.toString() }, { status: 500 });
  }
}
