/**
 * OpenAI Text-to-Speech API
 * 
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Response: Audio stream (mp3)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available OpenAI TTS voices
export const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm and conversational' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dramatic' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly and upbeat' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear and pleasant' },
] as const;

export type OpenAIVoice = typeof OPENAI_VOICES[number]['id'];

interface TTSRequest {
  text: string;
  voice?: OpenAIVoice;
  speed?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, voice = 'alloy', speed = 1.0 } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Validate voice
    const validVoices = OPENAI_VOICES.map(v => v.id);
    const selectedVoice = validVoices.includes(voice as OpenAIVoice) ? voice : 'alloy';

    // Validate speed (0.25 to 4.0)
    const selectedSpeed = Math.max(0.25, Math.min(4.0, speed));

    // Generate speech
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice as OpenAIVoice,
      input: text.slice(0, 4096), // Max 4096 characters
      speed: selectedSpeed,
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Return audio response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({ voices: OPENAI_VOICES });
}
