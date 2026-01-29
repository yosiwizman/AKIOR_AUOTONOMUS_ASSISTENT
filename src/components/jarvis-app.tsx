'use client';

/**
 * AKIOR App - Main Application Shell
 * Enterprise-grade with error boundaries and loading states
 */

import { useState, Suspense } from 'react';
import { AkiorSidebar } from './jarvis-sidebar';
import { AkiorMenu } from './jarvis-menu';
import { AkiorVoice } from './jarvis-voice';
import { AkiorChat } from './jarvis-chat';
import { AkiorSettings } from './jarvis-settings';
import { KnowledgeBase } from './knowledge-base';
import { LoginPage } from './login-page';
import { ErrorBoundary } from './error-boundary';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewType = 'menu' | 'voice' | 'chat' | 'settings' | 'knowledge';

// Loading fallback component
function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Error fallback for individual views
function ViewErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="font-semibold mb-2">Failed to load this section</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong while loading. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function AkiorApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('menu');
  const [viewKey, setViewKey] = useState(0);

  // Force re-render of current view (for error recovery)
  const handleRetry = () => {
    setViewKey(prev => prev + 1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AKIOR...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    const content = (() => {
      switch (currentView) {
        case 'menu':
          return <AkiorMenu onNavigate={setCurrentView} />;
        case 'voice':
          return <AkiorVoice />;
        case 'chat':
          return <AkiorChat />;
        case 'settings':
          return <AkiorSettings />;
        case 'knowledge':
          return <KnowledgeBase />;
        default:
          return <AkiorMenu onNavigate={setCurrentView} />;
      }
    })();

    return (
      <ErrorBoundary 
        key={`${currentView}-${viewKey}`}
        fallback={<ViewErrorFallback onRetry={handleRetry} />}
      >
        <Suspense fallback={<LoadingFallback message={`Loading ${currentView}...`} />}>
          {content}
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <ErrorBoundary>
        <AkiorSidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
      </ErrorBoundary>

      {/* Main content area */}
      <main className={cn(
        'min-h-screen transition-all duration-300',
        'lg:ml-52' // Sidebar width on desktop
      )}>
        <div className="h-screen flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
