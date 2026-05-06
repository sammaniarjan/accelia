'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

interface Row {
  id: string;
  title: string;
  date: string | null;
  route: string | null;
  verdict: string | null;
  comparator: string | null;
  type: string | null;
  substance: string | null;
  tradeName: string | null;
  indication: string | null;
  area: string | null;
}

export function KennisbankTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('');
  const [route, setRoute] = useState<string>('');
  const [verdict, setVerdict] = useState<string>('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (route && r.route !== route) return false;
      if (verdict && r.verdict !== verdict) return false;
      if (!needle) return true;
      const blob = [r.substance, r.tradeName, r.indication, r.comparator, r.title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q, route, verdict]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op stof, indicatie, comparator…"
          className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">Alle routes</option>
          <option value="sluis">Sluis</option>
          <option value="GVS">GVS</option>
          <option value="anders">Anders</option>
        </select>
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="rounded-md border px-2 py-1.5 text-sm"
        >
          <option value="">Alle uitkomsten</option>
          <option value="positief">Positief</option>
          <option value="positief_met_voorwaarden">Positief m. voorwaarden</option>
          <option value="negatief">Negatief</option>
          <option value="aangehouden">Aangehouden</option>
        </select>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} resultaten</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Stof</th>
              <th className="px-4 py-2">Indicatie</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Route</th>
              <th className="px-4 py-2">Datum</th>
              <th className="px-4 py-2">Uitkomst</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Geen resultaten. Upload een pakketadvies om te starten.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/kennisbank/${r.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.substance ?? '(onbekend)'}
                    </Link>
                    {r.tradeName && (
                      <span className="ml-1 text-xs text-slate-400">({r.tradeName})</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {r.indication ?? '—'}
                    {r.area && <p className="text-xs text-slate-400">{r.area}</p>}
                  </td>
                  <td className="px-4 py-2">{r.type ?? '—'}</td>
                  <td className="px-4 py-2 capitalize">{r.route ?? '—'}</td>
                  <td className="px-4 py-2">{r.date ?? '—'}</td>
                  <td className="px-4 py-2">
                    <VerdictPill v={r.verdict} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerdictPill({ v }: { v: string | null }) {
  if (!v) return <span className="text-slate-400">—</span>;
  const palette: Record<string, string> = {
    positief: 'bg-emerald-100 text-emerald-800',
    positief_met_voorwaarden: 'bg-amber-100 text-amber-800',
    negatief: 'bg-red-100 text-red-800',
    aangehouden: 'bg-slate-200 text-slate-800',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${palette[v] ?? 'bg-slate-100 text-slate-700'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}
