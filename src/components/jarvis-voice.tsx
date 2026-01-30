'use client';

/**
 * AKIOR Voice Interface - Enterprise Grade
 * Push-to-talk voice input with OpenAI TTS output
 * Full conversation persistence
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  AlertCircle,
  Loader2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useOpenAITTS, OPENAI_VOICES, OpenAIVoice } from '@/hooks/use-openai-tts';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentSettings {
  agent_name: string;
  voice_id: string;
  voice_speed: number;
}

export function AkiorVoice() {
  const { user, session } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agent_name: 'AKIOR',
    voice_id: 'alloy',
    voice_speed: 1.0,
  });

  const {
    status: recognitionStatus,
    transcript: voiceTranscript,
    isSupported: sttSupported,
    error: sttError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    isLoading: isTTSLoading,
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
        setVoice((data.voice_id as OpenAIVoice) || 'alloy');
        setSpeed(data.voice_speed || 1.0);
      }
    };

    loadSettings();
  }, [user, setVoice, setSpeed]);

  // Sync voice transcript
  useEffect(() => {
    if (voiceTranscript) {
      setTranscript(voiceTranscript.replace(/\s*\[.*\]$/, ''));
    }
  }, [voiceTranscript]);

  const sendMessage = useCallback(async () => {
    const message = transcript.trim();
    if (!message || isSending) return;

    setIsSending(true);
    setApiError(null);
    stopSpeaking();

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: currentConversationId,
          channel: 'voice',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || 'No response received.';

      // Update conversation ID
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTranscript('');
      clearTranscript();

      // Speak response if enabled
      if (speakEnabled) {
        speak(reply);
      }
    } catch (err) {
      console.error('Chat API error:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [transcript, isSending, messages, currentConversationId, clearTranscript, stopSpeaking, speakEnabled, speak, getAuthHeaders]);

  const handlePushToTalk = useCallback(() => {
    if (recognitionStatus === 'listening') {
      stopListening();
    } else {
      setTranscript('');
      clearTranscript();
      startListening();
    }
  }, [recognitionStatus, startListening, stopListening, clearTranscript]);

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setTranscript('');
    clearTranscript();
    stopSpeaking();
  };

  const isListening = recognitionStatus === 'listening';
  const latestResponse = messages.filter((m) => m.role === 'assistant').slice(-1)[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{agentSettings.agent_name} (Voice)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Voice assistant with OpenAI TTS • {OPENAI_VOICES.find((v) => v.id === agentSettings.voice_id)?.name || 'Alloy'} voice
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className={cn(showHistory && 'bg-secondary')}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNewConversation}>
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* History panel */}
        {showHistory && messages.length > 0 && (
          <div className="w-80 border-r border-border bg-muted/20">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-medium">Conversation History</h3>
              <p className="text-xs text-muted-foreground">{messages.length} messages</p>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-3 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn('p-2 rounded-lg text-xs', msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-secondary/50 mr-4')}
                  >
                    <p className="font-medium text-[10px] uppercase text-muted-foreground mb-1">
                      {msg.role === 'user' ? 'You' : agentSettings.agent_name}
                    </p>
                    <p className="line-clamp-3">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Voice interface */}
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Warnings */}
          {!sttSupported && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-500">Voice Input Unavailable</p>
                <p className="text-xs text-muted-foreground mt-1">Speech recognition is not supported. Please use Chrome or Edge.</p>
              </div>
            </div>
          )}

          {(sttError || apiError) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{sttError || apiError}</p>
            </div>
          )}

          {/* Push-to-talk button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              variant={isListening ? 'default' : 'outline'}
              onClick={handlePushToTalk}
              disabled={!sttSupported || isSending}
              className={cn(
                'w-28 h-28 rounded-full transition-all duration-300',
                isListening ? 'bg-primary hover:bg-primary/90 akior-glow' : 'border-2 border-border hover:border-primary/50 hover:bg-primary/5',
                !sttSupported && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 text-muted-foreground" />}
            </Button>

            <div className="text-center">
              <p className={cn('text-sm font-medium', isListening ? 'text-primary' : 'text-muted-foreground')}>
                {isListening ? 'Listening... Click to stop' : 'Click to speak'}
              </p>
            </div>
          </div>

          {/* Transcript input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Your Message</Label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Speak or type your message here..."
              className="min-h-[100px] bg-muted/30 border-border focus:border-primary/50 resize-none text-sm"
              disabled={isSending}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTranscript('');
                  clearTranscript();
                }}
                disabled={!transcript || isSending}
                className="text-muted-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={sendMessage} disabled={!transcript.trim() || isSending} className="bg-primary hover:bg-primary/90">
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>

          {/* Response display */}
          {latestResponse && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">{agentSettings.agent_name} Response</Label>
                <div className="flex items-center gap-3">
                  {(isSpeaking || isTTSLoading) && (
                    <Button variant="ghost" size="sm" onClick={stopSpeaking} className="text-muted-foreground text-xs">
                      {isTTSLoading ? 'Loading...' : 'Stop'}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch id="speak-toggle" checked={speakEnabled} onCheckedChange={setSpeakEnabled} />
                    <Label htmlFor="speak-toggle" className="text-xs cursor-pointer flex items-center gap-1">
                      {speakEnabled ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
                      Auto-speak
                    </Label>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'p-4 rounded-lg bg-secondary/50 border border-border',
                  'text-sm whitespace-pre-wrap leading-relaxed',
                  (isSpeaking || isTTSLoading) && 'border-primary/30 akior-glow'
                )}
              >
                {latestResponse.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}