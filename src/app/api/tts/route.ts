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

interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
}

// Lazy OpenAI initialization
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

    const { text, voice = 'alloy', speed = 1.0 } = body;

    // Validate text
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required and must be a string' }, { status: 400 });
    }

    const sanitizedText = sanitizeString(text, 4096);
    if (sanitizedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Check OpenAI configuration
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. TTS is unavailable.' },
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
