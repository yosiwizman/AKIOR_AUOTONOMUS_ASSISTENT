/**
 * Messages API - Get messages for a conversation
 * 
 * GET /api/conversations/[id]/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err) {
    console.error('Messages GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
