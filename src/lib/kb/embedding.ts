import { createHash } from 'crypto';
import OpenAI from 'openai';

/**
 * Get embedding dimension for the model
 * text-embedding-3-small: 1536 dimensions
 * text-embedding-3-large: 3072 dimensions
 */
export function getEmbedDim(): number {
  return 1536;
}

/**
 * Get OpenAI client for embeddings
 */
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[embedding] No OPENAI_API_KEY found, using deterministic embeddings');
    return null;
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate embeddings using OpenAI API (production)
 * Falls back to deterministic embeddings if API key not available
 */
export async function embedTextAsync(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // Limit to ~8k chars to stay within token limits
        encoding_format: 'float',
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('[embedding] OpenAI API error, falling back to deterministic:', error);
      // Fall through to deterministic
    }
  }
  
  // Fallback to deterministic embeddings
  return embedTextDeterministic(text);
}

/**
 * Synchronous embedding function (uses deterministic method)
 * Use embedTextAsync() for production with OpenAI API
 */
export function embedText(text: string): number[] {
  return embedTextDeterministic(text);
}

/**
 * Deterministic embedding for demo/testing
 * Generates consistent embeddings based on text hash
 * 
 * NOTE: This is for demo purposes only. In production, use embedTextAsync()
 * which calls the OpenAI embeddings API for better quality.
 */
function embedTextDeterministic(text: string): number[] {
  const dim = getEmbedDim();
  const hash = createHash('sha256').update(text).digest();

  const embedding = new Array(dim);
  for (let i = 0; i < dim; i++) {
    const byteIndex = i % hash.length;
    const nextByteIndex = (i + 1) % hash.length;
    
    // Use two bytes to get more variation
    const val1 = hash[byteIndex] / 255;
    const val2 = hash[nextByteIndex] / 255;
    
    // Combine and normalize to [-1, 1]
    embedding[i] = (val1 + val2) / 2 * 2 - 1;
  }

  // Normalize to unit vector (required for cosine similarity)
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

/**
 * Batch embed multiple texts (more efficient for bulk operations)
 */
export async function embedTextBatch(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();
  
  if (openai && texts.length > 0) {
    try {
      // OpenAI supports up to 2048 inputs per request
      const batchSize = 100; // Conservative batch size
      const results: number[][] = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch.map(t => t.slice(0, 8000)),
          encoding_format: 'float',
        });
        
        results.push(...response.data.map(d => d.embedding));
      }
      
      return results;
    } catch (error) {
      console.error('[embedding] Batch embedding error, falling back:', error);
      // Fall through to deterministic
    }
  }
  
  // Fallback to deterministic
  return texts.map(embedTextDeterministic);
}

/**
 * Check if OpenAI embeddings are available
 */
export function isOpenAIEmbeddingsAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}