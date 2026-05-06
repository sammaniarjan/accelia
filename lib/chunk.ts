/**
 * Naïeve text-chunker: splitst op paragraph-grenzen en bouwt blokken
 * van ~targetChars met optionele overlap. Goed genoeg voor MVP.
 */
export interface ChunkOptions {
  targetChars?: number;
  overlapChars?: number;
}

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const target = opts.targetChars ?? 1500;
  const overlap = opts.overlapChars ?? 150;

  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= target) return cleaned ? [cleaned] : [];

  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).trim().length > target && current.length > 0) {
      chunks.push(current.trim());
      // overlap: tail van vorige chunk meenemen
      const tail = overlap > 0 ? current.slice(-overlap) : '';
      current = (tail + '\n\n' + para).trim();
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // hard split voor zeer lange paragrafen
  const result: string[] = [];
  for (const c of chunks) {
    if (c.length <= target * 1.5) {
      result.push(c);
      continue;
    }
    for (let i = 0; i < c.length; i += target - overlap) {
      result.push(c.slice(i, i + target));
    }
  }
  return result;
}
