/**
 * Settings API - Save user settings with encrypted API keys
 * 
 * POST /api/settings
 * Body: { agent_name, personality_prompt, voice_id, voice_speed, openai_api_key }
 * 
 * SECURITY: Requires valid JWT in Authorization header
 * API keys are encrypted before storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
}

interface SettingsRequest {
  agent_name?: string;
  personality_prompt?: string;
  voice_id?: string;
  voice_speed?: number;
  openai_api_key?: string;
}

// GET - Get current settings (with masked API key)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const userId = authResult.userId;
    const supabaseAdmin = getSupabaseAdmin();
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { data, error } = await supabaseAdmin
      .from('agent_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ settings: null });
    }

    // Decrypt and mask the API key for display
    let maskedApiKey = '';
    let hasApiKey = false;
    
    if (data.openai_api_key) {
      const decryptedKey = decrypt(data.openai_api_key);
      if (decryptedKey) {
        hasApiKey = true;
        maskedApiKey = maskApiKey(decryptedKey);
      }
    }

    return NextResponse.json({
      settings: {
        id: data.id,
        agent_name: data.agent_name,
        personality_prompt: data.personality_prompt,
        voice_id: data.voice_id,
        voice_speed: data.voice_speed,
        has_api_key: hasApiKey,
        masked_api_key: maskedApiKey,
      }
    });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save settings (encrypts API key)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const userId = authResult.userId;
    const supabaseAdmin = getSupabaseAdmin();
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body: SettingsRequest = await request.json();
    const { agent_name, personality_prompt, voice_id, voice_speed, openai_api_key } = body;

    // Check if settings already exist
    const { data: existing } = await supabaseAdmin
      .from('agent_settings')
      .select('id, openai_api_key')
      .eq('user_id', userId)
      .single();

    // Prepare settings data
    const settingsData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (agent_name !== undefined) settingsData.agent_name = agent_name;
    if (personality_prompt !== undefined) settingsData.personality_prompt = personality_prompt;
    if (voice_id !== undefined) settingsData.voice_id = voice_id;
    if (voice_speed !== undefined) settingsData.voice_speed = voice_speed;

    // Handle API key - encrypt if provided, or keep existing if empty string
    if (openai_api_key !== undefined) {
      if (openai_api_key === '') {
        // Clear the API key
        settingsData.openai_api_key = null;
      } else if (openai_api_key.startsWith('sk-')) {
        // New API key provided - encrypt it
        settingsData.openai_api_key = encrypt(openai_api_key);
      }
      // If it doesn't start with 'sk-' and isn't empty, it might be the masked version - ignore it
    }

    let result;
    
    if (existing) {
      // Update existing record
      result = await supabaseAdmin
        .from('agent_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select('id')
        .single();
    } else {
      // Insert new record
      result = await supabaseAdmin
        .from('agent_settings')
        .insert({
          user_id: userId,
          ...settingsData,
        })
        .select('id')
        .single();
    }

    if (result.error) {
      console.error('Error saving settings:', result.error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      id: result.data.id,
    });
  } catch (err) {
    console.error('Settings POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
