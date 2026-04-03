'use client';

/**
 * AKIOR Voice Console - Main Component
 * 
 * A push-to-talk voice interface with:
 * - Speech recognition (Web Speech API)
 * - Text input fallback
 * - Response display with TTS
 * - Conversation history
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeechRecognition, RecognitionStatus } from '@/hooks/use-speech-recognition';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { cn } from '@/lib/utils';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Status indicator component
function StatusIndicator({ status }: { status: RecognitionStatus | 'sending' }) {
  const statusConfig = {
    idle: { label: 'Ready', color: 'bg-cyan-500', pulse: false },
    listening: { label: 'Listening...', color: 'bg-emerald-500', pulse: true },
    processing: { label: 'Processing...', color: 'bg-amber-500', pulse: true },
    sending: { label: 'Sending...', color: 'bg-amber-500', pulse: true },
    error: { label: 'Error', color: 'bg-red-500', pulse: false },
    unsupported: { label: 'Voice Unavailable', color: 'bg-orange-500', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-3 h-3 rounded-full',
        config.color,
        config.pulse && 'akior-pulse'
      )} />
      <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
        {config.label}
      </span>
    </div>
  );
}

// History panel component
function HistoryPanel({ 
  history, 
  onClear 
}: { 
  history: Message[]; 
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <History className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No conversation history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">History ({history.length} turns)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-xl p-4',
                msg.role === 'user' 
                  ? 'bg-primary/10 border border-primary/20 ml-8' 
                  : 'bg-muted/50 border border-border mr-8'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'text-xs font-mono uppercase tracking-wider',
                  msg.role === 'user' ? 'text-primary' : 'text-accent'
                )}>
                  {msg.role === 'user' ? 'You' : 'AKIOR'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Main Voice Console component
export function VoiceConsole() {
  // State
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Hooks
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
    isSupported: ttsSupported,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  // Sync voice transcript to editable transcript
  useEffect(() => {
    if (voiceTranscript) {
      setTranscript(voiceTranscript.replace(/\s*\[.*\]$/, ''));
    }
  }, [voiceTranscript]);

  // Speak response when enabled and response changes
  useEffect(() => {
    if (speakEnabled && response && ttsSupported) {
      speak(response);
    }
  }, [response, speakEnabled, ttsSupported, speak]);

  // Send message to API
  const sendMessage = useCallback(async () => {
    const message = transcript.trim();
    if (!message || isSending) return;

    setIsSending(true);
    setApiError(null);
    stopSpeaking();

    // Add user message to history
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || 'No response received.';

      // Add assistant message to history
      const assistantMessage: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      // Update history (keep last 20 turns = 40 messages)
      setHistory(prev => [...prev, userMessage, assistantMessage].slice(-40));
      setResponse(reply);
      setTranscript('');
      clearTranscript();
    } catch (err) {
      console.error('Chat API error:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [transcript, isSending, history, clearTranscript, stopSpeaking]);

  // Handle push-to-talk
  const handlePushToTalk = useCallback(() => {
    if (recognitionStatus === 'listening') {
      stopListening();
    } else {
      setTranscript('');
      clearTranscript();
      startListening();
    }
  }, [recognitionStatus, startListening, stopListening, clearTranscript]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setResponse('');
  }, []);

  // Determine overall status
  const displayStatus = isSending ? 'sending' : recognitionStatus;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center akior-glow">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">AKIOR Voice Console</h1>
              <p className="text-xs text-muted-foreground">Push-to-talk AI Interface</p>
            </div>
          </div>
          <StatusIndicator status={displayStatus} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_350px] gap-6 h-full">
          {/* Left panel - Input/Output */}
          <div className="flex flex-col gap-6">
            {/* Warnings */}
            {!sttSupported && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-500">Voice Input Unavailable</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Speech recognition is not supported in this browser. Please use Chrome or Edge, or use text input below.
                  </p>
                </div>
              </div>
            )}

            {(sttError || apiError) && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-xs text-muted-foreground mt-1">{sttError || apiError}</p>
                </div>
              </div>
            )}

            {/* Push-to-talk button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                variant={recognitionStatus === 'listening' ? 'default' : 'outline'}
                onClick={handlePushToTalk}
                disabled={!sttSupported || isSending}
                className={cn(
                  'w-32 h-32 rounded-full transition-all duration-300',
                  recognitionStatus === 'listening' 
                    ? 'akior-glow-listening bg-emerald-600 hover:bg-emerald-700 border-emerald-500' 
                    : 'akior-glow hover:bg-primary/10',
                  !sttSupported && 'opacity-50 cursor-not-allowed'
                )}
              >
                {recognitionStatus === 'listening' ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {sttSupported 
                ? (recognitionStatus === 'listening' ? 'Click to stop' : 'Click to speak')
                : 'Use text input below'
              }
            </p>

            {/* Transcript input */}
            <div className="space-y-2">
              <Label htmlFor="transcript" className="text-sm font-medium">
                Your Message
              </Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Speak or type your message here..."
                className="min-h-[100px] bg-muted/30 border-border focus:border-primary resize-none font-mono text-sm"
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
                <Button
                  onClick={sendMessage}
                  disabled={!transcript.trim() || isSending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>

            {/* Response display */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">AKIOR Response</Label>
                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopSpeaking}
                      className="text-muted-foreground"
                    >
                      Stop
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="speak-toggle"
                      checked={speakEnabled}
                      onCheckedChange={setSpeakEnabled}
                      disabled={!ttsSupported}
                    />
                    <Label 
                      htmlFor="speak-toggle" 
                      className={cn(
                        "text-sm cursor-pointer flex items-center gap-1",
                        !ttsSupported && "opacity-50"
                      )}
                    >
                      {speakEnabled ? (
                        <Volume2 className="w-4 h-4 text-accent" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      )}
                      Speak
                    </Label>
                  </div>
                </div>
              </div>
              <div className={cn(
                'min-h-[200px] p-4 rounded-xl bg-muted/30 border border-border',
                'font-mono text-sm whitespace-pre-wrap leading-relaxed',
                isSpeaking && 'border-accent/50 akior-glow'
              )}>
                {response || (
                  <span className="text-muted-foreground italic">
                    Response will appear here...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right panel - History */}
          <div className="bg-card/50 rounded-2xl border border-border overflow-hidden h-[600px] lg:h-auto">
            <HistoryPanel history={history} onClear={handleClearHistory} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>AKIOR Voice Console v1.0</span>
          <span>
            STT: {sttSupported ? '✓' : '✗'} | TTS: {ttsSupported ? '✓' : '✗'}
          </span>
        </div>
      </footer>
    </div>
  );
}
