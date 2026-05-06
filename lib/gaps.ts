import 'server-only';
import { completeJSON, MODELS } from './anthropic';
import { loadPrompt } from './prompts';
import { searchChunks, similarAssessments } from './search';
import { supabaseAdmin } from './supabase';
import { GAP_CRITERIA, type GapCriterion } from './types';

interface GapResult {
  status: 'voldoende' | 'onvoldoende' | 'onzeker' | 'ontbreekt';
  explanation: string;
  risk_level: 'laag' | 'midden' | 'hoog' | 'kritiek';
  recommendation: string;
}

interface SimilarCase {
  assessment_id: string;
  substance: string | null;
  indication: string | null;
  overall_verdict: string | null;
  publication_date: string | null;
  similarity: number;
}

export async function runGapAnalysis(projectId: string): Promise<{
  perCriterion: Record<GapCriterion, GapResult>;
  similarCases: SimilarCase[];
}> {
  const sb = supabaseAdmin();
  const { data: project, error: pErr } = await sb
    .from('projects')
    .select('id, name, substance_name, indication')
    .eq('id', projectId)
    .single();
  if (pErr) throw new Error(`Project niet gevonden: ${pErr.message}`);

  const promptTemplate = await loadPrompt('gap-analysis.md');

  // 1. Vind 5 vergelijkbare historische cases
  const seedQuery = `${project.substance_name ?? ''} ${project.indication ?? ''}`.trim() || project.name;
  const similar = await similarAssessments(seedQuery, 5);
  const ids = similar.map((s) => s.assessment_id);

  let similarCases: SimilarCase[] = [];
  if (ids.length > 0) {
    const { data: rows } = await sb
      .from('assessments')
      .select('id, overall_verdict, publication_date, substance:substances(inn_name), indication:indications(name_nl)')
      .in('id', ids);
    similarCases = (rows ?? []).map((r) => {
      const sim = similar.find((s) => s.assessment_id === r.id)?.avg_similarity ?? 0;
      type Joined = { id: string; overall_verdict: string | null; publication_date: string | null; substance: { inn_name: string } | { inn_name: string }[] | null; indication: { name_nl: string } | { name_nl: string }[] | null };
      const row = r as unknown as Joined;
      const substanceName = Array.isArray(row.substance) ? row.substance[0]?.inn_name : row.substance?.inn_name;
      const indicationName = Array.isArray(row.indication) ? row.indication[0]?.name_nl : row.indication?.name_nl;
      return {
        assessment_id: row.id,
        substance: substanceName ?? null,
        indication: indicationName ?? null,
        overall_verdict: row.overall_verdict,
        publication_date: row.publication_date,
        similarity: sim,
      };
    });
  }

  // 2. Per criterium een LLM call
  const perCriterion = {} as Record<GapCriterion, GapResult>;
  for (const criterion of GAP_CRITERIA) {
    const query = `${seedQuery} ${criterion}`;
    const projectChunks = await searchChunks(query, {
      projectId,
      source: 'project_document',
      matchCount: 6,
    });
    const knowledgeChunks = await searchChunks(query, { source: 'assessment', matchCount: 4 });

    const userMsg = [
      `## Project`,
      `Geneesmiddel: ${project.substance_name ?? '(onbekend)'}`,
      `Indicatie: ${project.indication ?? '(onbekend)'}`,
      `Te beoordelen criterium: ${criterion}`,
      ``,
      `## Vergelijkbare historische ZIN cases`,
      similarCases
        .map(
          (c) =>
            `- ${c.substance ?? '?'} bij ${c.indication ?? '?'} (${c.publication_date ?? 'onbekend'}): ${c.overall_verdict ?? 'onbekend'}`,
        )
        .join('\n') || '(geen vergelijkbare cases gevonden)',
      ``,
      `## Beschikbare evidence in project-documenten`,
      projectChunks.length === 0
        ? '(geen project-documenten beschikbaar)'
        : projectChunks
            .map((c, i) => `[${i + 1}] (sim ${c.similarity.toFixed(3)}) ${c.content.slice(0, 600)}`)
            .join('\n'),
      ``,
      `## Relevante passages uit historische beoordelingen`,
      knowledgeChunks
        .map((c, i) => `[${i + 1}] (sim ${c.similarity.toFixed(3)}) ${c.content.slice(0, 500)}`)
        .join('\n'),
    ].join('\n');

    const result = await completeJSON<GapResult>({
      model: MODELS.SONNET,
      system: promptTemplate,
      user: userMsg,
      cacheSystem: true,
      maxTokens: 1500,
      temperature: 0.2,
    });
    perCriterion[criterion] = result;
  }

  // 3. Persist
  await sb.from('gap_analysis').delete().eq('project_id', projectId); // simpel: vervang volledige analyse
  for (const criterion of GAP_CRITERIA) {
    const r = perCriterion[criterion];
    await sb.from('gap_analysis').insert({
      project_id: projectId,
      criterion,
      status: r.status,
      explanation: r.explanation,
      risk_level: r.risk_level,
      recommendation: r.recommendation,
      similar_cases: similarCases as unknown as Record<string, unknown>,
    });
  }

  return { perCriterion, similarCases };
}
