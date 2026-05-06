import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { DocumentsManager } from './documents-manager';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: project } = await sb.from('projects').select('id, name').eq('id', id).single();
  const { data: docs } = await sb
    .from('project_documents')
    .select('id, filename, document_type, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link href={`/projecten/${id}`} className="text-sm text-brand-600">← terug naar project</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Brondata — {project?.name ?? ''}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload EPAR, SmPC, publicaties of richtlijnen. PDFs worden geparsed en geëmbed voor RAG.
      </p>

      <div className="mt-6">
        <DocumentsManager projectId={id} initialDocs={docs ?? []} />
      </div>
    </div>
  );
}
