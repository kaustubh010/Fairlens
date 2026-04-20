import { NextRequest, NextResponse } from 'next/server';
import { getAudit, storeAudit } from '@/lib/fairness/store';
import { generateAIExplanation } from '@/lib/fairness/gemini-explanation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { geminiApiKey } = body;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      );
    }
    
    const audit = getAudit(id);
    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    // Generate AI explanation
    const aiExplanation = await generateAIExplanation(audit, geminiApiKey);
    
    // Update audit with explanation
    const updatedAudit = { ...audit, aiExplanation };
    storeAudit(updatedAudit);
    
    return NextResponse.json({
      success: true,
      aiExplanation,
    });
  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation', details: String(error) },
      { status: 500 }
    );
  }
}
