import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Dataset CSV auditing is retired in this version. Use /behavioral and /api/behavioral-audits/run for behavioral probing.',
    },
    { status: 410 }
  );
}
