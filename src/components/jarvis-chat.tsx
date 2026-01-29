'use client';

/**
 * Jarvis Chat Interface
 * Matches the chat design from the reference images
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JarvisChatProps {
  onClearConversation?: () => void;
}

// Thinking indicator component
function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">JARVIS</span>
    </div>
  );
}

export function JarvisChat({ onClearConversation }: JarvisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleClear = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
    }]);
    onClearConversation?.();
  }, [onClearConversation]);

  const sendMessage = useCallback(async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || 'No response received.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage].slice(-40));
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Text Chat with Function Calling</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Using gpt-5 • reasoning: low • verbosity: medium
          </p>
          <p className="text-xs text-primary mt-1">
            ✓ Function calling enabled - I can create images, generate 3D models, navigate pages, and more!
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear conversation
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              {/* Label */}
              <div className={cn(
                'text-xs text-muted-foreground uppercase tracking-wider',
                msg.role === 'user' ? 'text-right' : 'text-left'
              )}>
                {msg.role === 'user' ? 'YOU' : 'JARVIS'}
              </div>
              
              {/* Message bubble */}
              <div className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <div className={cn(
                  msg.role === 'user' 
                    ? 'jarvis-bubble-user' 
                    : 'jarvis-bubble-assistant'
                )}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                JARVIS
              </div>
              <div className="jarvis-thinking">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" style={{ animationDelay: '400ms' }} />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-muted/30 rounded-xl border border-border p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to create images, generate 3D models, or anything else... (Shift + Enter for a new line)"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
