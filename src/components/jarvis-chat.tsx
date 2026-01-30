'use client';

/**
 * AKIOR Chat Interface - Enterprise Grade
 * Full conversation management with persistence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useOpenAITTS, OpenAIVoice } from '@/hooks/use-openai-tts';
import { supabase } from '@/integrations/supabase/client';
import { ConversationSidebar } from './conversation-sidebar';
import { cn } from '@/lib/utils';
import { RagStatusBadge } from '@/components/rag-status-badge';
import { RagOffHint } from '@/components/rag-off-hint';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentSettings {
  agent_name: string;
  voice_id: string;
  voice_speed: number;
}

export function AkiorChat() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    agent_name: 'AKIOR',
    voice_id: 'alloy',
    voice_speed: 1.0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Load conversation messages
  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!user || !session?.access_token) return;

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(
            (data.messages || []).map((m: { id: string; role: string; content: string; created_at: string }) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
      }
    },
    [user, session, getAuthHeaders]
  );

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (id: string | null) => {
      setCurrentConversationId(id);
      if (id) {
        loadConversation(id);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I'm ${agentSettings.agent_name}. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    },
    [loadConversation, agentSettings.agent_name]
  );

  // Start new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm ${agentSettings.agent_name}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
    stopSpeaking();
  }, [agentSettings.agent_name, stopSpeaking]);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm ${agentSettings.agent_name}. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [agentSettings.agent_name, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    stopSpeaking();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: currentConversationId,
          channel: 'chat',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'API error');
      }

      const data = await res.json();
      const reply = data.reply || 'No response received.';

      // Update conversation ID if new conversation was created
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak response if enabled
      if (speakEnabled) {
        speak(reply);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Sorry, there was an error processing your request.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, currentConversationId, speakEnabled, speak, stopSpeaking, getAuthHeaders]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation Sidebar - hide on mobile by default */}
      <div className={cn(
        "hidden lg:block",
        sidebarCollapsed && "lg:hidden"
      )}>
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - mobile optimized */}
        <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold truncate">Chat with {agentSettings.agent_name}</h2>
              <RagStatusBadge token={session?.access_token} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Citations + governed retrieval • Memory + conversations preserved
            </p>
            <RagOffHint token={session?.access_token} />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* TTS Toggle - compact on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Switch
                id="chat-speak-toggle"
                checked={speakEnabled}
                onCheckedChange={(checked) => {
                  setSpeakEnabled(checked);
                  if (!checked) stopSpeaking();
                }}
              />
              <Label htmlFor="chat-speak-toggle" className="text-[10px] sm:text-xs cursor-pointer flex items-center gap-1">
                {speakEnabled ? (
                  <Volume2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
                ) : (
                  <VolumeX className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground" />
                )}
                <span className="hidden sm:inline">TTS</span>
              </Label>
            </div>
          </div>
        </div>

        {/* Messages area - optimized padding for mobile */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className="space-y-1">
                {/* Label */}
                <div
                  className={cn(
                    'text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider',
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}
                >
                  {msg.role === 'user' ? 'YOU' : agentSettings.agent_name.toUpperCase()}
                </div>

                {/* Message bubble - better mobile sizing */}
                <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    msg.role === 'user' ? 'akior-bubble-user' : 'akior-bubble-assistant',
                    'max-w-[90%] sm:max-w-[80%]'
                  )}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isLoading && (
              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{agentSettings.agent_name.toUpperCase()}</div>
                <div className="akior-thinking">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-xs sm:text-sm">Thinking...</span>
                </div>
              </div>
            )}

            {/* Speaking indicator */}
            {(isSpeaking || isTTSLoading) && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={stopSpeaking} className="text-xs">
                  <Volume2 className="w-3 h-3 mr-1.5 animate-pulse" />
                  {isTTSLoading ? 'Loading audio...' : 'Speaking... Click to stop'}
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - mobile optimized */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2 sm:gap-3 bg-muted/30 rounded-xl border border-border p-2 sm:p-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${agentSettings.agent_name} anything...`}
                className={cn(
                  'flex-1 bg-transparent border-0 resize-none',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-0',
                  'min-h-[24px] max-h-[120px]'
                )}
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 h-9 sm:h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}