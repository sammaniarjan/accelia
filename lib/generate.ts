import 'server-only';
import { complete, MODELS } from './anthropic';
import { loadPrompt, fillTemplate } from './prompts';
import { searchChunks, type MatchedChunk } from './search';
import { supabaseAdmin } from './supabase';

interface GenerateSectionArgs {
  projectId: string;
  sectionKey: string;
  sectionTitle: string;
  promptFile: string;
}

interface GenerateSectionResult {
  content: string;
  sources: { id: string; source: string; section: string | null; preview: string }[];
}

/**
 * Genereer één FT-dossier sectie:
 *  1. lees project-context (substance, indicatie)
 *  2. zoek relevante chunks in project-documenten + kennisbank
 *  3. vul de sectie-prompt en stuur naar Sonnet
 */
export async function generateSection(args: GenerateSectionArgs): Promise<GenerateSectionResult> {
  const sb = supabaseAdmin();
  const { data: project, error: pErr } = await sb
    .from('projects')
    .select('id, name, substance_name, indication')
    .eq('id', args.projectId)
    .single();
  if (pErr) throw new Error(`Project niet gevonden: ${pErr.message}`);

  const query = `${project.substance_name ?? ''} ${project.indication ?? ''} ${args.sectionTitle}`.trim();

  // brondata: 8 chunks uit project-documenten, 6 uit kennisbank
  const [projectChunks, knowledgeChunks] = await Promise.all([
    searchChunks(query, { projectId: args.projectId, source: 'project_document', matchCount: 8 }),
    searchChunks(query, { source: 'assessment', matchCount: 6 }),
  ]);

  const renderChunks = (chunks: MatchedChunk[], label: string) =>
    chunks.length === 0
      ? `(geen ${label} chunks gevonden)`
      : chunks
          .map(
            (c, i) =>
              `### ${label} bron ${i + 1} (similarity ${c.similarity.toFixed(3)}, source=${c.source}${c.section ? `, section=${c.section}` : ''})\n${c.content}`,
          )
          .join('\n\n');

  const context = [
    '## Brondata uit project-documenten (EPAR/SmPC/publicaties)',
    renderChunks(projectChunks, 'project'),
    '',
    '## Voorbeelden uit historische ZIN-pakketadviezen (kennisbank)',
    renderChunks(knowledgeChunks, 'kennisbank'),
  ].join('\n');

  const promptTemplate = await loadPrompt(args.promptFile);
  const filled = fillTemplate(promptTemplate, {
    substance: project.substance_name ?? '(onbekend)',
    indication: project.indication ?? '(onbekend)',
    comparator: '(zie brondata)',
  });

  const text = await complete({
    model: MODELS.SONNET,
    system: filled,
    user: `${context}\n\nSchrijf nu de sectie "${args.sectionTitle}" volgens de richtlijnen in de system prompt. Verwijs inline naar bronnen met [Bron: korte aanduiding]. Schrijf in helder Nederlands.`,
    cacheSystem: true,
    maxTokens: 4096,
    temperature: 0.3,
  });

  const sources = [...projectChunks, ...knowledgeChunks].map((c) => ({
    id: c.id,
    source: c.source,
    section: c.section,
    preview: c.content.slice(0, 200),
  }));

  // upsert in dossier_sections — bewaar versies door bij hergeneratie de version te bumpen
  const { data: existing } = await sb
    .from('dossier_sections')
    .select('id, version')
    .eq('project_id', args.projectId)
    .eq('section_key', args.sectionKey)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await sb
      .from('dossier_sections')
      .update({
        content: text,
        sources: sources as unknown as Record<string, unknown>,
        version: (existing.version ?? 1) + 1,
        section_title: args.sectionTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await sb.from('dossier_sections').insert({
      project_id: args.projectId,
      section_key: args.sectionKey,
      section_title: args.sectionTitle,
      content: text,
      sources: sources as unknown as Record<string, unknown>,
      version: 1,
      status: 'draft',
    });
  }

  return { content: text, sources };
}
