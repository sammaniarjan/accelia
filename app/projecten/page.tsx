import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ProjectenPage() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projecten</h1>
          <p className="mt-1 text-sm text-slate-500">Klant-dossiers in voorbereiding.</p>
        </div>
        <Link
          href="/projecten/nieuw"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nieuw project
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

      <div className="mt-6 rounded-lg border bg-white">
        {(data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nog geen projecten. Klik op &quot;Nieuw project&quot; om er een aan te maken.
          </p>
        ) : (
          <ul className="divide-y">
            {(data ?? []).map((p) => (
              <li key={p.id}>
                <Link href={`/projecten/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.substance_name ?? '—'} · {p.indication ?? '—'}
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">
                    {p.status ?? 'draft'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
