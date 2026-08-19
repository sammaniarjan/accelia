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
- **Uitnodigingsflow**: de pagina toont prijzen maar geen koopknoppen; reserveren kan
  alleen via de persoonlijke reserveerlink in een uitnodigingsmail. Zo werkt het:
  1. Maak in Mollie of Stripe drie betaallinks aan (iDEAL): Picual 5L (€89),
     Arbequina 1L (€34,95) en het duo (€115). Deze links staan bewust NIET op de
     pagina; ze gaan alleen in uitnodigingsmails.
  2. Stuur de eerste ring uitnodigingen zelf (drie per persoon).
  3. Zet in elke besteld-bevestigingsmail drie nieuwe uitnodigingen ("stuur deze mail
     door"). Wie koopt, kan dus drie mensen binnenbrengen.
  4. Loopt de verkoop stroef richting de deadline, zet de betaallinks dan alsnog op de
     knoppen (de lock-badges in `index.html` vervangen door `.btn`-links); de deadline
     is de natuurlijke kill-switch van het invite-mechanisme.
  Wachtlijst-aanmeldingen (het formulier) zijn de bron voor uitnodigingen bij ruimte of
  bij de volgende persing. B2B loopt buiten de uitnodigingen om.
- **E-mailformulier**: het script onderaan `index.html` bevat een `TODO`; koppel daar
  Formspree, MailerLite of een eigen endpoint aan.
- **Zakelijk e-mailadres**: de B2B-knop verwijst naar `zakelijk@voorbeeld.nl`; vervang
  door het echte adres.
- **Oogstdata, aantallen en deadline**: plaatshouderwaarden die je moet invullen zodra
  ze vaststaan: oogst november 2026, "120 karaffen en 300 literflessen" (de echte
  pallet-inhoud) en de besteldeadline "t/m 9 november" (de datum waarop je de
  palletorder naar het landgoed stuurt). Ze staan in de hero en in de productsectie.
- **Duo-bonus**: het duo belooft een oogstrapport met labwaarden per batch; vraag dat
  rapport op bij het landgoed (ze hebben een eigen laboratorium).

## Onderbouwing

Zie `RESEARCH.md` voor het marktonderzoek (positionering, conversiepatronen,
prijsbenchmarks, kanaalstrategie) waarop de pagina-opbouw en copy gebaseerd zijn.
