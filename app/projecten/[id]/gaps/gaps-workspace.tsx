'use client';

import { useState } from 'react';

interface GapRow {
  id: string;
  criterion: string | null;
  status: string | null;
  explanation: string | null;
  risk_level: string | null;
  recommendation: string | null;
  similar_cases: unknown;
}

export function GapsWorkspace({ projectId, initial }: { projectId: string; initial: GapRow[] }) {
  const [gaps, setGaps] = useState<GapRow[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Analyse faalde');
      const get = await fetch(`/api/gaps?projectId=${projectId}`);
      const data = await get.json();
      setGaps(data.gaps ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  type SimilarCase = {
    assessment_id: string;
    substance: string | null;
    indication: string | null;
    overall_verdict: string | null;
    publication_date: string | null;
    similarity: number;
  };
  const similar = (gaps[0]?.similar_cases as SimilarCase[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={busy}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Analyse loopt (kan 1-2 min duren)…' : gaps.length ? 'Opnieuw analyseren' : 'Analyseer'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {gaps.length === 0 ? (
        <p className="rounded-lg border bg-white p-6 text-sm text-slate-500">
          Nog geen analyse uitgevoerd. Klik op &quot;Analyseer&quot; om de vier ZIN-criteria te beoordelen.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {gaps.map((g) => (
              <div key={g.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{g.criterion}</h3>
                  <RiskPill level={g.risk_level} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="font-medium">{g.status ?? '—'}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Analyse</p>
                <p className="text-sm">{g.explanation ?? '—'}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Aanbeveling</p>
                <p className="text-sm">{g.recommendation ?? '—'}</p>
              </div>
            ))}
          </div>

          {similar.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold">Vergelijkbare historische ZIN-cases</h3>
              <ul className="mt-2 divide-y text-sm">
                {similar.map((s) => (
                  <li key={s.assessment_id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{s.substance ?? '?'} — {s.indication ?? '?'}</p>
                      <p className="text-xs text-slate-500">{s.publication_date ?? 'datum onbekend'} · similarity {s.similarity?.toFixed(3)}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s.overall_verdict ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RiskPill({ level }: { level: string | null }) {
  if (!level) return null;
  const palette: Record<string, string> = {
    laag: 'bg-emerald-100 text-emerald-800',
    midden: 'bg-amber-100 text-amber-800',
    hoog: 'bg-orange-100 text-orange-800',
    kritiek: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${palette[level] ?? 'bg-slate-100'}`}>
      risico: {level}
    </span>
  );
}
