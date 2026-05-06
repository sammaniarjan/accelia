import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PROMPT_DIR = join(process.cwd(), 'prompts');
const cache = new Map<string, string>();

export async function loadPrompt(filename: string): Promise<string> {
  if (cache.has(filename)) return cache.get(filename)!;
  const path = join(PROMPT_DIR, filename);
  const text = await readFile(path, 'utf-8');
  cache.set(filename, text);
  return text;
}

/** Vervang {placeholder} tokens in een prompt-template. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? vars[key] : `{${key}}`));
}
