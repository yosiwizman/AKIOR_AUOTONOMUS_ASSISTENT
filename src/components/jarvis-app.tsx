'use client';

/**
 * Jarvis App - Main Application Shell
 * Combines sidebar navigation with content views
 */

import { useState } from 'react';
import { JarvisSidebar } from './jarvis-sidebar';
import { JarvisMenu } from './jarvis-menu';
import { JarvisVoice } from './jarvis-voice';
import { JarvisChat } from './jarvis-chat';
import { JarvisSettings } from './jarvis-settings';
import { cn } from '@/lib/utils';

type ViewType = 'menu' | 'voice' | 'chat' | 'settings';

export function JarvisApp() {
  const [currentView, setCurrentView] = useState<ViewType>('menu');

  const renderContent = () => {
    switch (currentView) {
      case 'menu':
        return <JarvisMenu onNavigate={setCurrentView} />;
      case 'voice':
        return <JarvisVoice />;
      case 'chat':
        return <JarvisChat />;
      case 'settings':
        return <JarvisSettings />;
      default:
        return <JarvisMenu onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <JarvisSidebar 
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
