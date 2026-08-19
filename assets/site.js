/* BRON site scripts: scroll reveal, wachtlijst, uitnodigingscodes, reserveren.
   Configuratie: vervang FUNCTIONS_BASE door de Functions-URL van je Supabase-project
   (Dashboard > Edge Functions), bijv. https://abcdefgh.supabase.co/functions/v1
   Zolang de placeholder staat, draait de site in demomodus: formulieren doen
   alsof, en codes valideren niet. */

const FUNCTIONS_BASE = "VERVANG-DOOR-SUPABASE-FUNCTIONS-URL";

const configured = !FUNCTIONS_BASE.startsWith("VERVANG");

async function api(path, body) {
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Er ging iets mis. Probeer het opnieuw.");
  return data;
}

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- wachtlijst ---------- */
const waitlist = document.getElementById("waitlist");
if (waitlist) {
  waitlist.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = waitlist.email.value.trim();
    try {
      if (configured) await api("join-waitlist", { email });
      else console.warn("BRON demomodus: wachtlijst niet gekoppeld (FUNCTIONS_BASE).");
      waitlist.style.display = "none";
      const note = document.querySelector(".form-note");
      if (note) note.style.display = "none";
      document.getElementById("form-ok").style.display = "block";
    } catch (err) {
      alert(err.message);
    }
  });
}

/* ---------- uitnodigingscode ---------- */
const inviteForm = document.getElementById("invite-form");
const inviteMsg = document.getElementById("invite-msg");

function unlockCards(code) {
  document.querySelectorAll(".oil-card .lock, .bundle .lock").forEach((lock) => {
    const form = lock.parentElement.querySelector(".order-form");
    lock.style.display = "none";
    if (form) form.classList.add("open");
  });
  sessionStorage.setItem("bron_invite", code);
  const panel = document.getElementById("invite-panel");
  if (panel) {
    panel.querySelector("p").innerHTML = "<strong>Uitnodiging geaccepteerd.</strong> Kies je olie en reserveer hieronder.";
    if (inviteForm) inviteForm.style.display = "none";
    if (inviteMsg) { inviteMsg.className = "invite-msg ok"; inviteMsg.textContent = "Code " + code.toUpperCase() + " is geldig t/m 9 november."; }
  }
}

if (inviteForm) {
  inviteForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const code = inviteForm.code.value.trim().toUpperCase();
    if (!code) return;
    inviteMsg.className = "invite-msg";
    try {
      if (!configured) throw new Error("Het reserveringssysteem staat nog niet aan. Kom terug zodra je uitnodiging actief is.");
      const data = await api("validate-invite", { code });
      if (data.valid) unlockCards(code);
      else throw new Error(data.reason || "Deze code is niet (meer) geldig.");
    } catch (err) {
      inviteMsg.className = "invite-msg err";
      inviteMsg.textContent = err.message;
    }
  });
  const stored = sessionStorage.getItem("bron_invite");
  if (stored && configured) {
    api("validate-invite", { code: stored }).then((d) => { if (d.valid) unlockCards(stored); }).catch(() => {});
  }
}

/* ---------- reserveren (na unlock) ---------- */
document.querySelectorAll(".order-form").forEach((form) => {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = form.querySelector(".order-err");
    err.style.display = "none";
    const code = sessionStorage.getItem("bron_invite");
    const btn = form.querySelector("button");
    btn.disabled = true; btn.textContent = "Even geduld…";
    try {
      const data = await api("create-payment", {
        code,
        product: form.dataset.product,
        name: form.name_.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim(),
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      err.textContent = e.message;
      err.style.display = "block";
      btn.disabled = false; btn.textContent = "Reserveer en betaal";
    }
  });
});
