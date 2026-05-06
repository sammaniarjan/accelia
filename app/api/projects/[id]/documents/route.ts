import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractPdfText } from '@/lib/pdf';
import { storeProjectDocumentChunks } from '@/lib/embeddings';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('project_documents')
    .select('id, filename, document_type, storage_path, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const form = await req.formData();
  const file = form.get('file');
  const documentType = (form.get('document_type') as string) || 'overig';
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Geen bestand meegegeven' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());

  // PDF parsen → tekst
  let parsed = '';
  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const r = await extractPdfText(buffer);
      parsed = r.text;
    } catch (e) {
      return NextResponse.json({ error: `PDF parsen faalde: ${(e as Error).message}` }, { status: 400 });
    }
  } else {
    parsed = buffer.toString('utf-8');
  }

  const sb = supabaseAdmin();
  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const path = `projects/${projectId}/${Date.now()}-${safeName}`;

  const { error: upErr } = await sb.storage.from(env.storageBucket()).upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (upErr && !upErr.message.includes('already exists')) {
    console.warn(`Storage upload waarschuwing: ${upErr.message}`);
  }

  const { data: doc, error: dErr } = await sb
    .from('project_documents')
    .insert({
      project_id: projectId,
      filename: file.name,
      document_type: documentType,
      storage_path: path,
      parsed_content: parsed,
    })
    .select('*')
    .single();
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  // Chunks + embeddings
  let chunks = 0;
  try {
    chunks = await storeProjectDocumentChunks({ projectDocumentId: doc.id, text: parsed });
  } catch (e) {
    console.warn(`Embedding faalde voor ${file.name}: ${(e as Error).message}`);
  }

  return NextResponse.json({ document: doc, chunks });
}
