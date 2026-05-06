import { NextRequest, NextResponse } from 'next/server';
import { exportProjectDossierDocx } from '@/lib/export-docx';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId is verplicht' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data: project } = await sb.from('projects').select('name').eq('id', projectId).single();
  const buffer = await exportProjectDossierDocx(projectId);
  const filename = `FT-dossier-${(project?.name ?? 'project').replace(/[^\w.-]/g, '_')}.docx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
