import { db, json, newCode } from "../_shared/utils.ts";

// Mollie roept deze URL aan bij elke statuswijziging, met alleen een payment id.
// We halen de status zelf op bij Mollie (nooit de webhook-body vertrouwen).
// Bij 'paid': order op paid, code op gebruikt, en drie nieuwe codes voor de koper.
// Als RESEND_API_KEY is gezet, mailen we de codes automatisch; anders staan ze in
// de tabel invite_codes (issued_to_email) om handmatig te versturen.
Deno.serve(async (req) => {
  try {
    const form = await req.formData();
    const paymentId = String(form.get("id") ?? "");
    if (!paymentId) return json({ ok: true });

    const mollieRes = await fetch(
      `https://api.mollie.com/v2/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("MOLLIE_API_KEY")}` } },
    );
    if (!mollieRes.ok) return json({ ok: true });
    const payment = await mollieRes.json();
    const orderId = payment.metadata?.order_id;
    if (!orderId) return json({ ok: true });

    const supabase = db();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, email, invite_code")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return json({ ok: true });

    const status = String(payment.status); // paid | failed | expired | canceled | open
    if (status === "paid" && order.status !== "paid") {
      await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", order.id);
      await supabase
        .from("invite_codes")
        .update({ used_at: new Date().toISOString(), used_by_order: order.id })
        .eq("code", order.invite_code);

      const codes = [newCode(), newCode(), newCode()];
      await supabase.from("invite_codes").insert(
        codes.map((code) => ({
          code,
          source: "order",
          issued_to_email: order.email,
        })),
      );

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("MAIL_FROM") ?? "BRON <onboarding@resend.dev>",
            to: order.email,
            subject: "Je reservering staat, plus drie uitnodigingen",
            text:
              `Je reservering is binnen. Na de persing van november bottelt het landgoed jouw bestelling en leveren we binnen een paar weken, met de oogst- en persdatum van jouw batch erbij.\n\n` +
              `Hierbij drie uitnodigingscodes om weg te geven. De persing is beperkt; op is op.\n\n` +
              codes.map((c) => `  ${c}`).join("\n") +
              `\n\nReserveren kan op ${Deno.env.get("SITE_URL")}\n\nBRON`,
          }),
        }).catch((e) => console.error("Resend error", e));
      }
    } else if (["failed", "expired", "canceled"].includes(status)) {
      await supabase.from("orders").update({ status }).eq("id", order.id)
        .neq("status", "paid");
    }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ ok: true }); // Mollie blijft anders eindeloos retryen
  }
});
