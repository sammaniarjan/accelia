import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const [{ data: project }, { count: docCount }, { count: sectionCount }, { count: gapCount }] =
    await Promise.all([
      sb.from('projects').select('*').eq('id', id).single(),
      sb.from('project_documents').select('*', { count: 'exact', head: true }).eq('project_id', id),
      sb.from('dossier_sections').select('*', { count: 'exact', head: true }).eq('project_id', id),
      sb.from('gap_analysis').select('*', { count: 'exact', head: true }).eq('project_id', id),
    ]);

  if (!project) {
    return (
      <div>
        <Link href="/projecten" className="text-sm text-brand-600">← terug</Link>
        <h1 className="mt-2 text-xl font-semibold">Project niet gevonden</h1>
      </div>
    );
  }

  return (
    <div>
      <Link href="/projecten" className="text-sm text-brand-600">← terug</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{project.name}</h1>
      <p className="text-sm text-slate-500">
        {project.substance_name ?? '—'} · {project.indication ?? '—'}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile href={`/projecten/${id}/documenten`} title="Brondata" subtitle={`${docCount ?? 0} documenten`} />
        <Tile href={`/projecten/${id}/dossier`} title="FT-dossier" subtitle={`${sectionCount ?? 0} secties`} />
        <Tile href={`/projecten/${id}/gaps`} title="Gap-analyse" subtitle={`${gapCount ?? 0} bevindingen`} />
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4 text-sm text-slate-600">
        <p className="font-semibold">Aanbevolen volgorde</p>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Upload brondata (EPAR, SmPC, publicaties, richtlijnen) onder &quot;Brondata&quot;.</li>
          <li>Genereer per sectie het concept-dossier en review.</li>
          <li>Draai de gap-analyse om risico&apos;s te zien.</li>
          <li>Exporteer naar Word vanaf de dossier-pagina.</li>
        </ol>
      </div>
    </div>
  );
}

function Tile({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-4 transition hover:shadow-sm">
      <p className="text-sm font-semibold text-brand-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Link>
  );
}
