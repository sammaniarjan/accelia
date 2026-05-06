import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AssessmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('assessments')
    .select('*, substance:substances(*), indication:indications(*), trials(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return (
      <div>
        <Link href="/kennisbank" className="text-sm text-brand-600">← terug</Link>
        <h1 className="mt-2 text-xl font-semibold">Niet gevonden</h1>
        <p className="text-sm text-red-600">{error?.message ?? 'Onbekende beoordeling'}</p>
      </div>
    );
  }

  const sub = Array.isArray(data.substance) ? data.substance[0] : data.substance;
  const ind = Array.isArray(data.indication) ? data.indication[0] : data.indication;
  const trials = (data.trials ?? []) as Array<Record<string, unknown>>;

  return (
    <div>
      <Link href="/kennisbank" className="text-sm text-brand-600">← terug naar kennisbank</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {sub?.inn_name ?? '(onbekend)'}{' '}
        {sub?.trade_name && <span className="text-base text-slate-400">({sub.trade_name})</span>}
      </h1>
      <p className="text-sm text-slate-500">{ind?.name_nl ?? '—'}</p>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Block title="Document">
          <KV k="Titel" v={data.document_title} />
          <KV k="Type" v={data.document_type} />
          <KV k="Referentie" v={data.reference_number} />
          <KV k="Datum" v={data.publication_date} />
          <KV k="Route" v={data.route} />
          {data.source_pdf_url && (
            <p className="mt-1 text-xs">
              <a href={data.source_pdf_url} target="_blank" className="text-brand-600 underline">PDF bron</a>
            </p>
          )}
        </Block>

        <Block title="PICO">
          <KV k="Populatie" v={data.population} />
          <KV k="Interventie" v={data.intervention} />
          <KV k="Comparator" v={data.comparator} />
          <KV k="Comparator-validiteit" v={data.comparator_validity} />
          <KV k="Primaire endpoints" v={(data.primary_endpoints ?? []).join(', ') || null} />
        </Block>

        <Block title="Beoordeling">
          <KV k="Effectiviteit" v={data.effectiveness_verdict} />
          <KV k="PASKWIL" v={data.paskwil_verdict} />
          <KV k="Ziektelast" v={data.burden_category} />
          <KV k="Proportional shortfall" v={data.proportional_shortfall} />
          <KV k="ICER (lijstprijs)" v={data.icer_at_list} />
          <KV k="ICER drempel" v={data.icer_threshold} />
          <KV k="Kosteneffectiviteit" v={data.cost_effectiveness_verdict} />
          <KV k="Noodzakelijkheid" v={data.necessity_verdict} />
          <KV k="Uitvoerbaarheid" v={data.feasibility_verdict} />
          <KV k="Budget impact (jaar 3)" v={data.budget_impact_year3} />
        </Block>

        <Block title="Uitkomst">
          <KV k="Overall verdict" v={data.overall_verdict} />
          <KV k="Prijscondititie" v={data.price_condition === null ? null : data.price_condition ? 'ja' : 'nee'} />
          <KV k="Korting vereist" v={data.discount_required} />
          <KV k="Gepast gebruik" v={data.gepast_gebruik} />
          <KV k="Sluis-plaatsing" v={data.sluis_placement_date} />
          <KV k="Voorwaarden" v={(data.key_conditions ?? []).join('; ') || null} />
        </Block>

        <Block title="Commissies">
          <KV k="CieBOM" v={data.ciebom_position} />
          <KV k="WAR" v={data.war_position} />
          <KV k="ACP" v={data.acp_position} />
          <KV k="CieBAG" v={data.ciebag_position} />
        </Block>

        <Block title="Trials">
          {trials.length === 0 ? (
            <p className="text-sm text-slate-400">Geen trials geëxtraheerd.</p>
          ) : (
            <ul className="space-y-2">
              {trials.map((t) => (
                <li key={(t.id as string) ?? Math.random()} className="rounded border p-2 text-sm">
                  <p className="font-medium">{(t.name as string) ?? '(onbekend)'}</p>
                  <p className="text-xs text-slate-500">{(t.design as string) ?? ''}</p>
                  <p className="text-xs">
                    {t.n_patients ? `n=${t.n_patients}` : ''}{t.primary_endpoint ? ` · ${t.primary_endpoint as string}` : ''}
                  </p>
                  <p className="text-xs">
                    {t.pfs_hr ? `PFS HR ${t.pfs_hr} ${(t.pfs_hr_ci as string) ?? ''}` : ''}
                    {t.os_hr ? ` · OS HR ${t.os_hr} ${(t.os_hr_ci as string) ?? ''}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </section>

      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-slate-600">Ruwe extractie JSON</summary>
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(data.raw_extracted_json, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: unknown }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="col-span-2 break-words">{v === null || v === undefined || v === '' ? '—' : String(v)}</span>
    </div>
  );
}
