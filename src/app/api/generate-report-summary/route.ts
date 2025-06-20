
import { NextRequest, NextResponse } from 'next/server';
import { generateReportSummary, GenerateReportSummaryInputSchema } from '@/ai/flows/generate-report-summary-flow';
// z from 'genkit' is not explicitly needed here if schema comes from flow

export async function POST(request: NextRequest) {
  // Early check for server-side API key
  if (!process.env.GOOGLE_API_KEY) {
    console.error('CRITICAL SERVER CONFIGURATION ERROR: GOOGLE_API_KEY environment variable is not set.');
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
    
    const validationResult = GenerateReportSummaryInputSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn('Invalid input data for /api/generate-report-summary:', validationResult.error.flatten());
      return NextResponse.json({ message: 'Invalid input data', errors: validationResult.error.flatten() }, { status: 400 });
    }

    const validatedInput = validationResult.data;

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
    // Attempt to log more details if it's a complex object
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
        // Attempt to stringify if message is not a string (though uncommon for Error.message)
        try {
            errorMessage = JSON.stringify(error.message);
        } catch {
            errorMessage = String(error.message);
        }
    }
    
    // Try to get stack or a general string representation for details
    if (typeof error.stack === 'string') {
        errorDetails = error.stack;
    } else {
         try {
            errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch {
            errorDetails = String(error);
        }
    }
    
    // Check for common API key or permission issues in the error message
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
