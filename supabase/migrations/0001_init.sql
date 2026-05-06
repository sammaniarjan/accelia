-- Accelia MVP — initiele schema
-- Draai dit volledige bestand in de Supabase SQL editor (Project → SQL → New query → Run)

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ============================================================
-- Stoffen
-- ============================================================
create table if not exists substances (
  id uuid primary key default gen_random_uuid(),
  inn_name text not null,
  trade_name text,
  atc_code text,
  mechanism text,
  manufacturer text,
  created_at timestamptz default now()
);

-- ============================================================
-- Indicaties
-- ============================================================
create table if not exists indications (
  id uuid primary key default gen_random_uuid(),
  name_nl text not null,
  therapeutic_area text,
  tumor_type text,
  icd_code text
);

-- ============================================================
-- ZIN beoordelingen (kennisbank)
-- ============================================================
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  substance_id uuid references substances(id) on delete set null,
  indication_id uuid references indications(id) on delete set null,
  document_title text,
  reference_number text,
  publication_date date,
  document_type text,
  route text,

  -- PICO
  population text,
  intervention text,
  comparator text,
  comparator_validity text,
  primary_endpoints text[],

  -- Beoordeling
  effectiveness_verdict text,
  paskwil_verdict text,
  burden_category text,
  proportional_shortfall numeric,
  icer_at_list text,
  icer_threshold text,
  cost_effectiveness_verdict text,
  necessity_verdict text,
  feasibility_verdict text,
  budget_impact_year3 text,

  -- Uitkomst
  overall_verdict text,
  price_condition boolean,
  discount_required text,
  gepast_gebruik text,
  sluis_placement_date date,
  key_conditions text[],

  -- Commissies
  ciebom_position text,
  war_position text,
  acp_position text,
  ciebag_position text,

  -- Ruwe data
  source_pdf_url text,
  raw_extracted_json jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- Trials per beoordeling
-- ============================================================
create table if not exists trials (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  name text,
  design text,
  n_patients integer,
  primary_endpoint text,
  pfs_hr numeric,
  pfs_hr_ci text,
  os_hr numeric,
  os_hr_ci text,
  orr text,
  median_pfs_months numeric,
  median_os_months numeric,
  key_safety text,
  publication_doi text
);

-- ============================================================
-- Document chunks voor RAG
-- ============================================================
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  project_document_id uuid, -- forward ref, wordt hieronder gevuld
  source text not null default 'assessment', -- 'assessment' | 'project_document'
  section text,
  content text not null,
  page_ref text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- ============================================================
-- Projecten (klant-dossiers)
-- ============================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  substance_name text,
  indication text,
  status text default 'draft',
  created_at timestamptz default now()
);

-- ============================================================
-- Klant-uploads per project
-- ============================================================
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  filename text,
  document_type text,
  storage_path text,
  parsed_content text,
  created_at timestamptz default now()
);

-- nu pas FK toevoegen (chunks ↔ project_documents)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chunks_project_document_id_fkey'
  ) then
    alter table chunks
      add constraint chunks_project_document_id_fkey
      foreign key (project_document_id)
      references project_documents(id)
      on delete cascade;
  end if;
end$$;

-- ============================================================
-- Gegenereerde dossier-secties
-- ============================================================
create table if not exists dossier_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  section_key text not null,
  section_title text,
  content text,
  sources jsonb,
  version integer default 1,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Gap analyse resultaten
-- ============================================================
create table if not exists gap_analysis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  criterion text,
  status text,
  explanation text,
  similar_cases jsonb,
  risk_level text,
  recommendation text,
  created_at timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists chunks_assessment_idx on chunks (assessment_id);
create index if not exists chunks_project_document_idx on chunks (project_document_id);
create index if not exists assessments_substance_idx on assessments (substance_id);
create index if not exists assessments_indication_idx on assessments (indication_id);
create index if not exists assessments_verdict_idx on assessments (overall_verdict);
create index if not exists trials_assessment_idx on trials (assessment_id);
create index if not exists project_documents_project_idx on project_documents (project_id);
create index if not exists dossier_sections_project_idx on dossier_sections (project_id);

-- ============================================================
-- RPC: vector similarity search over chunks
--     - filter optioneel op source en op project_id (project_documents)
-- ============================================================
create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 10,
  filter_source text default null,
  filter_project_id uuid default null,
  filter_assessment_ids uuid[] default null
)
returns table (
  id uuid,
  assessment_id uuid,
  project_document_id uuid,
  source text,
  section text,
  content text,
  page_ref text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.assessment_id,
    c.project_document_id,
    c.source,
    c.section,
    c.content,
    c.page_ref,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  left join project_documents pd on pd.id = c.project_document_id
  where (filter_source is null or c.source = filter_source)
    and (filter_project_id is null or pd.project_id = filter_project_id)
    and (filter_assessment_ids is null or c.assessment_id = any(filter_assessment_ids))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- RPC: vergelijkbare assessments op basis van embedding-overlap
-- ============================================================
create or replace function similar_assessments(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  assessment_id uuid,
  avg_similarity float,
  hits int
)
language sql stable
as $$
  select
    c.assessment_id,
    avg(1 - (c.embedding <=> query_embedding)) as avg_similarity,
    count(*)::int as hits
  from chunks c
  where c.source = 'assessment'
    and c.assessment_id is not null
  group by c.assessment_id
  order by avg_similarity desc
  limit match_count;
$$;
