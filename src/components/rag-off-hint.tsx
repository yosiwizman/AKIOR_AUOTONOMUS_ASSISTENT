'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RagOffHint({ token, className }: { token?: string; className?: string }) {
  const [state, setState] = useState<'OFF' | 'DEGRADED' | 'ON'>('OFF');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/rag/status', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (alive) setState(data?.data?.rag_state || 'OFF');
      } catch {
        if (alive) setState('DEGRADED');
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  if (state !== 'OFF') return null;

  return (
    <div className={cn('mt-2 flex items-start gap-2 text-xs text-muted-foreground', className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 text-primary/70" />
      <p>No approved knowledge indexed yet. Upload a document in Knowledge Base and have an admin approve it.</p>
    </div>
  );
}
