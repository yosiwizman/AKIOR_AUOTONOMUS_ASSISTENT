'use client';

/**
 * Governed Knowledge Base (Admin)
 * - Upload (pending)
 * - Admin approval -> indexing
 * - Status + counts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BadgeInfo,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/contexts/auth-context';
import { KnowledgeBaseSkeleton } from './loading-skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RagStatusBadge } from '@/components/rag-status-badge';

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
};

type RagStatus = {
  sources_total: number;
  sources_approved: number;
  chunks_total: number;
  vectors_total: number;
  last_index_time: string | null;
  rag_state: 'OFF' | 'DEGRADED' | 'ON';
};

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

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<Classification>('public');
  const [trustLevel, setTrustLevel] = useState('50');
  const [restrictToMe, setRestrictToMe] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

  const filtered = sources.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = (s.title || '').toLowerCase();
    return title.includes(q) || s.checksum.toLowerCase().includes(q);
  });

  const handleUpload = async () => {
    if (!session?.access_token || !uploadFile || isSubmitting) return;

    setIsSubmitting(true);
    try {
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
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      toast.success('Uploaded. Waiting for admin approval.');
      setUploadTitle('');
      setUploadFile(null);
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
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
              Admin-approved ingestion • ACL/classification filtered retrieval • Audited access
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="hidden sm:inline">Refresh</span>}
              <span className="sm:hidden">↻</span>
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
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Classification</Label>
                      <Select value={classification} onValueChange={(v) => setClassification(v as Classification)}>
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
                      />
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">Used for governance signals (not ranking yet).</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 px-3 sm:px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Restrict to me</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">For restricted docs, adds an ACL for your user.</p>
                    </div>
                    <Switch checked={restrictToMe} onCheckedChange={setRestrictToMe} />
                  </div>

                  <div className="space-y-2">
                    <Label>Document</Label>
                    <div
                      className={cn(
                        'rounded-2xl border border-border bg-muted/30 p-3 sm:p-4',
                        'flex items-center justify-between gap-3 sm:gap-4'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{uploadFile ? uploadFile.name : 'Choose a file'}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">.txt, .md, .pdf, .docx (max 15MB)</p>
                        </div>
                      </div>
                      <label className="shrink-0">
                        <input
                          type="file"
                          className="hidden"
                          accept=".txt,.md,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        <Button type="button" variant="outline" className="rounded-xl text-xs sm:text-sm" size="sm">
                          Browse
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs sm:text-sm" size="sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isSubmitting || !uploadFile}
                      className="bg-primary hover:bg-primary/90 rounded-xl text-xs sm:text-sm"
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
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
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {s.status}
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
                      <span className="hidden sm:inline">created {new Date(s.created_at).toLocaleString()}</span>
                      <span className="sm:hidden">created {new Date(s.created_at).toLocaleDateString()}</span>
                      <span>indexed {s.indexed_at ? new Date(s.indexed_at).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {role === 'admin' && s.status === 'pending' && (
                      <Button
                        onClick={() => approve(s.id)}
                        disabled={approvingId === s.id}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-xs sm:text-sm h-9 sm:h-auto"
                        size="sm"
                      >
                        {approvingId === s.id ? (
                          <>
                            <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">Approving…</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Approve & Index</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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