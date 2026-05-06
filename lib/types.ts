/** Gedeelde typedefs voor zowel UI als API. */

export interface ExtractedAssessment {
  document_title: string | null;
  reference_number: string | null;
  publication_date: string | null;
  document_type: string | null;
  route: string | null;

  substance: { inn_name: string; trade_name?: string | null; atc_code?: string | null; mechanism?: string | null; manufacturer?: string | null } | null;
  indication: { name_nl: string; therapeutic_area?: string | null; tumor_type?: string | null; icd_code?: string | null } | null;

  population: string | null;
  intervention: string | null;
  comparator: string | null;
  comparator_validity: string | null;
  primary_endpoints: string[] | null;

  effectiveness_verdict: string | null;
  paskwil_verdict: string | null;
  burden_category: string | null;
  proportional_shortfall: number | null;
  icer_at_list: string | null;
  icer_threshold: string | null;
  cost_effectiveness_verdict: string | null;
  necessity_verdict: string | null;
  feasibility_verdict: string | null;
  budget_impact_year3: string | null;

  overall_verdict: string | null;
  price_condition: boolean | null;
  discount_required: string | null;
  gepast_gebruik: string | null;
  sluis_placement_date: string | null;
  key_conditions: string[] | null;

  ciebom_position: string | null;
  war_position: string | null;
  acp_position: string | null;
  ciebag_position: string | null;

  trials: ExtractedTrial[];
}

export interface ExtractedTrial {
  name: string | null;
  design: string | null;
  n_patients: number | null;
  primary_endpoint: string | null;
  pfs_hr: number | null;
  pfs_hr_ci: string | null;
  os_hr: number | null;
  os_hr_ci: string | null;
  orr: string | null;
  median_pfs_months: number | null;
  median_os_months: number | null;
  key_safety: string | null;
  publication_doi: string | null;
}

export const DOSSIER_SECTIONS: { key: string; title: string; promptFile: string }[] = [
  { key: 'aanleiding', title: '1. Aanleiding', promptFile: 'section-aanleiding.md' },
  { key: 'zorgvraag', title: '2. Zorgvraag en huidige behandeling', promptFile: 'section-zorgvraag.md' },
  { key: 'beschrijving', title: '3. Beschrijving van het geneesmiddel', promptFile: 'section-beschrijving.md' },
  { key: 'effectiviteit', title: '4. Klinische effectiviteit', promptFile: 'section-effectiviteit.md' },
  { key: 'veiligheid', title: '5. Klinische veiligheid', promptFile: 'section-veiligheid.md' },
  { key: 'comparator', title: '6. Vergelijking met de standaardbehandeling', promptFile: 'section-comparator.md' },
  { key: 'toepasbaarheid', title: '7. Toepasbaarheid', promptFile: 'section-toepasbaarheid.md' },
  { key: 'conclusie', title: '8. Conclusie therapeutische waarde', promptFile: 'section-conclusie.md' },
];

export const GAP_CRITERIA = [
  'effectiviteit',
  'kosteneffectiviteit',
  'noodzakelijkheid',
  'uitvoerbaarheid',
] as const;
export type GapCriterion = (typeof GAP_CRITERIA)[number];
