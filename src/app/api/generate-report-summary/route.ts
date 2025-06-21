
import { NextRequest, NextResponse } from 'next/server';
import { generateReportSummary, type GenerateReportSummaryInput } from '@/ai/flows/generate-report-summary-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateReportSummaryInput;
    const result = await generateReportSummary(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
        { 
            message: `Server Error: ${error.message}`, 
            details: error.stack 
        }, 
        { status: 500 }
    );
  }
}
