import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { GapsWorkspace } from './gaps-workspace';

export const dynamic = 'force-dynamic';

export default async function GapsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: project } = await sb.from('projects').select('id, name').eq('id', id).single();
  const { data: gaps } = await sb
    .from('gap_analysis')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link href={`/projecten/${id}`} className="text-sm text-brand-600">← terug naar project</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gap-analyse — {project?.name ?? ''}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Vergelijkt de beschikbare evidence met de vier ZIN-criteria en historische cases.
      </p>

      <div className="mt-6">
        <GapsWorkspace projectId={id} initial={gaps ?? []} />
      </div>
    </div>
  );
}
