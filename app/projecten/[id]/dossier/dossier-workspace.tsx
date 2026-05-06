'use client';

import { useEffect, useMemo, useState } from 'react';

interface SectionDef {
  key: string;
  title: string;
  promptFile: string;
}

interface SectionRow {
  id: string;
  section_key: string;
  section_title: string | null;
  content: string | null;
  status: string | null;
  version: number | null;
  sources: unknown;
  updated_at?: string | null;
}

export function DossierWorkspace({
  projectId,
  sections,
  initial,
}: {
  projectId: string;
  sections: SectionDef[];
  initial: SectionRow[];
}) {
  const initialMap = useMemo(() => {
    const m = new Map<string, SectionRow>();
    for (const r of initial) m.set(r.section_key, r);
    return m;
  }, [initial]);

  const [active, setActive] = useState(sections[0].key);
  const [data, setData] = useState<Map<string, SectionRow>>(initialMap);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>(initialMap.get(sections[0].key)?.content ?? '');

  useEffect(() => {
    setDraft(data.get(active)?.content ?? '');
  }, [active, data]);

  const current = sections.find((s) => s.key === active)!;
  const row = data.get(active);

  async function generate() {
    setError(null);
    setBusy('generate');
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, sectionKey: active }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Generatie faalde');
      // Refetch sections list
      const sresp = await fetch(`/api/sections?projectId=${projectId}`);
      const sjson = await sresp.json();
      const m = new Map<string, SectionRow>();
      for (const r of sjson.sections ?? []) m.set(r.section_key, r);
      setData(m);
      setDraft(m.get(active)?.content ?? json.content);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!row) return;
    setBusy('save');
    setError(null);
    try {
      const resp = await fetch('/api/sections', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, content: draft }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Opslaan faalde');
      const next = new Map(data);
      next.set(active, json.section);
      setData(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(status: string) {
    if (!row) return;
    setBusy('status');
    try {
      const resp = await fetch('/api/sections', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, status }),
      });
      const json = await resp.json();
      if (resp.ok) {
        const next = new Map(data);
        next.set(active, json.section);
        setData(next);
      }
    } finally {
      setBusy(null);
    }
  }

  const sources = (row?.sources as { id: string; source: string; section: string | null; preview: string }[] | null) ?? [];

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 rounded-lg border bg-white p-2">
        <ul className="text-sm">
          {sections.map((s) => {
            const r = data.get(s.key);
            const status = r?.status ?? null;
            return (
              <li key={s.key}>
                <button
                  onClick={() => setActive(s.key)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${
                    active === s.key ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>{s.title}</span>
                  {status && <StatusDot status={status} />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="col-span-6 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={busy !== null}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === 'generate' ? 'Genereren…' : row ? 'Regenereer' : 'Genereer'}
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Klik op Genereer om de eerste versie te maken…"
          className="mt-3 h-[60vh] w-full rounded-md border p-3 font-mono text-sm leading-relaxed focus:border-brand-500 focus:outline-none prose-zin"
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={save}
            disabled={!row || busy !== null}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === 'save' ? 'Opslaan…' : 'Wijzigingen opslaan'}
          </button>
          {row && (
            <>
              <select
                value={row.status ?? 'draft'}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-sm"
                disabled={busy !== null}
              >
                <option value="draft">draft</option>
                <option value="reviewed">reviewed</option>
                <option value="approved">approved</option>
              </select>
              <span className="text-xs text-slate-500">v{row.version ?? 1}</span>
            </>
          )}
        </div>
      </section>

      <aside className="col-span-3 rounded-lg border bg-white p-3">
        <h3 className="text-sm font-semibold">Gebruikte bronnen</h3>
        {sources.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Nog geen bronnen — genereer eerst de sectie.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {sources.map((s) => (
              <li key={s.id} className="rounded border p-2 text-xs">
                <p className="font-medium">
                  {s.source === 'project_document' ? 'Project' : 'Kennisbank'}
                  {s.section ? ` · ${s.section}` : ''}
                </p>
                <p className="mt-1 text-slate-600">{s.preview}…</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const palette: Record<string, string> = {
    draft: 'bg-slate-400',
    reviewed: 'bg-amber-400',
    approved: 'bg-emerald-500',
  };
  return <span className={`h-2 w-2 rounded-full ${palette[status] ?? 'bg-slate-300'}`} />;
}
