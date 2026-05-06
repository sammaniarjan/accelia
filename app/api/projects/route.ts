import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, substance_name, indication } = body ?? {};
  if (!name) return NextResponse.json({ error: 'name is verplicht' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('projects')
    .insert({ name, substance_name: substance_name ?? null, indication: indication ?? null })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}
