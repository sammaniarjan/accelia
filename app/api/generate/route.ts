import { NextRequest, NextResponse } from 'next/server';
import { generateSection } from '@/lib/generate';
import { DOSSIER_SECTIONS } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, sectionKey } = body ?? {};
  if (!projectId || !sectionKey) {
    return NextResponse.json({ error: 'projectId en sectionKey zijn verplicht' }, { status: 400 });
  }
  const section = DOSSIER_SECTIONS.find((s) => s.key === sectionKey);
  if (!section) {
    return NextResponse.json({ error: `Onbekende sectionKey: ${sectionKey}` }, { status: 400 });
  }
  try {
    const result = await generateSection({
      projectId,
      sectionKey: section.key,
      sectionTitle: section.title,
      promptFile: section.promptFile,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
