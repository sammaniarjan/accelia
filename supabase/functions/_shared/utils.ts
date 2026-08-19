import { createClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return null;
}

export function newCode(): string {
  const part = () =>
    crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `BRON-${part()}-${part()}`;
}

// Eén plek voor prijzen: de frontend toont ze, de backend bepaalt ze.
export const PRODUCTS: Record<string, { description: string; cents: number }> = {
  picual5l: { description: "BRON De Peper, Picual 5L karaf", cents: 8900 },
  arbequina1l: { description: "BRON De Zachte, Arbequina 1L", cents: 3495 },
  duo: { description: "BRON Het duo, Picual 5L + Arbequina 1L", cents: 11500 },
};

// Een code is bruikbaar zolang hij niet gebruikt of verlopen is.
export async function codeUsable(code: string) {
  const supabase = db();
  const { data, error } = await supabase
    .from("invite_codes")
    .select("code, used_at, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { usable: false, reason: "Deze code bestaat niet." };
  if (data.used_at) return { usable: false, reason: "Deze code is al gebruikt." };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { usable: false, reason: "Deze code is verlopen." };
  }
  return { usable: true as const, reason: "" };
}
