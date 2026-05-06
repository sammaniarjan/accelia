import 'server-only';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { supabaseAdmin } from './supabase';
import { DOSSIER_SECTIONS } from './types';

export async function exportProjectDossierDocx(projectId: string): Promise<Buffer> {
  const sb = supabaseAdmin();
  const { data: project } = await sb
    .from('projects')
    .select('id, name, substance_name, indication')
    .eq('id', projectId)
    .single();

  const { data: sections } = await sb
    .from('dossier_sections')
    .select('section_key, section_title, content, version, status')
    .eq('project_id', projectId);

  const byKey = new Map<string, { title: string; content: string; status: string }>();
  for (const s of sections ?? []) {
    byKey.set(s.section_key, {
      title: s.section_title ?? s.section_key,
      content: s.content ?? '',
      status: s.status ?? 'draft',
    });
  }

  const children: Paragraph[] = [];

  // Cover
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(`Farmacotherapeutisch dossier`)],
    }),
    new Paragraph({
      children: [new TextRun({ text: project?.name ?? '(onbekend project)', bold: true, size: 28 })],
    }),
    new Paragraph({
      children: [
        new TextRun(`Geneesmiddel: ${project?.substance_name ?? '-'}`),
      ],
    }),
    new Paragraph({
      children: [new TextRun(`Indicatie: ${project?.indication ?? '-'}`)],
    }),
    new Paragraph({ children: [new TextRun(`Gegenereerd: ${new Date().toLocaleString('nl-NL')}`)] }),
    new Paragraph({ children: [new TextRun('')] }),
  );

  // Secties in ZIN-volgorde
  for (const s of DOSSIER_SECTIONS) {
    const entry = byKey.get(s.key);
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(s.title)],
      }),
    );
    if (!entry) {
      children.push(new Paragraph({ children: [new TextRun({ text: '(nog niet gegenereerd)', italics: true })] }));
      continue;
    }
    for (const para of (entry.content || '').split(/\n\n+/)) {
      children.push(
        new Paragraph({
          children: [new TextRun(para.replace(/\n/g, ' '))],
        }),
      );
    }
  }

  const doc = new Document({
    creator: 'Accelia MVP',
    title: `FT-dossier ${project?.name ?? ''}`,
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}
