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
  AlertTriangle
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
}

export function AkiorSettings() {
  const { user, signOut, error: authError, clearError } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Load memories
  const loadMemories = useCallback(async () => {
    if (!user) return;

    setIsLoadingMemories(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('id, content, memory_type, importance, created_at')
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
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your AKIOR assistant
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-muted-foreground"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Sign Out
        </Button>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-8">
          {/* Agent Settings */}
          <AgentSettingsPanel />

          {/* Memory Management */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
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
                  className="text-muted-foreground"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingMemories ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {memories.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{memory.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-xs ${getImportanceColor(memory.importance)}`}>
                            Importance: {memory.importance}/10
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMemory(memory.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                  <p className="text-sm">{user?.email}</p>
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

          {/* System Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              System Information
            </h3>
            
            <div className="akior-card">
              <div className="grid grid-cols-2 gap-4 text-sm">
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