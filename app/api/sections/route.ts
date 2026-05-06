import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/** GET ?projectId=... → laatste versie per sectie. */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId is verplicht' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('dossier_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // unieke laatste versie per section_key
  const seen = new Set<string>();
  const latest = (data ?? []).filter((row) => {
    if (seen.has(row.section_key)) return false;
    seen.add(row.section_key);
    return true;
  });
  return NextResponse.json({ sections: latest });
}

/** PATCH — bewerken van content of status. body: { id, content?, status? } */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, content, status } = body ?? {};
  if (!id) return NextResponse.json({ error: 'id is verplicht' }, { status: 400 });
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof content === 'string') update.content = content;
  if (typeof status === 'string') update.status = status;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('dossier_sections')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data });
}
