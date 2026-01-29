'use client';

/**
 * AKIOR App - Main Application Shell
 * Combines sidebar navigation with content views
 */

import { useState } from 'react';
import { AkiorSidebar } from './jarvis-sidebar';
import { AkiorMenu } from './jarvis-menu';
import { AkiorVoice } from './jarvis-voice';
import { AkiorChat } from './jarvis-chat';
import { AkiorSettings } from './jarvis-settings';
import { cn } from '@/lib/utils';

type ViewType = 'menu' | 'voice' | 'chat' | 'settings';

export function AkiorApp() {
  const [currentView, setCurrentView] = useState<ViewType>('menu');

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