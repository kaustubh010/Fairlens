import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAIExplanation } from '@/lib/fairness/gemini-explanation';
import type { BiasAuditResult } from '@/lib/fairness/types';

export async function POST(request: NextRequest) {
  try {
    const { auditId, geminiApiKey } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 });
    }

    const auditData = await prisma.auditResult.findUnique({
      where: { id: auditId },
    });

    if (!auditData) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is required' }, { status: 400 });
    }

    // Reconstruct BiasAuditResult for the explainer
    const auditResult: Omit<BiasAuditResult, 'aiExplanation'> = {
      id: auditData.id,
      datasetId: auditData.datasetId,
      datasetName: auditData.datasetName,
      auditedAt: auditData.createdAt,
      config: {
         protectedAttributes: auditData.protectedAttributes.map(col => ({ column: col, groups: [] }))
      } as any, // generateAIExplanation only needs the column names
      metrics: auditData.metrics as any,
      overallSeverity: auditData.overallSeverity as any,
      overallScore: auditData.overallScore,
      proxyCorrelations: auditData.proxyCorrelations as any,
      representationAnalysis: auditData.groupBreakdown as any, // Group breakdown is representationAnalysis
      recommendations: auditData.recommendations as any || [], 
    };

    const explanation = await generateAIExplanation(auditResult, apiKey);

    // Update audit with explanation
    await prisma.auditResult.update({
      where: { id: auditId },
      data: {
        aiExplanation: explanation as any,
      },
    });

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error('Explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
