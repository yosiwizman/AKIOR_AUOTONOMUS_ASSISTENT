'use client';

/**
 * Public Ask Page
 * Allows anyone to ask questions using the public knowledge base
 */

import { useState } from 'react';
import { PublicChat } from '@/components/public-chat';
import { ConversationHistory } from '@/components/conversation-history';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AskPage() {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <PublicChat />
        
        {/* Mobile History Toggle Button */}
        {user && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-20 right-4 md:hidden z-50 h-12 w-12 rounded-full shadow-lg"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? (
              <X className="w-5 h-5" />
            ) : (
              <History className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>

      {/* Conversation History Sidebar - Desktop */}
      {user && (
        <>
          <div className="hidden md:block w-80 border-l border-border bg-card">
            <ConversationHistory />
          </div>

          {/* Conversation History Sidebar - Mobile */}
          <div
            className={cn(
              "fixed inset-0 z-40 md:hidden bg-background transition-transform duration-300",
              showHistory ? "translate-x-0" : "translate-x-full"
            )}
          >
            <ConversationHistory />
          </div>

          {/* Overlay for mobile */}
          {showHistory && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setShowHistory(false)}
            />
          )}
        </>
      )}
    </div>
  );
}