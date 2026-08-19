import { codeUsable, json, preflight } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    const { code } = await req.json();
    const clean = String(code ?? "").trim().toUpperCase();
    if (!clean) return json({ valid: false, reason: "Geen code opgegeven." });
    const { usable, reason } = await codeUsable(clean);
    return json({ valid: usable, reason });
  } catch (_e) {
    return json({ error: "Er ging iets mis. Probeer het later opnieuw." }, 500);
  }
});
