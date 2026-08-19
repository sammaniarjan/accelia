# BRON, webshop op uitnodiging (werktitel)

Pre-launch site voor een webshop in ultra-verse, single-estate Spaanse olijfolie
(Picual en Arbequina), direct bij de pers ingekocht bij Hacienda San Miguel, Alhama de
Murcia. De eerste persing is op uitnodiging; het backend (Supabase + Mollie) beheert
codes, bestellingen en de wachtlijst.

## Structuur

| Bestand | Doel |
|---|---|
| `index.html` | Landingspagina: hero, why, producten met uitnodigingscode, wachtlijst |
| `verhaal.html` | Het landgoed: proces, tijdlijn, smaak, cijfers, foto's |
| `zakelijk.html` | Horeca en inkoop: formaten, prijslijst-CTA |
| `bedankt.html` | Retourpagina na betaling (noindex) |
| `assets/site.css`, `assets/site.js` | Gedeelde stijl en scripts |
| `supabase/migrations/0001_init.sql` | Database: waitlist, invite_codes, orders |
| `supabase/functions/*` | Edge functions: wachtlijst, codevalidatie, Mollie |
| `RESEARCH.md` | Marktonderzoek en genomen beslissingen |

Frontend is statisch (geen build); host op Netlify, Vercel, Cloudflare Pages of
GitHub Pages.

## Backend opzetten (Supabase + Mollie), ~30 minuten

1. **Supabase-project aanmaken** op supabase.com (gratis tier volstaat).
2. **Database**: plak `supabase/migrations/0001_init.sql` in de SQL Editor en voer uit.
   Dit maakt de tabellen, RLS en 30 startcodes (pas het aantal onderin aan).
3. **Edge functions deployen** (met de [Supabase CLI](https://supabase.com/docs/guides/functions)):
   `supabase functions deploy join-waitlist validate-invite create-payment mollie-webhook --no-verify-jwt`
4. **Secrets zetten** (Dashboard > Edge Functions > Secrets):
   - `MOLLIE_API_KEY`: van mollie.com (start met de test-key, ga live na een testbetaling)
   - `SITE_URL`: je domein, bijv. `https://jouwdomein.nl`
   - optioneel `RESEND_API_KEY` en `MAIL_FROM` voor automatische mails met de drie
     nieuwe codes per koper; zonder deze key staan de codes in de tabel
     `invite_codes` (kolom `issued_to_email`) en mail je ze zelf
5. **Frontend koppelen**: zet in `assets/site.js` de constante `FUNCTIONS_BASE` op
   `https://<project-ref>.supabase.co/functions/v1`. Tot die tijd draait de site in
   demomodus (formulieren doen alsof).

## Hoe het invite-systeem werkt

- Startcodes (`source='seed'`) stuur je zelf naar je eerste ring, drie per persoon.
- Een bezoeker voert de code in op de landingspagina; na validatie verschijnen de
  bestelformulieren. Betaling loopt via Mollie (iDEAL).
- Bij een betaalde bestelling markeert de webhook de code als gebruikt en maakt hij
  drie nieuwe codes aan voor de koper (automatisch gemaild via Resend, of handmatig).
- Codes zijn eenmalig geldig. Wachtlijst-mails staan in de tabel `waitlist`; nodig ze
  uit door een seed-code te sturen en `invited_at` te zetten.
- **Admin**: het Supabase-dashboard is je admin. Table Editor voor bestellingen, codes
  en wachtlijst; de view `admin_overview` geeft totalen (betaald, omzet, openstaand).
- **Kill-switch**: loopt de verkoop stroef richting de deadline, deel dan seed-codes
  ruimhartig uit (bijv. aan de hele wachtlijst); het systeem zelf hoeft niet om.

## Nog invullen

- **Naam**: "BRON" is een werktitel; zoek en vervang in de HTML-bestanden.
- **Domein**: vervang `VERVANG-DOOR-DOMEIN` in `robots.txt` en `sitemap.xml`.
- **Zakelijk e-mailadres**: vervang `zakelijk@voorbeeld.nl` in `zakelijk.html` en
  `index.html`.
- **Aantallen en deadline**: "120 karaffen en 300 literflessen" en "t/m 9 november"
  zijn placeholders tot de echte palletorder vaststaat.
- **Oogstrapport (duo-bonus)**: opvragen bij het landgoed (eigen laboratorium).

## Onderbouwing

Zie `RESEARCH.md` voor het marktonderzoek (positionering, conversiepatronen,
prijsbenchmarks, kanaalstrategie, invite-mechaniek) achter de opbouw en copy.
