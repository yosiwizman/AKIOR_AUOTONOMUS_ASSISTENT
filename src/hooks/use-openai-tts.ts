/**
 * Custom hook for OpenAI Text-to-Speech
 */

import { useState, useCallback, useRef } from 'react';
import { OPENAI_VOICES, type OpenAIVoice } from '@/lib/tts-voices';

// Re-export for convenience
export { OPENAI_VOICES, type OpenAIVoice } from '@/lib/tts-voices';

interface UseOpenAITTSOptions {
  voice?: OpenAIVoice;
  speed?: number;
  userId?: string;
}

interface UseOpenAITTSReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  voice: OpenAIVoice;
  setVoice: (voice: OpenAIVoice) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  userId: string | undefined;
  setUserId: (userId: string | undefined) => void;
}

export function useOpenAITTS(options: UseOpenAITTSOptions = {}): UseOpenAITTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<OpenAIVoice>(options.voice || 'alloy');
  const [speed, setSpeed] = useState(options.speed || 1.0);
  const [userId, setUserId] = useState<string | undefined>(options.userId);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();

    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed, userId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, not an error
        return;
      }
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      setIsLoading(false);
    }
  }, [voice, speed, userId, stop]);

  return {
    isSpeaking,
    isLoading,
    error,
    speak,
    stop,
    voice,
    setVoice,
    speed,
    setSpeed,
    userId,
    setUserId,
  };
}