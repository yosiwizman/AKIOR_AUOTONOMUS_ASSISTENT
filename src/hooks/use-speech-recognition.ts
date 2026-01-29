/**
 * Custom hook for Web Speech API - Speech Recognition
 * 
 * Provides push-to-talk functionality using the browser's native
 * SpeechRecognition API. Falls back gracefully if not supported.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

interface UseSpeechRecognitionReturn {
  /** Current status of speech recognition */
  status: RecognitionStatus;
  /** Current transcript (includes interim results) */
  transcript: string;
  /** Final transcript after recognition ends */
  finalTranscript: string;
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Error message if any */
  error: string | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Clear the transcript */
  clearTranscript: () => void;
  /** Set transcript manually (for editing) */
  setTranscript: (text: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setStatus('unsupported');
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognitionAPI();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalText) {
        setFinalTranscript(prev => prev + finalText);
        setTranscript(prev => prev + finalText);
      } else {
        // Show interim results
        setTranscript(prev => {
          const base = finalTranscript || prev.replace(/\s*\[.*\]$/, '');
          return base + (interimTranscript ? ` [${interimTranscript}]` : '');
        });
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your connection.';
          break;
        case 'aborted':
          // User stopped, not an error
          return;
        default:
          errorMessage = `Recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setStatus('error');
    };

    // Handle end
    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    // Handle start
    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not available');
      return;
    }

    setError(null);
    setTranscript('');
    setFinalTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Recognition might already be running
      console.warn('Recognition start error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setStatus('idle');
      // Clean up interim markers from transcript
      setTranscript(prev => prev.replace(/\s*\[.*\]$/, ''));
    } catch (err) {
      console.warn('Recognition stop error:', err);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    transcript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
  };
}
