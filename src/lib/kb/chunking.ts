export type Chunk = {
  text: string;
  metadata: Record<string, unknown>;
};

export function chunkText(
  text: string,
  opts?: { chunkChars?: number; overlapChars?: number; maxChunks?: number }
): Chunk[] {
  const chunkChars = opts?.chunkChars ?? 1200;
  const overlapChars = opts?.overlapChars ?? 150;
  const maxChunks = opts?.maxChunks ?? 200;

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

  if (!cleaned) return [];

  const out: Chunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < cleaned.length && out.length < maxChunks) {
    const end = Math.min(cleaned.length, start + chunkChars);
    const slice = cleaned.slice(start, end).trim();
    if (slice) {
      out.push({
        text: slice,
        metadata: {
          ordinal: idx,
          char_start: start,
          char_end: end,
        },
      });
      idx += 1;
    }
    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlapChars);
  }

  return out;
}
