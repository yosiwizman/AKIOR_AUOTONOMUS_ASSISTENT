/**
 * Custom hook for Web Speech API - Speech Synthesis (TTS)
 * 
 * Provides text-to-speech functionality using the browser's native
 * speechSynthesis API. Falls back gracefully if not supported.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechSynthesisReturn {
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Whether TTS is supported */
  isSupported: boolean;
  /** Available voices */
  voices: SpeechSynthesisVoice[];
  /** Currently selected voice */
  selectedVoice: SpeechSynthesisVoice | null;
  /** Speak the given text */
  speak: (text: string) => void;
  /** Stop speaking */
  stop: () => void;
  /** Set the voice to use */
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize and load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select a default English voice
      if (availableVoices.length > 0 && !selectedVoice) {
        const englishVoice = availableVoices.find(
          v => v.lang.startsWith('en') && v.localService
        ) || availableVoices.find(
          v => v.lang.startsWith('en')
        ) || availableVoices[0];
        
        setSelectedVoice(englishVoice);
      }
    };

    // Load voices immediately
    loadVoices();

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Configure speech parameters
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    speak,
    stop,
    setVoice,
  };
}
