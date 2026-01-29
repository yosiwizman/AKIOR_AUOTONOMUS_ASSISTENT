/**
 * Embeddings API - Generate embeddings for knowledge base documents
 * Enterprise-grade with validation and error handling
 * 
 * POST /api/embeddings
 * Body: { documentId: string, content: string, type?: 'knowledge' | 'memory' }
 * 
 * SECURITY: Requires valid JWT in Authorization header
 * Ownership verification: Documents must belong to the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString, globalRateLimiter, getClientIP } from '@/lib/api-utils';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { decrypt } from '@/lib/encryption';

// Initialize OpenAI client (lazy - only when needed)
function getOpenAI(apiKey?: string | null) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return null;
  }
  return new OpenAI({ apiKey: key });
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

// Get user's OpenAI API key from settings (decrypted)
async function getUserApiKey(userId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('agent_settings')
      .select('openai_api_key')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user API key:', error);
    }

    if (data?.openai_api_key) {
      // Decrypt the API key
      return decrypt(data.openai_api_key) || null;
    }

    return null;
  } catch (err) {
    console.error('Error in getUserApiKey:', err);
    return null;
  }
}

// Verify document ownership
async function verifyDocumentOwnership(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  documentId: string,
  userId: string,
  type: 'knowledge' | 'memory'
): Promise<boolean> {
  if (!supabaseAdmin) return false;
  
  const table = type === 'memory' ? 'memories' : 'knowledge_base';
  
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return true;
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

    // Verify JWT token from Authorization header
    const authResult = await verifyAuth(request);
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const userId = authResult.userId;

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

    // Get user's API key (decrypted)
    const userApiKey = await getUserApiKey(userId);

    // Check OpenAI configuration (user's key takes priority)
    const openai = getOpenAI(userApiKey);
    if (!openai) {
      console.warn('OpenAI API key not configured, skipping embedding generation');
      return NextResponse.json({ 
        success: false, 
        message: 'OpenAI API key not configured. Please add your API key in Settings.',
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

      // SECURITY: Verify document ownership before updating
      const isOwner = await verifyDocumentOwnership(supabaseAdmin, documentId, userId, type);
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Document not found or access denied' },
          { status: 404 }
        );
      }

      const table = type === 'memory' ? 'memories' : 'knowledge_base';
      
      // Update with both document ID and user ID for extra safety
      const { error } = await supabaseAdmin
        .from(table)
        .update({ embedding })
        .eq('id', documentId)
        .eq('user_id', userId);

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
