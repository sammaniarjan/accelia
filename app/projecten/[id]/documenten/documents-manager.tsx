'use client';

import { useState } from 'react';

interface Doc {
  id: string;
  filename: string;
  document_type: string | null;
  created_at: string;
}

const TYPES = ['EPAR', 'SmPC', 'CSR', 'publicatie', 'richtlijn', 'overig'];

export function DocumentsManager({ projectId, initialDocs }: { projectId: string; initialDocs: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('EPAR');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', type);
      const resp = await fetch(`/api/projects/${projectId}/documents`, { method: 'POST', body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Upload faalde');
      setDocs([json.document, ...docs]);
      setFile(null);
      (document.getElementById('doc-file') as HTMLInputElement | null)?.value && ((document.getElementById('doc-file') as HTMLInputElement).value = '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 rounded-md border px-2 py-1.5 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="text-xs font-medium text-slate-600">Bestand (PDF of tekst)</span>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <button
            disabled={!file || busy}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? 'Uploaden…' : 'Upload + embed'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Bestand</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Toegevoegd</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">Nog geen documenten.</td></tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2 font-medium">{d.filename}</td>
                  <td className="px-4 py-2">{d.document_type ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{new Date(d.created_at).toLocaleString('nl-NL')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
