import OpenAI from 'openai';
import { env } from './env';
import { supabaseAdmin } from './supabase';
import { chunkText } from './chunk';

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: env.openaiKey() });
  return _openai;
}

const EMBED_MODEL = 'text-embedding-3-small'; // 1536 dim — matcht het schema
const BATCH_SIZE = 64;

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const resp = await openai().embeddings.create({ model: EMBED_MODEL, input: batch });
    for (const item of resp.data) out.push(item.embedding);
  }
  return out;
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}

interface StoreAssessmentChunksArgs {
  assessmentId: string;
  text: string;
  section?: string;
}

export async function storeAssessmentChunks(args: StoreAssessmentChunksArgs): Promise<number> {
  const pieces = chunkText(args.text);
  if (pieces.length === 0) return 0;
  const vectors = await embed(pieces);
  const sb = supabaseAdmin();
  const rows = pieces.map((content, i) => ({
    assessment_id: args.assessmentId,
    source: 'assessment',
    section: args.section ?? null,
    content,
    embedding: vectors[i] as unknown as string, // pgvector accepteert array via supabase-js
  }));
  const { error } = await sb.from('chunks').insert(rows);
  if (error) throw new Error(`Chunks opslaan faalde: ${error.message}`);
  return rows.length;
}

interface StoreProjectDocumentChunksArgs {
  projectDocumentId: string;
  text: string;
}

export async function storeProjectDocumentChunks(
  args: StoreProjectDocumentChunksArgs,
): Promise<number> {
  const pieces = chunkText(args.text);
  if (pieces.length === 0) return 0;
  const vectors = await embed(pieces);
  const sb = supabaseAdmin();
  const rows = pieces.map((content, i) => ({
    project_document_id: args.projectDocumentId,
    source: 'project_document',
    content,
    embedding: vectors[i] as unknown as string,
  }));
  const { error } = await sb.from('chunks').insert(rows);
  if (error) throw new Error(`Chunks opslaan faalde: ${error.message}`);
  return rows.length;
}
