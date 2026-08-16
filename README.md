# BRON, landingspagina (werktitel)

Pre-launch landingspagina voor een webshop in ultra-verse, single-estate Spaanse
olijfolie (Picual en Arbequina), direct bij de pers ingekocht bij Hacienda San Miguel,
Alhama de Murcia. Naast de consumentenverkoop is er een B2B-blok voor horeca en winkels.

## Stack

Eén statisch bestand: `index.html`. Geen build, geen dependencies. Open het bestand in
de browser of host het op elke statische host (Netlify, Vercel, GitHub Pages, Cloudflare
Pages).

## Aanpassen

- **Naam**: "BRON" is een werktitel; zoek en vervang in `index.html`.
- **Betaallinks**: maak in Mollie of Stripe drie betaallinks aan (iDEAL) en vervang de
  drie `VERVANG-DOOR-BETAALLINK-...` placeholders in `index.html`: Picual 5L (€89),
  Arbequina 1L (€34,95) en het duo (€115).
- **E-mailformulier**: het script onderaan `index.html` bevat een `TODO`; koppel daar
  Formspree, MailerLite of een eigen endpoint aan.
- **Zakelijk e-mailadres**: de B2B-knop verwijst naar `zakelijk@voorbeeld.nl`; vervang
  door het echte adres.
- **Oogstdata, aantallen en deadline**: plaatshouderwaarden die je moet invullen zodra
  ze vaststaan: oogst november 2026, "120 blikken en 300 literflessen" (de echte
  pallet-inhoud) en de besteldeadline "t/m 9 november" (de datum waarop je de
  palletorder naar het landgoed stuurt). Ze staan in de hero en in de productsectie.
- **Duo-bonus**: het duo belooft een oogstrapport met labwaarden per batch; vraag dat
  rapport op bij het landgoed (ze hebben een eigen laboratorium).

## Onderbouwing

Zie `RESEARCH.md` voor het marktonderzoek (positionering, conversiepatronen,
prijsbenchmarks, kanaalstrategie) waarop de pagina-opbouw en copy gebaseerd zijn.
