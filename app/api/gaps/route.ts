import { NextRequest, NextResponse } from 'next/server';
import { runGapAnalysis } from '@/lib/gaps';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId is verplicht' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('gap_analysis')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gaps: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId } = body ?? {};
  if (!projectId) return NextResponse.json({ error: 'projectId is verplicht' }, { status: 400 });
  try {
    const result = await runGapAnalysis(projectId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
