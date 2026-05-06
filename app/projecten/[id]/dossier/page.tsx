import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { DossierWorkspace } from './dossier-workspace';
import { DOSSIER_SECTIONS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: project } = await sb.from('projects').select('id, name').eq('id', id).single();
  const { data: rows } = await sb
    .from('dossier_sections')
    .select('*')
    .eq('project_id', id)
    .order('version', { ascending: false });

  // Pak laatste versie per section_key
  const seen = new Set<string>();
  const latest = (rows ?? []).filter((r) => {
    if (seen.has(r.section_key)) return false;
    seen.add(r.section_key);
    return true;
  });

  return (
    <div>
      <Link href={`/projecten/${id}`} className="text-sm text-brand-600">← terug naar project</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">FT-dossier — {project?.name ?? ''}</h1>
        <a
          href={`/api/export?projectId=${id}`}
          className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Exporteer Word
        </a>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Genereer en review per sectie. Inhoud wordt automatisch opgeslagen.
      </p>

      <div className="mt-6">
        <DossierWorkspace projectId={id} sections={DOSSIER_SECTIONS} initial={latest} />
      </div>
    </div>
  );
}
