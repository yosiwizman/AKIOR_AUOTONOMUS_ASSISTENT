'use client';

/**
 * Governed Knowledge Base (Admin)
 * - Upload with progress visualization
 * - Admin approval -> indexing
 * - Status + counts
 * - Real-time updates
 * - Delete & Edit capabilities
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BadgeInfo,
  X,
  Trash2,
  Edit2,
  RefreshCw,
  Info,
  Zap,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { useAuth } from '@/contexts/auth-context';
import { KnowledgeBaseSkeleton } from './loading-skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RagStatusBadge } from '@/components/rag-status-badge';
import { supabase } from '@/integrations/supabase/client';

type SourceStatus = 'pending' | 'approved' | 'rejected';
type Classification = 'public' | 'internal' | 'restricted';

type SourceRow = {
  id: string;
  title: string | null;
  status: SourceStatus;
  classification: Classification;
  trust_level: number;
  checksum: string;
  created_at: string;
  indexed_at: string | null;
  created_by?: string | null;
  document_size?: number;
};

type RagStatus = {
  sources_total: number;
  sources_approved: number;
  chunks_total: number;
  vectors_total: number;
  last_index_time: string | null;
  rag_state: 'OFF' | 'DEGRADED' | 'ON';
};

type UploadStage = 'idle' | 'uploading' | 'parsing' | 'complete' | 'error';

function statusPill(status: SourceStatus) {
  if (status === 'approved') return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/20';
  if (status === 'rejected') return 'bg-rose-500/15 text-rose-700 border-rose-500/20';
  return 'bg-amber-500/15 text-amber-800 border-amber-500/25';
}

function classificationPill(c: Classification) {
  if (c === 'public') return 'bg-sky-500/15 text-sky-800 border-sky-500/25';
  if (c === 'internal') return 'bg-indigo-500/15 text-indigo-800 border-indigo-500/25';
  return 'bg-fuchsia-500/15 text-fuchsia-800 border-fuchsia-500/25';
}

export function KnowledgeBase() {
  const { session } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [ragStatus, setRagStatus] = useState<RagStatus | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceRow | null>(null);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<Classification>('public');
  const [trustLevel, setTrustLevel] = useState('50');
  const [restrictToMe, setRestrictToMe] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Upload progress state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editClassification, setEditClassification] = useState<Classification>('public');
  const [editTrustLevel, setEditTrustLevel] = useState('50');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptimizationTips, setShowOptimizationTips] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session]);

  const load = useCallback(async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      const [sourcesRes, statusRes] = await Promise.all([
        fetch('/api/admin/kb/sources', { headers: authHeaders }),
        fetch('/api/rag/status', { headers: authHeaders }),
      ]);

      const sourcesJson = await sourcesRes.json().catch(() => ({}));
      const statusJson = await statusRes.json().catch(() => ({}));

      if (!sourcesRes.ok) throw new Error(sourcesJson.error || 'Failed to load sources');

      setSources((sourcesJson.sources || []) as SourceRow[]);
      setRole((sourcesJson.role as any) === 'admin' ? 'admin' : 'user');
      if (statusRes.ok) setRagStatus(statusJson.data as RagStatus);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, session]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!session?.access_token) return;

    load();

    // Subscribe to real-time changes on sources table
    const channel = supabase
      .channel('sources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sources',
        },
        (payload) => {
          console.log('[KB] Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSources((prev) => [payload.new as SourceRow, ...prev]);
            toast.success('New document added');
          } else if (payload.eventType === 'UPDATE') {
            setSources((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as SourceRow) : s))
            );
            if ((payload.new as any).status === 'approved') {
              toast.success('Document approved and indexed');
            }
          } else if (payload.eventType === 'DELETE') {
            setSources((prev) => prev.filter((s) => s.id !== payload.old.id));
            toast.info('Document deleted');
          }
          
          // Refresh RAG status after changes
          fetch('/api/rag/status', { headers: authHeaders })
            .then((res) => res.json())
            .then((json) => {
              if (json.data) setRagStatus(json.data as RagStatus);
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, session, authHeaders]);

  const filtered = sources.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = (s.title || '').toLowerCase();
    return title.includes(q) || s.checksum.toLowerCase().includes(q);
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    
    // Validate file size - increased to 50MB for better RAG capacity
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }
    
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const validExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Invalid file type. Please upload PDF, DOCX, TXT, or MD files.');
      return;
    }
    
    setUploadFile(file);
    setUploadError(null);
    setUploadStage('idle');
    setUploadProgress(0);
    toast.success(`File selected: ${file.name}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const simulateProgress = (stage: UploadStage, startProgress: number, endProgress: number, duration: number) => {
    const steps = 20;
    const increment = (endProgress - startProgress) / steps;
    const interval = duration / steps;
    
    let currentProgress = startProgress;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= endProgress) {
        setUploadProgress(endProgress);
        clearInterval(timer);
      } else {
        setUploadProgress(currentProgress);
      }
    }, interval);
    
    return timer;
  };

  const handleUpload = async () => {
    if (!session?.access_token || !uploadFile || isSubmitting) return;

    setIsSubmitting(true);
    setUploadError(null);
    setUploadStage('uploading');
    setUploadProgress(0);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Stage 1: Uploading (0-40%)
      const uploadTimer = simulateProgress('uploading', 0, 40, 1000);

      const form = new FormData();
      form.append('file', uploadFile);
      if (uploadTitle.trim()) form.append('title', uploadTitle.trim());
      form.append('classification', classification);
      form.append('trust_level', trustLevel);
      form.append('restricted_only_me', restrictToMe ? 'true' : 'false');

      const res = await fetch('/api/admin/kb/upload', {
        method: 'POST',
        headers: authHeaders,
        body: form,
        signal: abortControllerRef.current.signal,
      });

      clearInterval(uploadTimer);
      setUploadProgress(40);

      // Stage 2: Parsing (40-80%)
      setUploadStage('parsing');
      const parseTimer = simulateProgress('parsing', 40, 80, 1500);

      const json = await res.json().catch(() => ({}));
      
      clearInterval(parseTimer);
      setUploadProgress(80);

      if (!res.ok) throw new Error(json.error || 'Upload failed');

      // Stage 3: Complete (80-100%)
      setUploadStage('complete');
      simulateProgress('complete', 80, 100, 500);

      setTimeout(() => {
        toast.success('Document uploaded! Awaiting admin approval for indexing.');
        setUploadTitle('');
        setUploadFile(null);
        setClassification('public');
        setTrustLevel('50');
        setRestrictToMe(false);
        setUploadStage('idle');
        setUploadProgress(0);
        setDialogOpen(false);
        load();
      }, 500);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setUploadError('Upload cancelled');
        toast.error('Upload cancelled');
      } else {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      }
      setUploadStage('error');
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setUploadStage('idle');
    setUploadProgress(0);
    handleUpload();
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadFile(null);
    setUploadError(null);
    setUploadStage('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const approve = async (sourceId: string) => {
    if (!session?.access_token) return;

    setApprovingId(sourceId);
    try {
      const res = await fetch(`/api/admin/kb/${sourceId}/approve`, {
        method: 'POST',
        headers: authHeaders,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Approve failed');

      toast.success(`Approved and indexed (${json.indexed?.vectors || 0} vectors)`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!session?.access_token) return;

    setDeletingId(sourceId);
    try {
      const res = await fetch(`/api/admin/kb/${sourceId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Delete failed');

      toast.success('Document deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSource(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async () => {
    if (!session?.access_token || !selectedSource) return;

    setIsEditing(true);
    try {
      const res = await fetch(`/api/admin/kb/${selectedSource.id}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          classification: editClassification,
          trust_level: parseInt(editTrustLevel, 10),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Update failed');

      toast.success('Document updated successfully');
      setEditDialogOpen(false);
      setSelectedSource(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (source: SourceRow) => {
    setSelectedSource(source);
    setEditTitle(source.title || '');
    setEditClassification(source.classification);
    setEditTrustLevel(source.trust_level.toString());
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (source: SourceRow) => {
    setSelectedSource(source);
    setDeleteDialogOpen(true);
  };

  const formatDocumentSize = (size?: number) => {
    if (!size) return 'N/A';
    if (size < 1000) return `${size} chars`;
    if (size < 1000000) return `${(size / 1000).toFixed(1)}K chars`;
    return `${(size / 1000000).toFixed(2)}M chars`;
  };

  const getUploadStageLabel = () => {
    switch (uploadStage) {
      case 'uploading': return 'Uploading file...';
      case 'parsing': return 'Parsing document...';
      case 'complete': return 'Complete!';
      case 'error': return 'Upload failed';
      default: return '';
    }
  };

  const getUploadStageIcon = () => {
    switch (uploadStage) {
      case 'uploading': return <Upload className="w-4 h-4 animate-pulse" />;
      case 'parsing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'complete': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - mobile optimized */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Knowledge Base
              </h2>
              <RagStatusBadge token={session?.access_token} />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
              Admin-approved ingestion • ACL/classification filtered retrieval • Audited access • Real-time updates
            </p>

            {ragStatus && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="rounded-2xl border border-border bg-muted/25 px-2 sm:px-3 py-2">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Sources</p>
                  <p className="text-sm font-semibold">{ragStatus.sources_total}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/25 px-2 sm:px-3 py-2">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Approved</p>
                  <p className="text-sm font-semibold">{ragStatus.sources_approved}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/25 px-2 sm:px-3 py-2">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Chunks</p>
                  <p className="text-sm font-semibold">{ragStatus.chunks_total}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/25 px-2 sm:px-3 py-2">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Vectors</p>
                  <p className="text-sm font-semibold">{ragStatus.vectors_total}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/25 px-2 sm:px-3 py-2 col-span-2 sm:col-span-1">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Last index</p>
                  <p className="text-xs sm:text-sm font-semibold truncate">
                    {ragStatus.last_index_time ? new Date(ragStatus.last_index_time).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* RAG Optimization Tips */}
            <Collapsible open={showOptimizationTips} onOpenChange={setShowOptimizationTips} className="mt-3">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                  <Zap className="h-3 w-3 mr-2" />
                  {showOptimizationTips ? 'Hide' : 'Show'} RAG Optimization Tips
                  <Info className="h-3 w-3 ml-auto" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-2xl border border-border bg-muted/25 p-3 sm:p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Document Optimization
                    </h4>
                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Keep documents focused and well-structured</li>
                      <li>• Use clear headings and sections</li>
                      <li>• Optimal size: 5K-500K characters per document</li>
                      <li>• Max upload: 50MB per file</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Chunking Strategy
                    </h4>
                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Default: 1200 chars/chunk with 150 char overlap</li>
                      <li>• Max 200 chunks per document</li>
                      <li>• Each chunk becomes a searchable vector</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Memory & Performance
                    </h4>
                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Vectors: {ragStatus?.vectors_total || 0} indexed</li>
                      <li>• Each vector: ~1536 dimensions (OpenAI)</li>
                      <li>• Real-time updates via Supabase Realtime</li>
                      <li>• Automatic deduplication by checksum</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Best Practices
                    </h4>
                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Use 'public' classification for general knowledge</li>
                      <li>• Set trust level 80-100 for verified sources</li>
                      <li>• Approve documents promptly for RAG availability</li>
                      <li>• Delete outdated documents to maintain quality</li>
                      <li>• Edit metadata without re-uploading</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {role !== 'admin' && (
              <div className="mt-3 flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <BadgeInfo className="h-3 w-3 sm:h-4 sm:w-4 text-primary/70 shrink-0" />
                <span className="line-clamp-2">You can upload; admin approval is required to index and serve in RAG.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button 
              variant="outline" 
              className="rounded-xl text-xs sm:text-sm h-9 sm:h-10" 
              onClick={load} 
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 rounded-xl text-xs sm:text-sm h-9 sm:h-10" size="sm">
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload knowledge</DialogTitle>
                  <DialogDescription>
                    Upload a document. It will be parsed immediately, then must be admin-approved to be indexed.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-title">Title (optional)</Label>
                    <Input
                      id="upload-title"
                      placeholder="Defaults to filename"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-muted/50 rounded-xl"
                      maxLength={100}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Classification</Label>
                      <Select value={classification} onValueChange={(v) => setClassification(v as Classification)} disabled={isSubmitting}>
                        <SelectTrigger className="rounded-xl bg-muted/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Public is eligible for spokesman mode.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trust">Trust level</Label>
                      <Input
                        id="trust"
                        inputMode="numeric"
                        value={trustLevel}
                        onChange={(e) => setTrustLevel(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                        className="rounded-xl bg-muted/40"
                        placeholder="0-100"
                        disabled={isSubmitting}
                      />
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">Used for governance signals (not ranking yet).</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 px-3 sm:px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Restrict to me</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">For restricted docs, adds an ACL for your user.</p>
                    </div>
                    <Switch checked={restrictToMe} onCheckedChange={setRestrictToMe} disabled={isSubmitting} />
                  </div>

                  <div className="space-y-2">
                    <Label>Document</Label>
                    <div
                      className={cn(
                        'rounded-2xl border-2 border-dashed bg-muted/30 p-3 sm:p-4',
                        'flex items-center justify-between gap-3 sm:gap-4',
                        'transition-colors cursor-pointer hover:bg-muted/50',
                        isDragging && 'border-primary bg-primary/5',
                        uploadFile && 'border-solid border-primary/50',
                        isSubmitting && 'opacity-50 cursor-not-allowed'
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={!isSubmitting ? handleBrowseClick : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          uploadFile ? "bg-primary/20" : "bg-primary/10"
                        )}>
                          <FileText className={cn(
                            "w-5 h-5",
                            uploadFile ? "text-primary" : "text-primary/70"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {uploadFile ? uploadFile.name : isDragging ? 'Drop file here' : 'Choose a file or drag & drop'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {uploadFile 
                              ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`
                              : '.txt, .md, .pdf, .docx (max 50MB)'
                            }
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".txt,.md,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSubmitting}
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        {uploadFile && !isSubmitting && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10"
                            onClick={handleClearFile}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {!isSubmitting && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="rounded-xl text-xs sm:text-sm" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBrowseClick();
                            }}
                          >
                            Browse
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploadStage !== 'idle' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getUploadStageIcon()}
                          <span className={cn(
                            "font-medium",
                            uploadStage === 'error' && "text-destructive",
                            uploadStage === 'complete' && "text-emerald-500"
                          )}>
                            {getUploadStageLabel()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                      <Progress 
                        value={uploadProgress} 
                        className={cn(
                          "h-2",
                          uploadStage === 'error' && "[&>div]:bg-destructive",
                          uploadStage === 'complete' && "[&>div]:bg-emerald-500"
                        )}
                      />
                      {uploadError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {uploadError}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {uploadStage === 'error' ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setUploadError(null);
                            setUploadStage('idle');
                            setUploadProgress(0);
                          }} 
                          className="rounded-xl text-xs sm:text-sm" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRetryUpload}
                          className="bg-primary hover:bg-primary/90 rounded-xl text-xs sm:text-sm"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Upload
                        </Button>
                      </>
                    ) : isSubmitting ? (
                      <Button
                        variant="outline"
                        onClick={handleCancelUpload}
                        className="rounded-xl text-xs sm:text-sm"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Upload
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs sm:text-sm" size="sm">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpload}
                          disabled={!uploadFile}
                          className="bg-primary hover:bg-primary/90 rounded-xl text-xs sm:text-sm"
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search - mobile optimized */}
        <div className="mt-3 sm:mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or checksum…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Content - mobile optimized */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {isLoading ? (
          <KnowledgeBaseSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center px-4">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{searchQuery ? 'No matching sources' : 'No knowledge sources yet'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try a different query' : 'Upload a document to start a governed ingestion flow'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 max-w-5xl">
            {filtered.map((s) => (
              <div key={s.id} className="akior-card group">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-medium truncate text-sm sm:text-base">{s.title || 'Untitled source'}</h3>

                      <Badge variant="outline" className={cn('rounded-full text-[10px] sm:text-xs', statusPill(s.status))}>
                        {s.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Approved
                          </span>
                        ) : s.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Awaiting Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {s.status}
                          </span>
                        )}
                      </Badge>

                      <Badge variant="outline" className={cn('rounded-full text-[10px] sm:text-xs', classificationPill(s.classification))}>
                        {s.classification}
                      </Badge>

                      <Badge variant="secondary" className="rounded-full bg-muted/40 text-[10px] sm:text-xs">
                        trust {s.trust_level}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span>id: {s.id.slice(0, 8)}…</span>
                      <span>checksum: {s.checksum.slice(0, 12)}…</span>
                      <span>size: {formatDocumentSize(s.document_size)}</span>
                      <span className="hidden sm:inline">created {new Date(s.created_at).toLocaleString()}</span>
                      <span className="sm:hidden">created {new Date(s.created_at).toLocaleDateString()}</span>
                      <span>indexed {s.indexed_at ? new Date(s.indexed_at).toLocaleDateString() : '—'}</span>
                    </div>

                    {s.status === 'pending' && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-xs text-amber-600 dark:text-amber-500">
                        <Clock className="h-3 w-3 animate-pulse" />
                        <span>Document uploaded and parsed. Waiting for admin to approve and index for RAG.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {role === 'admin' && s.status === 'pending' && (
                      <Button
                        onClick={() => approve(s.id)}
                        disabled={approvingId === s.id}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-xs sm:text-sm h-9"
                        size="sm"
                        title="Approve and index document"
                      >
                        {approvingId === s.id ? (
                          <>
                            <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">Indexing…</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Approve</span>
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 w-9 p-0"
                      onClick={() => openEditDialog(s)}
                      title="Edit document"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      onClick={() => openDeleteDialog(s)}
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document metadata. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Document title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-muted/50 rounded-xl"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={editClassification} onValueChange={(v) => setEditClassification(v as Classification)}>
                  <SelectTrigger className="rounded-xl bg-muted/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-trust">Trust level</Label>
                <Input
                  id="edit-trust"
                  inputMode="numeric"
                  value={editTrustLevel}
                  onChange={(e) => setEditTrustLevel(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  className="rounded-xl bg-muted/40"
                  placeholder="0-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl text-xs sm:text-sm" size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isEditing}
                className="bg-primary hover:bg-primary/90 rounded-xl text-xs sm:text-sm"
                size="sm"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSource?.title || 'this document'}"? 
              This will remove all associated chunks and vectors. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSource && handleDelete(selectedSource.id)}
              disabled={deletingId === selectedSource?.id}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingId === selectedSource?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer - mobile optimized */}
      <div className="px-4 sm:px-6 py-3 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{sources.length} source{sources.length === 1 ? '' : 's'} total</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full bg-muted/30 text-[10px] sm:text-xs">
              role: {role}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}