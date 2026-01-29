'use client';

/**
 * AKIOR HUD Interface - Futuristic Voice Interface
 * Inspired by JARVIS-style circular HUD design
 */

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useOpenAITTS, OpenAIVoice } from '@/hooks/use-openai-tts';
import { supabase } from '@/integrations/supabase/client';

interface AgentSettings {
  agent_name: string;
  voice_id: string;
  voice_speed: number;
}

export function AkiorHUD() {
  const { user, session } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState('Click to activate');
  const [responseText, setResponseText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agent_name: 'AKIOR',
    voice_id: 'alloy',
    voice_speed: 1.0,
  });

  const {
    status,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  const isListening = status === 'listening';
  const hasError = status === 'error';

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    setVoice,
    setSpeed,
  } = useOpenAITTS({
    voice: agentSettings.voice_id as OpenAIVoice,
    speed: agentSettings.voice_speed,
  });

  // Get auth headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [session]);

  // Load agent settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const { data } = await supabase
        .from('agent_settings')
        .select('agent_name, voice_id, voice_speed')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAgentSettings({
          agent_name: data.agent_name || 'AKIOR',
          voice_id: data.voice_id || 'alloy',
          voice_speed: data.voice_speed || 1.0,
        });
        setVoice(data.voice_id as OpenAIVoice || 'alloy');
        setSpeed(data.voice_speed || 1.0);
      }
    };

    loadSettings();
  }, [user, setVoice, setSpeed]);

  // Handle voice input completion
  const processVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setStatusText('Processing...');
    setResponseText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: text,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      const reply = data.reply || "I couldn't process that request.";
      
      setResponseText(reply);
      setStatusText('Speaking...');
      
      // Speak the response
      await speak(reply);
      
      setStatusText('Click to activate');
    } catch (err) {
      console.warn('[HUD] Error processing voice:', err);
      setStatusText('Error occurred');
      setResponseText('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [speak, getAuthHeaders]);

  // Watch for transcript changes
  useEffect(() => {
    if (transcript && !isListening && isActive && !hasError) {
      processVoiceInput(transcript);
      setIsActive(false);
    }
  }, [transcript, isListening, isActive, hasError, processVoiceInput]);

  // Update status based on state
  useEffect(() => {
    if (hasError && speechError) {
      setStatusText('Error - Click to retry');
    } else if (isListening) {
      setStatusText('Listening...');
    } else if (isSpeaking) {
      setStatusText('Speaking...');
    } else if (isProcessing) {
      setStatusText('Processing...');
    } else if (!isActive) {
      setStatusText('Click to activate');
    }
  }, [isListening, isSpeaking, isProcessing, isActive, hasError, speechError]);

  const handleActivate = () => {
    if (isProcessing) return;

    if (isSpeaking) {
      stopSpeaking();
      setStatusText('Click to activate');
      return;
    }

    if (isListening) {
      stopListening();
      setIsActive(false);
      return;
    }

    // Clear any previous errors
    if (hasError) {
      clearTranscript();
    }

    if (!speechSupported) {
      setStatusText('Speech not supported');
      return;
    }

    setIsActive(true);
    setResponseText('');
    startListening();
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 200, 200, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 200, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Main HUD Container */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/30",
          "transition-all duration-1000",
          (isListening || isSpeaking || isProcessing) && "animate-spin-slow",
          hasError && "border-red-500/30"
        )} style={{
          width: '480px',
          height: '480px',
          left: '-30px',
          top: '-30px',
        }}>
          {/* Ring markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-4",
                hasError ? "bg-red-500/50" : "bg-primary/50"
              )}
              style={{
                left: '50%',
                top: '0',
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
                transformOrigin: '50% 240px',
              }}
            />
          ))}
        </div>

        {/* Middle ring */}
        <div className={cn(
          "absolute rounded-full border border-cyan-500/40",
          "transition-all duration-500",
          (isListening || isSpeaking) && "border-cyan-400/60",
          hasError && "border-red-500/40"
        )} style={{
          width: '440px',
          height: '440px',
          left: '-10px',
          top: '-10px',
        }} />

        {/* Main circle - clickable */}
        <button
          onClick={handleActivate}
          disabled={isProcessing}
          className={cn(
            "relative w-[420px] h-[420px] rounded-full",
            "bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90",
            "border-2 transition-all duration-300",
            "flex flex-col items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "group cursor-pointer",
            isListening && "border-cyan-400 shadow-[0_0_60px_rgba(0,200,200,0.4)]",
            isSpeaking && "border-primary shadow-[0_0_60px_rgba(0,200,200,0.3)]",
            isProcessing && "border-yellow-500/50",
            hasError && "border-red-500/50 shadow-[0_0_40px_rgba(255,0,0,0.2)]",
            !isListening && !isSpeaking && !isProcessing && !hasError && "border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(0,200,200,0.2)]"
          )}
        >
          {/* Hexagon pattern background */}
          <div className="absolute inset-8 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <pattern id="hexagons" width="10" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                  <polygon 
                    points="5,0 10,2.89 10,8.66 5,11.55 0,8.66 0,2.89" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="0.3"
                    className={hasError ? "text-red-500" : "text-cyan-500"}
                  />
                </pattern>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#hexagons)" />
            </svg>
          </div>

          {/* Inner glow ring */}
          <div className={cn(
            "absolute inset-12 rounded-full border transition-all duration-300",
            isListening && "border-cyan-400/60 shadow-[inset_0_0_30px_rgba(0,200,200,0.2)]",
            isSpeaking && "border-primary/60 shadow-[inset_0_0_30px_rgba(0,200,200,0.15)]",
            hasError && "border-red-500/40 shadow-[inset_0_0_30px_rgba(255,0,0,0.1)]",
            !isListening && !isSpeaking && !hasError && "border-cyan-500/20"
          )} />

          {/* Center content */}
          <div className="relative z-10 text-center px-8">
            {/* AKIOR Logo Text */}
            <h1 className={cn(
              "text-5xl font-bold tracking-[0.3em] mb-2 transition-all duration-300",
              "bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_10px_rgba(0,200,200,0.5)]",
              (isListening || isSpeaking) && "drop-shadow-[0_0_20px_rgba(0,200,200,0.8)]",
              hasError && "from-red-300 via-white to-red-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
            )}>
              {agentSettings.agent_name.toUpperCase()}
            </h1>
            
            {/* Subtitle */}
            <p className={cn(
              "text-xs tracking-[0.2em] uppercase mb-6",
              hasError ? "text-red-400/80" : "text-cyan-400/80"
            )}>
              {hasError ? 'Connection Issue' : 'Advanced Knowledge Intelligence Operating Resource'}
            </p>

            {/* Status indicator */}
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm transition-all duration-300",
              isListening && "text-cyan-300",
              isSpeaking && "text-primary",
              isProcessing && "text-yellow-400",
              hasError && "text-red-400",
              !isListening && !isSpeaking && !isProcessing && !hasError && "text-muted-foreground"
            )}>
              {hasError ? (
                <AlertCircle className="w-5 h-5" />
              ) : isListening ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : isSpeaking ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
              <span className="uppercase tracking-wider">{statusText}</span>
            </div>

            {/* Error message */}
            {hasError && speechError && (
              <p className="mt-4 text-xs text-red-400/80 max-w-[250px]">
                {speechError}
              </p>
            )}

            {/* Transcript display */}
            {transcript && isActive && !hasError && (
              <p className="mt-4 text-sm text-cyan-300/80 max-w-[250px] truncate">
                &quot;{transcript}&quot;
              </p>
            )}
          </div>

          {/* Animated pulse rings when active */}
          {(isListening || isSpeaking) && (
            <>
              <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping-slow" />
              <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-ping-slower" />
            </>
          )}
        </button>

        {/* Corner decorations */}
        <div className={cn(
          "absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2",
          hasError ? "border-red-500/50" : "border-cyan-500/50"
        )} />
        <div className={cn(
          "absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2",
          hasError ? "border-red-500/50" : "border-cyan-500/50"
        )} />
        <div className={cn(
          "absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2",
          hasError ? "border-red-500/50" : "border-cyan-500/50"
        )} />
        <div className={cn(
          "absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2",
          hasError ? "border-red-500/50" : "border-cyan-500/50"
        )} />
      </div>

      {/* Response text below HUD */}
      {responseText && (
        <div className="mt-8 max-w-lg text-center px-6 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {responseText}
          </p>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={cn(
            "w-2 h-2 rounded-full",
            hasError ? "bg-red-500" : speechSupported ? "bg-green-500" : "bg-red-500"
          )} />
          Voice {hasError ? 'Error' : speechSupported ? 'Ready' : 'Unavailable'}
        </span>
        <span className="text-border">|</span>
        <span>Press ESC to exit</span>
      </div>
    </div>
  );
}