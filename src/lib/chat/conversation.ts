import { SupabaseClient } from '@supabase/supabase-js';

export async function getOrCreateConversation(
  db: SupabaseClient,
  userId: string,
  conversationId?: string,
  firstMessage?: string
) {
  try {
    if (conversationId) {
      const { data: existing } = await db
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
        return conversationId;
      }
    }

    const title =
      firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Conversation';

    const { data: newConv, error } = await db
      .from('conversations')
      .insert({ user_id: userId, title })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return newConv.id;
  } catch (err) {
    console.error('Error in getOrCreateConversation:', err);
    return null;
  }
}

export async function saveMessage(
  db: SupabaseClient,
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const { data, error } = await db
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: userId, role, content })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('Error in saveMessage:', err);
    return null;
  }
}

export async function loadConversationHistory(
  db: SupabaseClient,
  conversationId: string,
  userId: string,
  limit = 50
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  try {
    const { data: conv } = await db
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conv) return [];

    const { data, error } = await db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }

    return (data || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  } catch (err) {
    console.error('Error in loadConversationHistory:', err);
    return [];
  }
}