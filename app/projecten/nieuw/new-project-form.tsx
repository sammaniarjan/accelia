'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [substance, setSubstance] = useState('');
  const [indication, setIndication] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, substance_name: substance, indication }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? 'Fout');
      router.push(`/projecten/${json.project.id}/documenten`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-4">
      <Field label="Projectnaam (verplicht)" placeholder="bv. pembrolizumab NSCLC 1L" value={name} onChange={setName} required />
      <Field label="Stofnaam (INN)" placeholder="pembrolizumab" value={substance} onChange={setSubstance} />
      <Field label="Indicatie" placeholder="NSCLC, eerste lijn" value={indication} onChange={setIndication} />

      <button
        disabled={!name || busy}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? 'Aanmaken…' : 'Project aanmaken'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}
