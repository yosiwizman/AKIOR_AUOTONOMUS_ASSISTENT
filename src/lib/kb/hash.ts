import crypto from 'crypto';

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function safeId(prefix = 'trace'): string {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}
