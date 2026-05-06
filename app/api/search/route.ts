import { NextRequest, NextResponse } from 'next/server';
import { searchChunks } from '@/lib/search';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, source, projectId, matchCount } = body ?? {};
  if (!query) return NextResponse.json({ error: 'query is verplicht' }, { status: 400 });
  const result = await searchChunks(query, {
    source: source ?? undefined,
    projectId: projectId ?? undefined,
    matchCount: matchCount ?? 10,
  });
  return NextResponse.json({ matches: result });
}
