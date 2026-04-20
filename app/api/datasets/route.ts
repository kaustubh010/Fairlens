import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const datasets = await prisma.dataset.findMany({
    select: {
      id: true,
      name: true,
      rowCount: true,
      columns: true,
      uploadedAt: true,
    }
  });
  
  return NextResponse.json({
    datasets,
  });
}
