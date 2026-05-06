import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accelia — ZIN dossier-assistent',
  description: 'Genereer concept FT-dossiers en vergelijk met de ZIN-kennisbank.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 border-r bg-white">
            <div className="border-b px-5 py-4">
              <Link href="/" className="block text-lg font-semibold tracking-tight text-brand-700">
                Accelia
              </Link>
              <p className="text-xs text-slate-500">ZIN dossier-assistent · MVP</p>
            </div>
            <nav className="px-3 py-4 text-sm">
              <NavSection title="Algemeen">
                <NavLink href="/" label="Dashboard" />
              </NavSection>
              <NavSection title="Kennisbank">
                <NavLink href="/kennisbank" label="Beoordelingen" />
                <NavLink href="/kennisbank/upload" label="Upload pakketadvies" />
              </NavSection>
              <NavSection title="Projecten">
                <NavLink href="/projecten" label="Alle projecten" />
                <NavLink href="/projecten/nieuw" label="Nieuw project" />
              </NavSection>
            </nav>
          </aside>
          <main className="flex-1 overflow-x-auto">
            <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
    >
      {label}
    </Link>
  );
}
