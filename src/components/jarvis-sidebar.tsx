'use client';

/**
 * Jarvis-style Sidebar Navigation
 * Matches the design from the reference images
 */

import { useState } from 'react';
import { 
  Menu, 
  MessageSquare, 
  Mic, 
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentView: 'menu' | 'voice' | 'chat' | 'settings';
  onViewChange: (view: 'menu' | 'voice' | 'chat' | 'settings') => void;
}

const menuItems = [
  { id: 'menu', label: 'Menu', icon: Menu },
  { id: 'voice', label: 'Jarvis (Voice)', icon: Mic },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function JarvisSidebar({ currentView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-sidebar-background border-r border-sidebar-border',
        'transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-52',
        // Mobile styles
        'lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          {!isCollapsed && (
            <span className="font-semibold text-foreground tracking-tight">Jarvis</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-sm transition-all duration-200',
                  'border border-transparent',
                  isActive 
                    ? 'text-foreground bg-secondary/50 border-sidebar-border' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 hover:border-sidebar-border'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          {!isCollapsed && (
            <span className="text-xs text-muted-foreground">dark • modern</span>
          )}
        </div>
      </aside>
    </>
  );
}
