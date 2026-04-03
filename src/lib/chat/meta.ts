import { NextRequest } from 'next/server';

export function getRequestMeta(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || undefined;

  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    undefined;

  const region = request.headers.get('x-vercel-ip-country-region') || undefined;
  const city = request.headers.get('x-vercel-ip-city') || undefined;

  return { ip, userAgent, country, region, city };
}