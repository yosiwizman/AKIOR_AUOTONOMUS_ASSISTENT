'use client';

/**
 * Knowledge Base Management
 * Upload and manage documents for RAG
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Loader2,
  Search,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
  has_embedding: boolean;
}

export function KnowledgeBase() {
  const { user } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Load knowledge base items
  const loadItems = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content, content_type, created_at, embedding')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data?.map(item => ({
        ...item,
        has_embedding: item.embedding !== null
      })) || []);
    } catch (err) {
      console.error('Error loading knowledge base:', err);
      toast.error('Failed to load knowledge base');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Add new knowledge item
  const handleAdd = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;

    setIsAdding(true);
    try {
      // First, insert the document
      const { data: insertedDoc, error: insertError } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim(),
          content_type: 'text',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Then, generate embedding via API
      setIsProcessing(true);
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: insertedDoc.id,
          content: newContent.trim(),
        }),
      });

      if (!response.ok) {
        console.warn('Embedding generation failed, document saved without embedding');
      }

      toast.success('Knowledge added successfully');
      setNewTitle('');
      setNewContent('');
      setDialogOpen(false);
      loadItems();
    } catch (err) {
      console.error('Error adding knowledge:', err);
      toast.error('Failed to add knowledge');
    } finally {
      setIsAdding(false);
      setIsProcessing(false);
    }
  };

  // Delete knowledge item
  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Knowledge deleted');
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting knowledge:', err);
      toast.error('Failed to delete knowledge');
    }
  };

  // Filter items by search
  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Knowledge Base
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Teach AKIOR by adding documents and information
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Knowledge</DialogTitle>
                <DialogDescription>
                  Add information that AKIOR can use to answer your questions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Company Policies, Project Notes..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste or type the information here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[200px] bg-muted/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={isAdding || !newTitle.trim() || !newContent.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isProcessing ? 'Processing...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Add Knowledge
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No matching documents found' : 'No knowledge added yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Click "Add Knowledge" to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="akior-card group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-medium truncate">{item.title}</h3>
                      {!item.has_embedding && (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          No embedding
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {item.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-6 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {items.length} document{items.length !== 1 ? 's' : ''} in knowledge base
          {items.filter(i => i.has_embedding).length < items.length && (
            <span className="text-orange-500 ml-2">
              • {items.length - items.filter(i => i.has_embedding).length} pending embedding
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
