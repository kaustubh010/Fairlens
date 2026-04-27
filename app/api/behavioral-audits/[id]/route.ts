import { NextRequest, NextResponse } from 'next/server';
import { getBehavioralAudit } from '@/lib/behavioral/store';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const audit = getBehavioralAudit(id);
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ audit });
}

