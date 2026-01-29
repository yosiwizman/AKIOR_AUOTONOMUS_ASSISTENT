'use client';

/**
 * AKIOR App - Main Application Shell
 * Combines sidebar navigation with content views
 * Includes authentication gate
 */

import { useState } from 'react';
import { AkiorSidebar } from './jarvis-sidebar';
import { AkiorMenu } from './jarvis-menu';
import { AkiorVoice } from './jarvis-voice';
import { AkiorChat } from './jarvis-chat';
import { AkiorSettings } from './jarvis-settings';
import { KnowledgeBase } from './knowledge-base';
import { LoginPage } from './login-page';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ViewType = 'menu' | 'voice' | 'chat' | 'settings' | 'knowledge';

export function AkiorApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('menu');

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
    return <LoginPage />;
  }

  const renderContent = () => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AkiorSidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

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
