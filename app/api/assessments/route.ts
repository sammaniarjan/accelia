import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/** GET met optionele filters: ?route=&verdict=&q= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const route = sp.get('route');
  const verdict = sp.get('verdict');
  const q = sp.get('q');

  const sb = supabaseAdmin();
  let query = sb
    .from('assessments')
    .select(
      'id, document_title, publication_date, route, overall_verdict, comparator, document_type, substance:substances(inn_name, trade_name), indication:indications(name_nl, therapeutic_area)',
    )
    .order('publication_date', { ascending: false, nullsFirst: false });

  if (route) query = query.eq('route', route);
  if (verdict) query = query.eq('overall_verdict', verdict);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => {
      const sub = Array.isArray(r.substance) ? r.substance[0] : r.substance;
      const ind = Array.isArray(r.indication) ? r.indication[0] : r.indication;
      const subName = sub?.inn_name?.toLowerCase() ?? '';
      const tradeName = sub?.trade_name?.toLowerCase() ?? '';
      const indName = ind?.name_nl?.toLowerCase() ?? '';
      const comp = (r.comparator ?? '').toLowerCase();
      const title = (r.document_title ?? '').toLowerCase();
      return (
        subName.includes(needle) ||
        tradeName.includes(needle) ||
        indName.includes(needle) ||
        comp.includes(needle) ||
        title.includes(needle)
      );
    });
  }

  return NextResponse.json({ assessments: rows });
}
