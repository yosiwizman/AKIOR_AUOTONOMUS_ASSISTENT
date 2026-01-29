/**
 * Embeddings API - Generate embeddings for knowledge base documents
 * 
 * POST /api/embeddings
 * Body: { documentId: string, content: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { documentId, content, type = 'knowledge' } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, skipping embedding generation');
      return NextResponse.json({ 
        success: false, 
        message: 'OpenAI API key not configured' 
      }, { status: 200 });
    }

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content.slice(0, 8000), // Limit input length
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Update the document with the embedding
    if (documentId) {
      const table = type === 'memory' ? 'memories' : 'knowledge_base';
      
      const { error } = await supabaseAdmin
        .from(table)
        .update({ embedding })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating embedding:', error);
        return NextResponse.json({ error: 'Failed to save embedding' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      embedding: documentId ? undefined : embedding 
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
