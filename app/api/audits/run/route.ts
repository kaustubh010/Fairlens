import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runFairnessAudit } from '@/lib/fairness/metrics';
import { DEFAULT_THRESHOLDS } from '@/lib/fairness/types';
import type { AuditConfig } from '@/lib/fairness/types';
import type { AuditConfigData } from '@/components/fairlens/audit-config-form';

export async function POST(request: NextRequest) {
  try {
    const data: AuditConfigData = await request.json();

    const { datasetId, protectedAttributes, outcomeColumn, predictedColumn, probabilityColumn, positiveOutcomeValue } = data;

    // Validate configuration
    if (!datasetId) {
      return NextResponse.json({ error: 'Dataset ID is required' }, { status: 400 });
    }

    if (!protectedAttributes || protectedAttributes.length === 0) {
      return NextResponse.json(
        { error: 'At least one protected attribute is required' },
        { status: 400 }
      );
    }

    if (!outcomeColumn) {
      return NextResponse.json({ error: 'Outcome column is required' }, { status: 400 });
    }

    // Get dataset from DB
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId }
    });
    
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const fullProtectedAttributes = protectedAttributes.map(attr => {
       const columnValues = (dataset.rawData as Record<string,any>[]).map(r => r[attr.column]);
       const uniqueGroups = Array.from(new Set(columnValues.filter(Boolean))).map(String);
       return {
         column: attr.column,
         groups: uniqueGroups,
         referenceGroup: attr.referenceGroup
       };
    });

    const config: AuditConfig = {
      datasetId,
      protectedAttributes: fullProtectedAttributes,
      outcomeColumn,
      predictedColumn,
      probabilityColumn,
      positiveOutcomeValue,
      thresholds: DEFAULT_THRESHOLDS
    };

    const datasetObj = {
      id: dataset.id,
      name: dataset.name,
      rows: dataset.rawData as Record<string, unknown>[],
      columns: dataset.columns as any[],
      rowCount: dataset.rowCount,
      uploadedAt: dataset.uploadedAt
    };

    // Run fairness audit
    const auditResult = runFairnessAudit(datasetObj, config);

    // Create audit in DB
    const audit = await prisma.auditResult.create({
      data: {
        datasetId,
        datasetName: dataset.name,
        protectedAttributes: protectedAttributes.map(p => p.column),
        outcomeColumn,
        predictionColumn: predictedColumn,
        metrics: auditResult.metrics as any,
        proxyCorrelations: auditResult.proxyCorrelations as any,
        overallScore: auditResult.overallScore,
        overallSeverity: auditResult.overallSeverity,
        groupBreakdown: auditResult.representationAnalysis as any,
        recommendations: auditResult.recommendations as any,
      }
    });

    return NextResponse.json({
      success: true,
      audit: {
        ...auditResult,
        id: audit.id // Give it the real DB ID
      },
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to run audit' },
      { status: 500 }
    );
  }
}
