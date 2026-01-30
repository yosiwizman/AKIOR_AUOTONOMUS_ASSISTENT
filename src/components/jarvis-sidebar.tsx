'use client';

/**
 * AKIOR-style Sidebar Navigation
 * Mobile-optimized with touch-friendly interactions
 */

import { useState, useEffect } from 'react';
import { 
  Menu, 
  MessageSquare, 
  Mic, 
  Settings,
  BookOpen,
  X,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentView: 'menu' | 'voice' | 'chat' | 'settings' | 'knowledge' | 'hud';
  onViewChange: (view: 'menu' | 'voice' | 'chat' | 'settings' | 'knowledge' | 'hud') => void;
}

const menuItems = [
  { id: 'menu', label: 'Menu', icon: Menu },
  { id: 'hud', label: 'Talk to AKIOR', icon: CircleDot },
  { id: 'voice', label: 'AKIOR (Voice)', icon: Mic },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function AkiorSidebar({ currentView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentView]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile toggle button - larger touch target */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-3 left-3 z-50 lg:hidden",
          "h-11 w-11", // Larger for touch
          "bg-background/80 backdrop-blur-sm border border-border",
          "hover:bg-background"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-sidebar-background border-r border-sidebar-border',
        'transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64 sm:w-52', // Wider on mobile when open
        // Mobile styles
        'lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        // Shadow on mobile
        isMobileOpen && 'shadow-2xl'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 shrink-0 hidden lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          {!isCollapsed && (
            <span className="font-semibold text-foreground tracking-tight">AKIOR</span>
          )}
        </div>

        {/* Navigation - larger touch targets on mobile */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.filter(item => item.id !== 'voice').map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isHud = item.id === 'hud';
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 rounded-md',
                  'text-sm transition-all duration-200',
                  'border border-transparent',
                  // Larger touch target on mobile
                  'py-3 lg:py-2.5',
                  // Active states
                  isHud && !isActive && 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/30',
                  isHud && isActive && 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
                  !isHud && isActive && 'text-foreground bg-secondary/50 border-sidebar-border',
                  !isHud && !isActive && 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 hover:border-sidebar-border',
                  // Touch feedback
                  'active:scale-95'
                )}
              >
                <Icon className={cn("w-5 h-5 lg:w-4 lg:h-4 shrink-0", isHud && "text-cyan-400")} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          {!isCollapsed && (
            <span className="text-xs text-muted-foreground">v2.0 • RAG + Memory</span>
          )}
        </div>
      </aside>
    </>
  );
}