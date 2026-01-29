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
  const retryCountRef = useRef(0);
  const maxRetries = 2;

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
      // Reset retry count on successful result
      retryCountRef.current = 0;
      
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
      // Use console.warn instead of console.error to avoid Next.js error overlay
      console.warn('[Speech Recognition] Error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      let shouldRetry = false;
      
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
          // Network errors can be transient - try to auto-retry
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            shouldRetry = true;
            console.warn(`[Speech Recognition] Network error, retrying (${retryCountRef.current}/${maxRetries})...`);
            // Don't show error to user yet, just retry
            setTimeout(() => {
              try {
                recognition.start();
              } catch {
                // Ignore if already started
              }
            }, 500);
            return;
          }
          errorMessage = 'Network error connecting to speech service. Please check your internet connection and try again.';
          break;
        case 'aborted':
          // User stopped, not an error
          setStatus('idle');
          return;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed. This may be a browser restriction.';
          break;
        default:
          errorMessage = `Recognition error: ${event.error}`;
      }
      
      if (!shouldRetry) {
        setError(errorMessage);
        setStatus('error');
        retryCountRef.current = 0;
      }
    };

    // Handle end
    recognition.onend = () => {
      // Only set to idle if we're not in an error state
      setStatus(prev => prev === 'listening' ? 'idle' : prev);
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
    retryCountRef.current = 0;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Recognition might already be running
      console.warn('[Speech Recognition] Start error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    retryCountRef.current = 0;
    
    try {
      recognitionRef.current.stop();
      setStatus('idle');
      // Clean up interim markers from transcript
      setTranscript(prev => prev.replace(/\s*\[.*\]$/, ''));
    } catch (err) {
      console.warn('[Speech Recognition] Stop error:', err);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setError(null);
    retryCountRef.current = 0;
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