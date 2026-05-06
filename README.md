# Accelia — MVP

Lokaal draaiend platform voor:

1. ZIN pakketadviezen (PDF) inlezen → gestructureerd opslaan
2. Kennisbank van historische ZIN-beoordelingen opbouwen
3. Concept-FT-dossier genereren in ZIN-format op basis van klant-input
4. Gap-analyse: waar schiet de evidence tekort t.o.v. ZIN-criteria
5. Word-export van het dossier

## Stack

- **Frontend / API**: Next.js 15 (App Router) + Tailwind
- **Database**: Supabase (Postgres + pgvector)
- **LLM**: Anthropic — Haiku voor extractie, Sonnet voor schrijven/redenering
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dim, matcht het schema)
- **PDF parsing**: `pdf-parse`
- **Word export**: `docx`

---

## Eerste keer setup

### 1. Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com), maak een nieuw project (regio: EU).
2. Project Settings → API → kopieer:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (geheim, alleen server-side)
3. Open de SQL editor → New query → plak de volledige inhoud van
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run.
4. Storage → New bucket → naam: `documents` → Private.

### 2. API keys

- **Anthropic**: maak een key aan op [console.anthropic.com](https://console.anthropic.com).
- **OpenAI**: maak een key aan op [platform.openai.com](https://platform.openai.com)
  (alleen gebruikt voor embeddings — kost een paar cent per 100 documenten).

### 3. .env.local

```bash
cp .env.local.example .env.local
# vul de waardes in
```

### 4. Installeren & starten

```bash
npm install
npm run dev
```

Open http://localhost:3000.

---

## Gebruik

### Kennisbank vullen

1. `/kennisbank/upload` → kies een ZIN pakketadvies PDF.
2. Klik **Extract** → Haiku haalt de gestructureerde velden eruit.
3. Review het formulier (titel, comparator, verdict etc.) en pas waar nodig aan.
4. Klik **Opslaan** → de beoordeling, trials én chunks/embeddings worden in Supabase gezet.

Herhaal voor 3-5 historische pakketadviezen om de RAG-kennisbank zinvol te maken.

### Klantproject opzetten

1. `/projecten/nieuw` → naam, stof, indicatie.
2. **Brondata** → upload EPAR/SmPC/publicaties (PDF). Ze worden gechunkt en geëmbed.
3. **Dossier** → per ZIN-sectie:
   - Klik **Genereer** → Sonnet schrijft de sectie op basis van project-bronnen + kennisbank-voorbeelden.
   - Bewerk de tekst, zet status op `reviewed` of `approved`.
   - Klik **Regenereer** voor een nieuwe versie (oude versies blijven in DB).
4. **Gap-analyse** → klik **Analyseer**. Krijgt per ZIN-criterium status + risico + aanbeveling, plus de 5 meest vergelijkbare historische cases.
5. **Exporteer Word** vanaf de dossier-pagina.

---

## Belangrijk voor MVP

- Row Level Security staat **uit** — alle DB-toegang via service role key. Niet inzetten zonder auth.
- Prompts staan in `prompts/*.md` — pas vrij aan zonder code te raken.
- Kosten per dossier-sectie: ruwweg een paar cent (Sonnet, 4k tokens out, met prompt-caching op het system-block).
- Extractie via Haiku is goedkoop (~$0.01 per pakketadvies).

## Modelkeuze

Aangepast in `lib/anthropic.ts` (`MODELS` constant):

| Functie                        | Model                   |
| ------------------------------ | ----------------------- |
| PDF extractie                  | claude-haiku-4-5        |
| Sectie schrijven, gap analyse  | claude-sonnet-4-6       |
| (Beschikbaar als zwaarder)     | claude-opus-4-7         |

## Folder structuur

```
app/
  layout.tsx               sidebar + global layout
  page.tsx                 dashboard
  kennisbank/              ZIN-beoordelingen overzicht/upload/detail
  projecten/               klant-dossiers
  api/                     server-side endpoints (extract, generate, gaps, export, ...)
lib/
  supabase.ts, anthropic.ts, env.ts
  extract.ts, generate.ts, gaps.ts
  pdf.ts, chunk.ts, embeddings.ts, search.ts, export-docx.ts
  prompts.ts, types.ts
prompts/
  extract-pakketadvies.md
  section-*.md             8 ZIN-secties
  gap-analysis.md
  pico-scoping.md
supabase/
  migrations/0001_init.sql
```

## Deploy naar Vercel

1. `vercel link` (of via dashboard: import GitHub repo).
2. Zet onder **Settings → Environment Variables** alle keys uit `.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `SUPABASE_STORAGE_BUCKET=documents`
   - `BASIC_AUTH_USER=accelia` (of een andere naam)
   - `BASIC_AUTH_PASSWORD=<sterk wachtwoord>`
3. Deploy.
4. Koppel je custom domein onder **Settings → Domains**.

De basic-auth middleware (`middleware.ts`) toont een browser-prompt zodra `BASIC_AUTH_PASSWORD`
gezet is. Lokaal blijft hij uit zodat dev-werk niet onnodig om credentials vraagt.

## Volgende stappen

- Trials extractie verbeteren (multi-pass, validatie tegen clinicaltrials.gov).
- ICER-modellering tooling.
- Echte accounts + RLS via Supabase Auth (vervangt basic auth).
- Side-by-side diff van versies van dossier-secties.
- Eigen NL embedding-model proberen (E5-multilingual via Voyage of Cohere).
