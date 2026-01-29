'use client';

/**
 * Loading Skeleton Components
 * Consistent loading states across the app
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Chat message skeleton
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl p-4',
        isUser ? 'bg-primary/20' : 'bg-muted/50'
      )}>
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

// Chat loading skeleton
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
    </div>
  );
}

// Knowledge base item skeleton
export function KnowledgeItemSkeleton() {
  return (
    <div className="akior-card">
      <div className="flex items-start gap-4">
        <Skeleton className="w-4 h-4 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
      </div>
    </div>
  );
}

// Knowledge base loading skeleton
export function KnowledgeBaseSkeleton() {
  return (
    <div className="space-y-4">
      <KnowledgeItemSkeleton />
      <KnowledgeItemSkeleton />
      <KnowledgeItemSkeleton />
    </div>
  );
}

// Conversation list skeleton
export function ConversationListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="w-4 h-4 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Settings section skeleton
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="akior-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full page loading
export function PageLoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

// Memory item skeleton
export function MemoryItemSkeleton() {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <Skeleton className="h-4 w-full mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// Memory list skeleton
export function MemoryListSkeleton() {
  return (
    <div className="space-y-3">
      <MemoryItemSkeleton />
      <MemoryItemSkeleton />
      <MemoryItemSkeleton />
    </div>
  );
}
