import { describe, it, expect } from 'vitest';
import { embedText, getEmbedDim, isOpenAIEmbeddingsAvailable } from '@/lib/kb/embedding';

describe('Embeddings', () => {
  describe('getEmbedDim', () => {
    it('should return correct dimension', () => {
      expect(getEmbedDim()).toBe(1536);
    });
  });

  describe('embedText (deterministic)', () => {
    it('should generate embeddings of correct dimension', () => {
      const text = 'Test text for embedding';
      const embedding = embedText(text);
      
      expect(embedding.length).toBe(getEmbedDim());
    });

    it('should generate consistent embeddings for same text', () => {
      const text = 'Consistent text';
      const embedding1 = embedText(text);
      const embedding2 = embedText(text);
      
      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different text', () => {
      const embedding1 = embedText('Text A');
      const embedding2 = embedText('Text B');
      
      expect(embedding1).not.toEqual(embedding2);
    });

    it('should generate normalized vectors', () => {
      const text = 'Test normalization';
      const embedding = embedText(text);
      
      // Calculate L2 norm
      const norm = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      
      // Should be close to 1 (unit vector)
      expect(norm).toBeCloseTo(1, 5);
    });

    it('should handle empty text', () => {
      const embedding = embedText('');
      expect(embedding.length).toBe(getEmbedDim());
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(10000);
      const embedding = embedText(longText);
      
      expect(embedding.length).toBe(getEmbedDim());
    });
  });

  describe('isOpenAIEmbeddingsAvailable', () => {
    it('should check for OpenAI API key', () => {
      const available = isOpenAIEmbeddingsAvailable();
      expect(typeof available).toBe('boolean');
    });
  });
});
