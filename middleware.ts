import { NextRequest, NextResponse } from 'next/server';

/**
 * Simpele basic-auth gate voor de gehele app, behalve API routes (die mogen geen browser-prompt
 * krijgen — fetch calls vanaf de UI passeren door dezelfde sessie/cookies via de proxy).
 *
 * Configuratie via env vars (zet deze ook in Vercel):
 *   BASIC_AUTH_USER     bv. "accelia"
 *   BASIC_AUTH_PASSWORD bv. een sterk wachtwoord
 *
 * Als BASIC_AUTH_PASSWORD niet gezet is, staat de site open (handig voor lokale dev).
 */
export function middleware(req: NextRequest) {
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!password) return NextResponse.next();

  const expectedUser = process.env.BASIC_AUTH_USER || 'accelia';
  const header = req.headers.get('authorization');

  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === expectedUser && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Accelia"',
    },
  });
}

export const config = {
  // Pas op alles behalve Next-internals en statische assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
