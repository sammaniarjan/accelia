import { codeUsable, db, json, preflight, PRODUCTS } from "../_shared/utils.ts";

// Maakt een order (pending) en een Mollie-betaling, en geeft de checkout-URL terug.
// Env vars (Dashboard > Edge Functions > Secrets):
//   MOLLIE_API_KEY  live_... of test_...
//   SITE_URL        https://jouwdomein.nl (zonder slash aan het einde)
Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  try {
    const { code, product, name, email, address } = await req.json();
    const cleanCode = String(code ?? "").trim().toUpperCase();
    const p = PRODUCTS[String(product ?? "")];
    if (!p) return json({ error: "Onbekend product." }, 400);
    if (!String(name ?? "").trim() || !String(address ?? "").trim()) {
      return json({ error: "Vul naam en adres in." }, 400);
    }
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return json({ error: "Vul een geldig e-mailadres in." }, 400);
    }

    const { usable, reason } = await codeUsable(cleanCode);
    if (!usable) return json({ error: reason }, 403);

    const supabase = db();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        product,
        amount_cents: p.cents,
        customer_name: String(name).trim(),
        email: cleanEmail,
        address: String(address).trim(),
        invite_code: cleanCode,
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    const site = Deno.env.get("SITE_URL")!;
    const functionsBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("MOLLIE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (p.cents / 100).toFixed(2) },
        description: p.description,
        redirectUrl: `${site}/bedankt.html`,
        webhookUrl: `${functionsBase}/mollie-webhook`,
        metadata: { order_id: order.id },
      }),
    });
    if (!mollieRes.ok) {
      console.error("Mollie error", await mollieRes.text());
      return json({ error: "Betaling aanmaken lukte niet. Probeer het opnieuw." }, 502);
    }
    const payment = await mollieRes.json();

    await supabase
      .from("orders")
      .update({ mollie_payment_id: payment.id })
      .eq("id", order.id);

    return json({ checkout_url: payment._links.checkout.href });
  } catch (e) {
    console.error(e);
    return json({ error: "Er ging iets mis. Probeer het later opnieuw." }, 500);
  }
});
