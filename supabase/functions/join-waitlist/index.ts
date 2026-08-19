import { db, json, preflight } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    const { email } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      return json({ error: "Vul een geldig e-mailadres in." }, 400);
    }
    const { error } = await db()
      .from("waitlist")
      .upsert({ email: clean }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
    return json({ ok: true });
  } catch (_e) {
    return json({ error: "Er ging iets mis. Probeer het later opnieuw." }, 500);
  }
});
