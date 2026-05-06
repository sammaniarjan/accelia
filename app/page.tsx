import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Tel knowledge & projects. Bij ontbrekende env / Supabase: laat een config-instructie zien.
  let assessmentCount: number | null = null;
  let projectCount: number | null = null;
  let recentProjects: { id: string; name: string; status: string | null; created_at: string }[] = [];
  let configError: string | null = null;

  try {
    const sb = supabaseAdmin();
    const [{ count: aCount }, { count: pCount }, { data: recents }] = await Promise.all([
      sb.from('assessments').select('*', { count: 'exact', head: true }),
      sb.from('projects').select('*', { count: 'exact', head: true }),
      sb
        .from('projects')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    assessmentCount = aCount ?? 0;
    projectCount = pCount ?? 0;
    recentProjects = recents ?? [];
  } catch (e) {
    configError = (e as Error).message;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-slate-500">
        Welkom bij Accelia. Bouw je ZIN-kennisbank op en genereer concept FT-dossiers.
      </p>

      {configError && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Configuratie ontbreekt</p>
          <p className="mt-1">{configError}</p>
          <p className="mt-2">
            Zie <code>README.md</code> voor de eerste-keer setup van Supabase + .env.local.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Beoordelingen in kennisbank" value={assessmentCount ?? '—'} href="/kennisbank" />
        <Stat label="Klantprojecten" value={projectCount ?? '—'} href="/projecten" />
        <Stat label="Nieuwe upload" value={'+'} href="/kennisbank/upload" />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recente projecten</h2>
        {recentProjects.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nog geen projecten.{' '}
            <Link className="text-brand-600 underline" href="/projecten/nieuw">
              Maak er een aan
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-lg border bg-white">
            {recentProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projecten/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleString('nl-NL')}
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
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-4 transition hover:shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-700">{value}</p>
    </Link>
  );
}
