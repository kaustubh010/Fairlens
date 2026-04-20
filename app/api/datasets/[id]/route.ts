import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dataset = await prisma.dataset.findUnique({
    where: { id }
  });
  
  if (!dataset) {
    return NextResponse.json(
      { error: 'Dataset not found' },
      { status: 404 }
    );
  }
  
  const rawData = dataset.rawData as any[];
  
  return NextResponse.json({
    dataset: {
      id: dataset.id,
      name: dataset.name,
      rowCount: dataset.rowCount,
      columns: dataset.columns,
      uploadedAt: dataset.uploadedAt,
      // Include sample rows for preview
      sampleRows: rawData.slice(0, 10),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await prisma.dataset.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Dataset not found' },
      { status: 404 }
    );
  }
}
