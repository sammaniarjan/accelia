import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { KennisbankTable } from './kennisbank-table';

export const dynamic = 'force-dynamic';

export default async function KennisbankPage() {
  let rows: Awaited<ReturnType<typeof loadAssessments>> = [];
  let configError: string | null = null;
  try {
    rows = await loadAssessments();
  } catch (e) {
    configError = (e as Error).message;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kennisbank</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alle ZIN-beoordelingen die in dit systeem zijn ingelezen.
          </p>
        </div>
        <Link
          href="/kennisbank/upload"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Pakketadvies uploaden
        </Link>
      </div>

      {configError ? (
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {configError}
        </p>
      ) : (
        <div className="mt-6">
          <KennisbankTable rows={rows} />
        </div>
      )}
    </div>
  );
}

async function loadAssessments() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('assessments')
    .select(
      'id, document_title, publication_date, route, overall_verdict, comparator, document_type, substance:substances(inn_name, trade_name), indication:indications(name_nl, therapeutic_area)',
    )
    .order('publication_date', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const sub = Array.isArray(r.substance) ? r.substance[0] : r.substance;
    const ind = Array.isArray(r.indication) ? r.indication[0] : r.indication;
    return {
      id: r.id as string,
      title: (r.document_title as string | null) ?? '(geen titel)',
      date: r.publication_date as string | null,
      route: r.route as string | null,
      verdict: r.overall_verdict as string | null,
      comparator: r.comparator as string | null,
      type: r.document_type as string | null,
      substance: sub?.inn_name ?? null,
      tradeName: sub?.trade_name ?? null,
      indication: ind?.name_nl ?? null,
      area: ind?.therapeutic_area ?? null,
    };
  });
}
