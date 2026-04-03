'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type RagState = 'OFF' | 'DEGRADED' | 'ON';

export function RagStatusBadge({ token }: { token?: string }) {
  const [state, setState] = useState<RagState>('OFF');

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch('/api/rag/status', { headers });
        const data = await res.json();
        const s = (data?.data?.rag_state as RagState) || 'OFF';
        if (alive) setState(s);
      } catch {
        if (alive) setState('DEGRADED');
      }
    }

    poll();
    const t = setInterval(poll, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [headers]);

  const badgeClass =
    state === 'ON'
      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20'
      : state === 'DEGRADED'
        ? 'bg-amber-500/15 text-amber-800 border-amber-500/25'
        : 'bg-slate-500/10 text-slate-700 border-slate-500/20';

  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide', badgeClass)}
    >
      RAG: {state}
    </Badge>
  );
}
