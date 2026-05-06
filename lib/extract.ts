import 'server-only';
import { complete, completeJSON, MODELS } from './anthropic';
import { loadPrompt } from './prompts';
import type { ExtractedAssessment } from './types';
import { supabaseAdmin } from './supabase';
import { storeAssessmentChunks } from './embeddings';

/**
 * Extraheer gestructureerde velden uit de tekst van een ZIN pakketadvies.
 * Gebruik Haiku — goedkoop en gestructureerd.
 */
export async function extractAssessment(pdfText: string): Promise<ExtractedAssessment> {
  const system = await loadPrompt('extract-pakketadvies.md');
  // Knip te lange documenten af op ~120k chars (~30k tokens) zodat we onder de Haiku context blijven.
  const trimmed = pdfText.length > 120_000 ? pdfText.slice(0, 120_000) : pdfText;
  const json = await completeJSON<ExtractedAssessment>({
    model: MODELS.HAIKU,
    system,
    user: `Hieronder volgt de volledige tekst van een ZIN pakketadvies. Extraheer naar JSON volgens het schema in de system prompt. Antwoord ALLEEN met JSON.\n\n=== DOCUMENT START ===\n${trimmed}\n=== DOCUMENT EIND ===`,
    cacheSystem: true,
    maxTokens: 8192,
  });
  return json;
}

/** Sla een geëxtraheerd assessment op in Supabase + embed de tekst. */
export async function saveAssessment(args: {
  extracted: ExtractedAssessment;
  rawText: string;
  sourceUrl?: string | null;
}): Promise<{ assessmentId: string; chunksStored: number }> {
  const sb = supabaseAdmin();
  const { extracted } = args;

  // 1. Substance upsert (via inn_name)
  let substanceId: string | null = null;
  if (extracted.substance?.inn_name) {
    const { data: existing } = await sb
      .from('substances')
      .select('id')
      .ilike('inn_name', extracted.substance.inn_name)
      .maybeSingle();
    if (existing?.id) {
      substanceId = existing.id;
    } else {
      const { data, error } = await sb
        .from('substances')
        .insert({
          inn_name: extracted.substance.inn_name,
          trade_name: extracted.substance.trade_name ?? null,
          atc_code: extracted.substance.atc_code ?? null,
          mechanism: extracted.substance.mechanism ?? null,
          manufacturer: extracted.substance.manufacturer ?? null,
        })
        .select('id')
        .single();
      if (error) throw new Error(`Substance opslaan faalde: ${error.message}`);
      substanceId = data.id;
    }
  }

  // 2. Indication upsert (via name_nl)
  let indicationId: string | null = null;
  if (extracted.indication?.name_nl) {
    const { data: existing } = await sb
      .from('indications')
      .select('id')
      .ilike('name_nl', extracted.indication.name_nl)
      .maybeSingle();
    if (existing?.id) {
      indicationId = existing.id;
    } else {
      const { data, error } = await sb
        .from('indications')
        .insert({
          name_nl: extracted.indication.name_nl,
          therapeutic_area: extracted.indication.therapeutic_area ?? null,
          tumor_type: extracted.indication.tumor_type ?? null,
          icd_code: extracted.indication.icd_code ?? null,
        })
        .select('id')
        .single();
      if (error) throw new Error(`Indication opslaan faalde: ${error.message}`);
      indicationId = data.id;
    }
  }

  // 3. Assessment row
  const { data: assessment, error: aErr } = await sb
    .from('assessments')
    .insert({
      substance_id: substanceId,
      indication_id: indicationId,
      document_title: extracted.document_title,
      reference_number: extracted.reference_number,
      publication_date: extracted.publication_date,
      document_type: extracted.document_type,
      route: extracted.route,
      population: extracted.population,
      intervention: extracted.intervention,
      comparator: extracted.comparator,
      comparator_validity: extracted.comparator_validity,
      primary_endpoints: extracted.primary_endpoints,
      effectiveness_verdict: extracted.effectiveness_verdict,
      paskwil_verdict: extracted.paskwil_verdict,
      burden_category: extracted.burden_category,
      proportional_shortfall: extracted.proportional_shortfall,
      icer_at_list: extracted.icer_at_list,
      icer_threshold: extracted.icer_threshold,
      cost_effectiveness_verdict: extracted.cost_effectiveness_verdict,
      necessity_verdict: extracted.necessity_verdict,
      feasibility_verdict: extracted.feasibility_verdict,
      budget_impact_year3: extracted.budget_impact_year3,
      overall_verdict: extracted.overall_verdict,
      price_condition: extracted.price_condition,
      discount_required: extracted.discount_required,
      gepast_gebruik: extracted.gepast_gebruik,
      sluis_placement_date: extracted.sluis_placement_date,
      key_conditions: extracted.key_conditions,
      ciebom_position: extracted.ciebom_position,
      war_position: extracted.war_position,
      acp_position: extracted.acp_position,
      ciebag_position: extracted.ciebag_position,
      source_pdf_url: args.sourceUrl ?? null,
      raw_extracted_json: extracted as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();
  if (aErr) throw new Error(`Assessment opslaan faalde: ${aErr.message}`);

  // 4. Trials
  if (extracted.trials?.length) {
    const trialRows = extracted.trials.map((t) => ({
      assessment_id: assessment.id,
      name: t.name,
      design: t.design,
      n_patients: t.n_patients,
      primary_endpoint: t.primary_endpoint,
      pfs_hr: t.pfs_hr,
      pfs_hr_ci: t.pfs_hr_ci,
      os_hr: t.os_hr,
      os_hr_ci: t.os_hr_ci,
      orr: t.orr,
      median_pfs_months: t.median_pfs_months,
      median_os_months: t.median_os_months,
      key_safety: t.key_safety,
      publication_doi: t.publication_doi,
    }));
    const { error: tErr } = await sb.from('trials').insert(trialRows);
    if (tErr) console.warn(`Trials opslaan gaf warning: ${tErr.message}`);
  }

  // 5. Chunks + embeddings
  const chunksStored = await storeAssessmentChunks({
    assessmentId: assessment.id,
    text: args.rawText,
  });

  return { assessmentId: assessment.id, chunksStored };
}

// houd 'complete' import warm voor toekomstige helpers
void complete;
