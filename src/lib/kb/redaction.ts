type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b/g;
const BEARER = /Bearer\s+[A-Za-z0-9\-_.=]+/gi;
const OPENAI_SK = /\bsk-[A-Za-z0-9]{20,}\b/g;
const GENERIC_API_KEY = /(api[_-]?key\s*[:=]\s*)([A-Za-z0-9\-_]{8,})/gi;

function redactString(s: string, internalHosts: string[]) {
  let out = s
    .replace(IPV4, '[REDACTED_IP]')
    .replace(BEARER, 'Bearer [REDACTED_TOKEN]')
    .replace(OPENAI_SK, 'sk-[REDACTED]')
    .replace(GENERIC_API_KEY, (_, p1) => `${p1}[REDACTED]`);

  for (const host of internalHosts) {
    if (!host) continue;
    const re = new RegExp(host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, '[REDACTED_HOST]');
  }

  return out;
}

export function redactJson(input: Json): Json {
  const internalHosts = (process.env.AKIOR_INTERNAL_HOSTNAMES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const walk = (v: Json): Json => {
    if (typeof v === 'string') return redactString(v, internalHosts);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, Json> = {};
      for (const [k, val] of Object.entries(v)) out[k] = walk(val as Json);
      return out;
    }
    return v;
  };

  return walk(input);
}
