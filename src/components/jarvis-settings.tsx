'use client';

/**
 * AKIOR Settings View
 * Enterprise-grade configuration with memory management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Trash2, 
  Brain,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User,
  Bot as BotIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { AgentSettingsPanel } from './agent-settings';
import { MemoryListSkeleton } from './loading-skeleton';
import { toast } from 'sonner';

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: string;
  conversation_id?: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConversationDetails {
  id: string;
  title: string;
  messages: Message[];
}

export function AkiorSettings() {
  const { user, signOut, error: authError, clearError } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const [conversationDetails, setConversationDetails] = useState<Record<string, ConversationDetails>>({});
  const [loadingConversations, setLoadingConversations] = useState<Record<string, boolean>>({});

  // Load memories
  const loadMemories = useCallback(async () => {
    if (!user) return;

    setIsLoadingMemories(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('id, content, memory_type, importance, created_at, conversation_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMemories(data || []);
    } catch (err) {
      console.error('Error loading memories:', err);
      toast.error('Failed to load memories');
    } finally {
      setIsLoadingMemories(false);
    }
  }, [user]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);
      clearError();
    }
  }, [authError, clearError]);

  // Load conversation details for a memory
  const loadConversationDetails = async (memoryId: string, conversationId: string) => {
    if (conversationDetails[memoryId]) return; // Already loaded

    setLoadingConversations(prev => ({ ...prev, [memoryId]: true }));
    try {
      // Get conversation info
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get all messages from this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      setConversationDetails(prev => ({
        ...prev,
        [memoryId]: {
          id: conversation.id,
          title: conversation.title,
          messages: messages || []
        }
      }));
    } catch (err) {
      console.error('Error loading conversation details:', err);
      toast.error('Failed to load conversation details');
    } finally {
      setLoadingConversations(prev => ({ ...prev, [memoryId]: false }));
    }
  };

  // Toggle memory expansion
  const toggleMemoryExpansion = async (memoryId: string, conversationId?: string) => {
    if (expandedMemoryId === memoryId) {
      setExpandedMemoryId(null);
    } else {
      setExpandedMemoryId(memoryId);
      if (conversationId && !conversationDetails[memoryId]) {
        await loadConversationDetails(memoryId, conversationId);
      }
    }
  };

  // Delete a memory
  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMemories(prev => prev.filter(m => m.id !== id));
      toast.success('Memory deleted');
    } catch (err) {
      console.error('Error deleting memory:', err);
      toast.error('Failed to delete memory');
    }
  };

  // Clear all memories
  const clearAllMemories = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMemories([]);
      toast.success('All memories cleared');
    } catch (err) {
      console.error('Error clearing memories:', err);
      toast.error('Failed to clear memories');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  // Get importance color
  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-green-500';
    if (importance >= 5) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - mobile optimized */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold">Settings</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
            Configure your AKIOR assistant
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-muted-foreground shrink-0 text-xs sm:text-sm"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      {/* Settings content - mobile optimized */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl space-y-6 sm:space-y-8">
          {/* Agent Settings */}
          <AgentSettingsPanel />

          {/* Memory Management */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Memory ({memories.length})
              </h3>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMemories}
                  disabled={isLoadingMemories}
                  className="text-muted-foreground text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-4 h-4 sm:mr-2 ${isLoadingMemories ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                
                {memories.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive text-xs sm:text-sm">
                        <Trash2 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Clear All</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Clear all memories?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {memories.length} memories AKIOR has learned about you. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllMemories} className="bg-destructive hover:bg-destructive/90">
                          Clear All Memories
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            
            <div className="akior-card">
              {isLoadingMemories ? (
                <MemoryListSkeleton />
              ) : memories.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No memories yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AKIOR will learn and remember things about you as you chat
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="rounded-lg bg-muted/30 overflow-hidden"
                    >
                      {/* Memory Header */}
                      <div
                        className="flex items-start justify-between gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleMemoryExpansion(memory.id, memory.conversation_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm break-words">{memory.content}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {new Date(memory.created_at).toLocaleDateString()}
                            </span>
                            <span className={`text-xs ${getImportanceColor(memory.importance)}`}>
                              Importance: {memory.importance}/10
                            </span>
                            {memory.conversation_id && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                Has conversation
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {memory.conversation_id && (
                            <button
                              className="p-1 hover:bg-muted rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMemoryExpansion(memory.id, memory.conversation_id);
                              }}
                            >
                              {expandedMemoryId === memory.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMemory(memory.id);
                            }}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Conversation Details */}
                      {expandedMemoryId === memory.id && memory.conversation_id && (
                        <div className="border-t border-border bg-background/50">
                          {loadingConversations[memory.id] ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          ) : conversationDetails[memory.id] ? (
                            <div className="p-4 space-y-4">
                              {/* Conversation Title */}
                              <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold">
                                  {conversationDetails[memory.id].title}
                                </h4>
                              </div>

                              {/* Messages */}
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {conversationDetails[memory.id].messages.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">
                                    No messages found
                                  </p>
                                ) : (
                                  conversationDetails[memory.id].messages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`flex gap-2 max-w-[85%] ${
                                          msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                        }`}
                                      >
                                        {/* Avatar */}
                                        <div
                                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                                            msg.role === 'user'
                                              ? 'bg-primary/20'
                                              : 'bg-muted'
                                          }`}
                                        >
                                          {msg.role === 'user' ? (
                                            <User className="w-4 h-4 text-primary" />
                                          ) : (
                                            <BotIcon className="w-4 h-4 text-muted-foreground" />
                                          )}
                                        </div>

                                        {/* Message Content */}
                                        <div
                                          className={`rounded-lg px-3 py-2 ${
                                            msg.role === 'user'
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-muted'
                                          }`}
                                        >
                                          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
                                            {msg.role === 'user' ? 'You' : 'AKIOR'}
                                          </div>
                                          <p className="text-xs whitespace-pre-wrap break-words">
                                            {msg.content}
                                          </p>
                                          <div className="text-[10px] opacity-60 mt-1">
                                            {new Date(msg.created_at).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              Failed to load conversation
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Account Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Account
            </h3>
            
            <div className="akior-card">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm break-all">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <p className="text-xs font-mono text-muted-foreground break-all">{user?.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                  <p className="text-sm">
                    {user?.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* System Info - responsive grid */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              System Information
            </h3>
            
            <div className="akior-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 text-foreground">2.0.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="ml-2 text-foreground">Next.js 15</span>
                </div>
                <div>
                  <span className="text-muted-foreground">LLM:</span>
                  <span className="ml-2 text-foreground">GPT-4o-mini</span>
                </div>
                <div>
                  <span className="text-muted-foreground">TTS:</span>
                  <span className="ml-2 text-foreground">OpenAI TTS-1</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Embeddings:</span>
                  <span className="ml-2 text-foreground">text-embedding-3-small</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Database:</span>
                  <span className="ml-2 text-foreground">Supabase + pgvector</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
