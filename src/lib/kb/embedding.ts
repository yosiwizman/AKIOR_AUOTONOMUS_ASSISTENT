import { sha256Hex } from './hash';

const DEFAULT_DIM = 256;

export function getEmbedDim(): number {
  const raw = (process.env.EMBED_DIM || '').trim();
  const n = Number.parseInt(raw, 10);
  if (!raw) return DEFAULT_DIM;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DIM;
  // Keep a sane bound; avoids accidental huge allocations.
  return Math.max(16, Math.min(4096, n));
}

function l2Normalize(vec: Float32Array) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i];
  const norm = Math.sqrt(sum) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm;
}

/**
 * Local-first deterministic embedding.
 *
 * Not a foundation-model embedding: it's a stable semantic-ish hash vector suitable
 * for a verifiable RAG slice without external dependencies.
 */
export function embedText(text: string): number[] {
  const dim = getEmbedDim();
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean).slice(0, 4000);
  const vec = new Float32Array(dim);

  for (const t of tokens) {
    const h = sha256Hex(t);
    // Use first 8 bytes as two indices + a sign.
    const a = parseInt(h.slice(0, 8), 16) >>> 0;
    const b = parseInt(h.slice(8, 16), 16) >>> 0;
    const i1 = a % dim;
    const i2 = b % dim;
    const sign = (a & 1) === 0 ? 1 : -1;
    vec[i1] += 1 * sign;
    vec[i2] += 0.5 * sign;
  }

  l2Normalize(vec);
  return Array.from(vec);
}

export const EMBEDDING_DIMS = getEmbedDim();