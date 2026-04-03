/**
 * OpenAI TTS Voice Configuration
 * Shared between API routes and client components
 */

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

export const VALID_VOICE_IDS = OPENAI_VOICES.map(v => v.id);
