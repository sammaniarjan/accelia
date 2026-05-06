import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.anthropicKey() });
  }
  return _client;
}

/** Modellen die we gebruiken. Aanpasbaar zonder hele codebase te raken. */
export const MODELS = {
  /** Goedkoop + snel — gebruikt voor PDF extractie en simpele structuring. */
  HAIKU: 'claude-haiku-4-5-20251001',
  /** Default voor schrijven van NL secties en redenering. */
  SONNET: 'claude-sonnet-4-6',
  /** Voor de zwaarste redeneer-stappen (gap analyse). */
  OPUS: 'claude-opus-4-7',
} as const;

export type ModelKey = keyof typeof MODELS;

interface CompleteOptions {
  model: (typeof MODELS)[ModelKey];
  system: string;
  user: string;
  /** Markeer system als cacheable — bij grote prompts (>1k tokens) rendabel. */
  cacheSystem?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Wrapper rond messages.create die altijd één string teruggeeft.
 * Gebruikt prompt caching voor het system-veld (handig bij sectie-prompts die hergebruikt worden).
 */
export async function complete(opts: CompleteOptions): Promise<string> {
  const client = anthropic();
  const systemBlock = opts.cacheSystem
    ? [{ type: 'text' as const, text: opts.system, cache_control: { type: 'ephemeral' as const } }]
    : opts.system;

  const resp = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.2,
    system: systemBlock as never,
    messages: [{ role: 'user', content: opts.user }],
  });

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');
  return text;
}

/**
 * Vraag JSON terug en parse het. Strip optionele ```json fences.
 */
export async function completeJSON<T = unknown>(opts: CompleteOptions): Promise<T> {
  const raw = await complete(opts);
  return parseJsonLoose<T>(raw);
}

export function parseJsonLoose<T = unknown>(raw: string): T {
  let s = raw.trim();
  // strip ```json ... ``` of ``` ... ```
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (fence) s = fence[1].trim();
  // soms voegt het model uitleg toe — pak het eerste { ... } blok
  if (!s.startsWith('{') && !s.startsWith('[')) {
    const firstBrace = s.indexOf('{');
    const firstBracket = s.indexOf('[');
    const start =
      firstBrace === -1
        ? firstBracket
        : firstBracket === -1
          ? firstBrace
          : Math.min(firstBrace, firstBracket);
    if (start === -1) throw new Error('Geen JSON gevonden in modelrespons');
    const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as T;
}
