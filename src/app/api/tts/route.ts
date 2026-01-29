/**
 * OpenAI Text-to-Speech API
 * Enterprise-grade with validation and caching headers
 * 
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Response: Audio stream (mp3)
 * 
 * GET /api/tts
 * Response: List of available voices
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sanitizeString, globalRateLimiter, getClientIP } from '@/lib/api-utils';
import { OPENAI_VOICES, VALID_VOICE_IDS, type OpenAIVoice } from '@/lib/tts-voices';
import { createClient } from '@supabase/supabase-js';

interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  userId?: string;
}

// Lazy OpenAI initialization
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

// Get user's OpenAI API key from settings
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

    return data?.openai_api_key || null;
  } catch (err) {
    console.error('Error in getUserApiKey:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting (stricter for TTS as it's more expensive)
    const clientIP = getClientIP(request);
    const rateLimit = globalRateLimiter.check(`tts:${clientIP}`);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
          }
        }
      );
    }

    // Parse request
    let body: TTSRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { text, voice = 'alloy', speed = 1.0, userId } = body;

    // Validate text
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required and must be a string' }, { status: 400 });
    }

    const sanitizedText = sanitizeString(text, 4096);
    if (sanitizedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Get user's API key if userId provided
    const userApiKey = userId ? await getUserApiKey(userId) : null;

    // Check OpenAI configuration (user's key takes priority)
    const openai = getOpenAI(userApiKey);
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in Settings.' },
        { status: 503 }
      );
    }

    // Validate and sanitize voice
    const selectedVoice = VALID_VOICE_IDS.includes(voice as OpenAIVoice) 
      ? (voice as OpenAIVoice) 
      : 'alloy';

    // Validate and clamp speed (0.25 to 4.0)
    const selectedSpeed = Math.max(0.25, Math.min(4.0, Number(speed) || 1.0));

    // Generate speech
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: sanitizedText,
      speed: selectedSpeed,
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Return audio response with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Voice': selectedVoice,
        'X-Speed': selectedSpeed.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    
    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'TTS service is temporarily overloaded. Please try again later.' },
          { status: 503 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'TTS service configuration error.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({ 
    voices: OPENAI_VOICES,
    configured: !!process.env.OPENAI_API_KEY,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    }
  });
}