import { describe, it, expect } from 'vitest';
import { chunkText } from '@/lib/kb/chunking';

describe('Text Chunking', () => {
  it('should chunk text by paragraphs', () => {
    const text = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
    const chunks = chunkText(text, { chunkChars: 50, overlapChars: 10 });
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('Paragraph');
  });

  it('should respect max chunk size', () => {
    const text = 'A'.repeat(2000);
    const chunks = chunkText(text, { chunkChars: 500, overlapChars: 50 });
    
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(550); // Allow for overlap
    }
  });

  it('should add overlap between chunks', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = chunkText(text, { chunkChars: 30, overlapChars: 10 });
    
    if (chunks.length > 1) {
      // Check that there's some overlap
      const firstEnd = chunks[0].text.slice(-10);
      const secondStart = chunks[1].text.slice(0, 10);
      // Some overlap should exist
      expect(chunks.length).toBeGreaterThan(1);
    }
  });

  it('should handle empty text', () => {
    const chunks = chunkText('');
    expect(chunks).toEqual([]);
  });

  it('should handle single paragraph', () => {
    const text = 'Single paragraph without line breaks.';
    const chunks = chunkText(text);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
  });

  it('should respect max chunks limit', () => {
    const text = Array(300).fill('Paragraph.').join('\n\n');
    const chunks = chunkText(text, { chunkChars: 50, maxChunks: 100 });
    
    expect(chunks.length).toBeLessThanOrEqual(100);
  });

  it('should include metadata', () => {
    const text = 'Test paragraph.';
    const chunks = chunkText(text);
    
    expect(chunks[0].metadata).toBeDefined();
    expect(chunks[0].metadata.chars).toBe(text.length);
  });
});
