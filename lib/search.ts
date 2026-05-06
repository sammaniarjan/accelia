import { supabaseAdmin } from './supabase';
import { embedOne } from './embeddings';

export interface MatchedChunk {
  id: string;
  assessment_id: string | null;
  project_document_id: string | null;
  source: string;
  section: string | null;
  content: string;
  page_ref: string | null;
  similarity: number;
}

export interface SearchOptions {
  matchCount?: number;
  source?: 'assessment' | 'project_document';
  projectId?: string;
  assessmentIds?: string[];
}

export async function searchChunks(query: string, opts: SearchOptions = {}): Promise<MatchedChunk[]> {
  const embedding = await embedOne(query);
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc('match_chunks', {
    query_embedding: embedding as unknown as string,
    match_count: opts.matchCount ?? 10,
    filter_source: opts.source ?? null,
    filter_project_id: opts.projectId ?? null,
    filter_assessment_ids: opts.assessmentIds ?? null,
  });
  if (error) throw new Error(`Search faalde: ${error.message}`);
  return (data ?? []) as MatchedChunk[];
}

export interface SimilarAssessment {
  assessment_id: string;
  avg_similarity: number;
  hits: number;
}

export async function similarAssessments(
  query: string,
  matchCount = 5,
): Promise<SimilarAssessment[]> {
  const embedding = await embedOne(query);
  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc('similar_assessments', {
    query_embedding: embedding as unknown as string,
    match_count: matchCount,
  });
  if (error) throw new Error(`Similar assessments faalde: ${error.message}`);
  return (data ?? []) as SimilarAssessment[];
}
