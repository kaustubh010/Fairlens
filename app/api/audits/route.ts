import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runFairnessAudit } from '@/lib/fairness/metrics';
import { generateAIExplanation } from '@/lib/fairness/gemini-explanation';
import { AuditConfig, DEFAULT_THRESHOLDS, BiasAuditResult } from '@/lib/fairness/types';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(lucia.sessionCookieName);
  if (!sessionCookie) return null;
  const { session } = await lucia.validateSession(sessionCookie.value);
  return session?.userId ?? null;
}

export async function GET() {
  const userId = await getUserId();
  
  const audits = await prisma.auditResult.findMany({
    where: userId ? { userId } : {},
    select: {
      id: true,
      datasetId: true,
      datasetName: true,
      createdAt: true,
      overallSeverity: true,
      overallScore: true,
      metrics: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json({
    audits: audits.map(a => {
      const metrics = a.metrics as any[] || [];
      return {
        id: a.id,
        datasetId: a.datasetId,
        datasetName: a.datasetName,
        auditedAt: a.createdAt,
        overallSeverity: a.overallSeverity,
        overallScore: a.overallScore,
        metricsCount: metrics.length,
        passedCount: metrics.filter((m: any) => m.passed).length,
      }
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const {
      datasetId,
      protectedAttributes,
      outcomeColumn,
      predictedColumn,
      probabilityColumn,
      positiveOutcomeValue,
      thresholds,
      geminiApiKey,
    } = body;
    
    // Validate required fields
    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      );
    }
    
    if (!protectedAttributes || protectedAttributes.length === 0) {
      return NextResponse.json(
        { error: 'At least one protected attribute is required' },
        { status: 400 }
      );
    }
    
    if (!outcomeColumn) {
      return NextResponse.json(
        { error: 'Outcome column is required' },
        { status: 400 }
      );
    }
    
    // Get dataset from DB
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId }
    });
    
    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }
    
    const rawData = dataset.rawData as any[];
    
    // Build audit config
    const config: AuditConfig = {
      datasetId,
      protectedAttributes: protectedAttributes.map((attr: { column: string; referenceGroup?: string }) => ({
        column: attr.column,
        groups: [...new Set(rawData.map(r => String(r[attr.column])))],
        referenceGroup: attr.referenceGroup,
      })),
      outcomeColumn,
      predictedColumn: predictedColumn || undefined,
      probabilityColumn: probabilityColumn || undefined,
      positiveOutcomeValue: positiveOutcomeValue ?? 1,
      thresholds: { ...DEFAULT_THRESHOLDS, ...thresholds },
    };
    
    // Build a Dataset object required by runFairnessAudit
    const mappedDataset = {
      id: dataset.id,
      name: dataset.name,
      rows: rawData,
      columns: dataset.columns as any,
      rowCount: dataset.rowCount,
      uploadedAt: dataset.uploadedAt,
    };
    
    // Run fairness audit
    const auditResult = runFairnessAudit(mappedDataset, config);
    
    // Generate AI explanation if API key provided
    let aiExplanationResult = null;
    if (geminiApiKey) {
      aiExplanationResult = await generateAIExplanation(auditResult, geminiApiKey);
    }
    
    const fullAudit = { ...auditResult, aiExplanation: aiExplanationResult };
    
    // Create audit in DB
    const createdAudit = await prisma.auditResult.create({
      data: {
        datasetId,
        datasetName: dataset.name,
        userId,
        protectedAttributes: protectedAttributes.map((attr: any) => attr.column),
        outcomeColumn,
        predictionColumn: predictedColumn,
        metrics: fullAudit.metrics as any,
        proxyCorrelations: fullAudit.proxyCorrelations as any,
        overallScore: fullAudit.overallScore,
        overallSeverity: fullAudit.overallSeverity,
        groupBreakdown: { representationAnalysis: fullAudit.representationAnalysis } as any,
        recommendations: fullAudit.recommendations as any,
        aiExplanation: fullAudit.aiExplanation as any,
      }
    });
    
    return NextResponse.json({
      success: true,
      audit: {
        ...fullAudit,
        id: createdAudit.id,
        auditedAt: createdAudit.createdAt
      },
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to run audit', details: String(error) },
      { status: 500 }
    );
  }
}
