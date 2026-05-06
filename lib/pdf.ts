// pdf-parse is een CommonJS pakket dat bij directe import zijn eigen test-pdf probeert te laden.
// We laden de inner module direct om dat te vermijden.
import 'server-only';

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // dynamisch importeren zodat het buiten de server-bundle blijft
  // @ts-expect-error - geen types op de inner path
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default as (
    data: Buffer,
  ) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer);
  return { text: data.text, pages: data.numpages };
}
