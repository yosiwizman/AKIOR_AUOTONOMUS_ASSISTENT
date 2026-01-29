/**
 * Embeddings API - Generate embeddings for knowledge base documents
 * Enterprise-grade with validation and error handling
 * 
 * POST /api/embeddings
 * Body: { documentId: string, content: string, type?: 'knowledge' | 'memory' }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString, globalRateLimiter, getClientIP } from '@/lib/api-utils';

// Initialize OpenAI client (lazy - only when needed)
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Initialize Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
}

interface EmbeddingRequest {
  documentId?: string;
  content: string;
  type?: 'knowledge' | 'memory';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = globalRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
          }
        }
      );
    }

    // Parse and validate request
    let body: EmbeddingRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { documentId, content, type = 'knowledge' } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
    }

    const sanitizedContent = sanitizeString(content, 8000);
    if (sanitizedContent.length === 0) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    // Validate documentId if provided
    if (documentId && !isValidUUID(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
    }

    // Validate type
    if (type !== 'knowledge' && type !== 'memory') {
      return NextResponse.json({ error: 'Type must be "knowledge" or "memory"' }, { status: 400 });
    }

    // Check OpenAI configuration
    const openai = getOpenAI();
    if (!openai) {
      console.warn('OpenAI API key not configured, skipping embedding generation');
      return NextResponse.json({ 
        success: false, 
        message: 'OpenAI API key not configured',
        configured: false,
      }, { status: 200 });
    }

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: sanitizedContent,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Update document if ID provided
    if (documentId) {
      const supabaseAdmin = getSupabaseAdmin();
      
      if (!supabaseAdmin) {
        console.warn('Supabase admin not configured, returning embedding without saving');
        return NextResponse.json({ 
          success: true, 
          embedding,
          saved: false,
        }, {
          headers: {
            'X-Response-Time': `${Date.now() - startTime}ms`,
          }
        });
      }

      const table = type === 'memory' ? 'memories' : 'knowledge_base';
      
      const { error } = await supabaseAdmin
        .from(table)
        .update({ embedding })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating embedding:', error);
        return NextResponse.json({ 
          error: 'Failed to save embedding to database',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      embedding: documentId ? undefined : embedding,
      saved: !!documentId,
      dimensions: embedding.length,
    }, {
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    
    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again later.' },
          { status: 503 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}