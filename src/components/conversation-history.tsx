'use client';

/**
 * Conversation History Component
 * Shows all user conversations with expandable message history
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  User,
  Bot as BotIcon,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export function ConversationHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedConversations, setExpandedConversations] = useState<Record<string, ConversationWithMessages>>({});
  const [loadingConversations, setLoadingConversations] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get message counts for each conversation
      const conversationsWithCounts = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            message_count: count || 0
          };
        })
      );

      setConversations(conversationsWithCounts);
    } catch (err) {
      console.error('Error loading conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId: string) => {
    if (expandedConversations[conversationId]) return; // Already loaded

    setLoadingConversations(prev => ({ ...prev, [conversationId]: true }));
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setExpandedConversations(prev => ({
          ...prev,
          [conversationId]: {
            ...conversation,
            messages: messages || []
          }
        }));
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setLoadingConversations(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  // Toggle conversation expansion
  const toggleConversation = async (conversationId: string) => {
    if (expandedId === conversationId) {
      setExpandedId(null);
    } else {
      setExpandedId(conversationId);
      if (!expandedConversations[conversationId]) {
        await loadConversationMessages(conversationId);
      }
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete messages first (cascade should handle this, but being explicit)
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setExpandedConversations(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[conversationId];
        return newExpanded;
      });
      
      if (expandedId === conversationId) {
        setExpandedId(null);
      }

      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Sign in to view your conversation history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Conversation History</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'Start chatting to create your first conversation'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Conversation Header */}
                <div
                  className="flex items-start justify-between gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(conversation.updated_at)}</span>
                      <span>•</span>
                      <MessageSquare className="w-3 h-3" />
                      <span>{conversation.message_count || 0} messages</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleConversation(conversation.id);
                      }}
                    >
                      {expandedId === conversation.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this conversation and all its messages. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConversation(conversation.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Expanded Messages */}
                {expandedId === conversation.id && (
                  <div className="border-t border-border bg-muted/20">
                    {loadingConversations[conversation.id] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : expandedConversations[conversation.id] ? (
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {expandedConversations[conversation.id].messages.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No messages found
                          </p>
                        ) : (
                          expandedConversations[conversation.id].messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-3",
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  "flex gap-2 max-w-[85%]",
                                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}
                              >
                                {/* Avatar */}
                                <div
                                  className={cn(
                                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                                    msg.role === 'user' ? 'bg-primary/20' : 'bg-muted'
                                  )}
                                >
                                  {msg.role === 'user' ? (
                                    <User className="w-4 h-4 text-primary" />
                                  ) : (
                                    <BotIcon className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>

                                {/* Message Content */}
                                <div
                                  className={cn(
                                    "rounded-lg px-3 py-2",
                                    msg.role === 'user'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-card border border-border'
                                  )}
                                >
                                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
                                    {msg.role === 'user' ? 'You' : 'AKIOR'}
                                  </div>
                                  <p className="text-xs whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                  <div className="text-[10px] opacity-60 mt-1">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Failed to load messages
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}