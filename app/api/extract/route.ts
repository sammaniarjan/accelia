import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/pdf';
import { extractAssessment, saveAssessment } from '@/lib/extract';
import { supabaseAdmin } from '@/lib/supabase';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/extract
 * - multipart/form-data met `file` (PDF)
 * - actie:
 *    - "preview" → parse PDF, run LLM extractie, geef JSON terug (zonder opslaan)
 *    - "save"    → preview + sla op in Supabase + chunks/embeddings
 *
 * Voor de "save" actie: ofwel `file` opnieuw meesturen, ofwel `extracted` JSON sturen
 * samen met de raw text (sneller na review).
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';

  // Tak 1: multipart upload (PDF) → preview of save in één klap
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    const action = (form.get('action') as string) || 'preview';
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Geen PDF-bestand meegegeven' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    let pdf;
    try {
      pdf = await extractPdfText(buffer);
    } catch (e) {
      return NextResponse.json({ error: `PDF parsen faalde: ${(e as Error).message}` }, { status: 400 });
    }

    let extracted;
    try {
      extracted = await extractAssessment(pdf.text);
    } catch (e) {
      return NextResponse.json({ error: `LLM extractie faalde: ${(e as Error).message}` }, { status: 500 });
    }

    if (action === 'preview') {
      return NextResponse.json({
        extracted,
        rawText: pdf.text,
        pages: pdf.pages,
      });
    }

    // Save flow met optionele PDF upload naar storage
    const sb = supabaseAdmin();
    let sourceUrl: string | null = null;
    try {
      const path = `assessments/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error: upErr } = await sb.storage.from(env.storageBucket()).upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (!upErr) {
        const { data } = sb.storage.from(env.storageBucket()).getPublicUrl(path);
        sourceUrl = data.publicUrl;
      } else {
        console.warn(`Storage upload faalde (gaan door zonder URL): ${upErr.message}`);
      }
    } catch (e) {
      console.warn(`Storage upload exception: ${(e as Error).message}`);
    }

    const saved = await saveAssessment({ extracted, rawText: pdf.text, sourceUrl });
    return NextResponse.json({ ...saved, extracted });
  }

  // Tak 2: JSON body — opslaan na review zonder opnieuw te parsen
  if (contentType.includes('application/json')) {
    const body = await req.json();
    const { extracted, rawText, sourceUrl } = body ?? {};
    if (!extracted || !rawText) {
      return NextResponse.json({ error: 'extracted + rawText zijn verplicht' }, { status: 400 });
    }
    const saved = await saveAssessment({ extracted, rawText, sourceUrl: sourceUrl ?? null });
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: 'Onbekend content-type' }, { status: 400 });
}
