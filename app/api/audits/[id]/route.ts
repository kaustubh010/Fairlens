import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = await prisma.auditResult.findUnique({
    where: { id }
  });
  
  if (!audit) {
    return NextResponse.json(
      { error: 'Audit not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ audit });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await prisma.auditResult.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Audit not found' },
      { status: 404 }
    );
  }
}
