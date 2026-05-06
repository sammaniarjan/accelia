'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Extracted {
  document_title?: string | null;
  reference_number?: string | null;
  publication_date?: string | null;
  document_type?: string | null;
  route?: string | null;
  substance?: { inn_name?: string; trade_name?: string | null } | null;
  indication?: { name_nl?: string; therapeutic_area?: string | null } | null;
  comparator?: string | null;
  overall_verdict?: string | null;
  effectiveness_verdict?: string | null;
  paskwil_verdict?: string | null;
  cost_effectiveness_verdict?: string | null;
  trials?: { name?: string | null; pfs_hr?: number | null; os_hr?: number | null }[];
  [key: string]: unknown;
}

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'review' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [rawText, setRawText] = useState<string>('');

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setPhase('extracting');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('action', 'preview');
    try {
      const resp = await fetch('/api/extract', { method: 'POST', body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Extractie faalde');
      setExtracted(json.extracted);
      setRawText(json.rawText);
      setPhase('review');
    } catch (e) {
      setError((e as Error).message);
      setPhase('idle');
    }
  }

  async function handleSave() {
    if (!extracted) return;
    setError(null);
    setPhase('saving');
    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ extracted, rawText }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Opslaan faalde');
      setPhase('done');
      setTimeout(() => router.push(`/kennisbank/${json.assessmentId}`), 800);
    } catch (e) {
      setError((e as Error).message);
      setPhase('review');
    }
  }

  function update<K extends keyof Extracted>(key: K, value: Extracted[K]) {
    setExtracted((prev) => (prev ? { ...prev, [key]: value } : prev));
  }
  function updateNested(parent: 'substance' | 'indication', key: string, value: string) {
    setExtracted((prev) => {
      if (!prev) return prev;
      const child = (prev[parent] as Record<string, unknown>) ?? {};
      return { ...prev, [parent]: { ...child, [key]: value } };
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="rounded-lg border bg-white p-4">
        <label className="block text-sm font-medium">PDF-bestand</label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm"
        />
        <button
          type="submit"
          disabled={!file || phase === 'extracting'}
          className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {phase === 'extracting' ? 'Extractie loopt…' : 'Extract'}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      {phase === 'review' && extracted && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold">Review extractie</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controleer en pas aan waar nodig. Klik op opslaan om in de kennisbank te zetten.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Stof (INN)" value={extracted.substance?.inn_name ?? ''}
              onChange={(v) => updateNested('substance', 'inn_name', v)} />
            <Field label="Merknaam" value={extracted.substance?.trade_name ?? ''}
              onChange={(v) => updateNested('substance', 'trade_name', v)} />
            <Field label="Indicatie (NL)" value={extracted.indication?.name_nl ?? ''}
              onChange={(v) => updateNested('indication', 'name_nl', v)} />
            <Field label="Therapeutisch gebied" value={extracted.indication?.therapeutic_area ?? ''}
              onChange={(v) => updateNested('indication', 'therapeutic_area', v)} />
            <Field label="Document titel" value={extracted.document_title ?? ''}
              onChange={(v) => update('document_title', v)} />
            <Field label="Referentienummer" value={extracted.reference_number ?? ''}
              onChange={(v) => update('reference_number', v)} />
            <Field label="Publicatiedatum (YYYY-MM-DD)" value={extracted.publication_date ?? ''}
              onChange={(v) => update('publication_date', v)} />
            <Select label="Document type" value={extracted.document_type ?? ''}
              onChange={(v) => update('document_type', v)}
              options={['', 'pakketadvies', 'standpunt', 'herbeoordeling', 'ACP-advies']} />
            <Select label="Route" value={extracted.route ?? ''}
              onChange={(v) => update('route', v)}
              options={['', 'sluis', 'GVS', 'anders']} />
            <Select label="Overall verdict" value={extracted.overall_verdict ?? ''}
              onChange={(v) => update('overall_verdict', v)}
              options={['', 'positief', 'positief_met_voorwaarden', 'negatief', 'aangehouden']} />
            <Field label="Comparator" value={extracted.comparator ?? ''}
              onChange={(v) => update('comparator', v)} />
            <Field label="Effectiveness verdict" value={extracted.effectiveness_verdict ?? ''}
              onChange={(v) => update('effectiveness_verdict', v)} />
            <Field label="PASKWIL verdict" value={extracted.paskwil_verdict ?? ''}
              onChange={(v) => update('paskwil_verdict', v)} />
            <Field label="Kosteneffectiviteit oordeel" value={extracted.cost_effectiveness_verdict ?? ''}
              onChange={(v) => update('cost_effectiveness_verdict', v)} />
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-600">
              Volledige geëxtraheerde JSON ({extracted.trials?.length ?? 0} trials)
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(extracted, null, 2)}
            </pre>
          </details>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={(phase as string) === 'saving'}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {(phase as string) === 'saving' ? 'Opslaan…' : 'Opslaan in kennisbank'}
            </button>
            <button
              onClick={() => {
                setExtracted(null);
                setRawText('');
                setPhase('idle');
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Annuleren
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {phase === 'done' && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Opgeslagen. Je wordt doorgestuurd…
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o || '—'}</option>
        ))}
      </select>
    </label>
  );
}
