'use client';

/**
 * AKIOR Menu/Dashboard View
 * Card-based navigation - mobile optimized
 */

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AkiorLogo } from './jarvis-logo';
import { useAuth } from '@/contexts/auth-context';

interface MenuCardProps {
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  highlight?: boolean;
}

function MenuCard({ title, description, onClick, disabled, badge, highlight }: MenuCardProps) {
  return (
    <div 
      className={cn(
        'akior-card cursor-pointer group relative',
        // Better touch feedback on mobile
        'active:scale-[0.98] transition-transform',
        disabled && 'opacity-50 cursor-not-allowed',
        highlight && 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-transparent hover:border-cyan-400/70'
      )}
      onClick={disabled ? undefined : onClick}
    >
      {badge && (
        <span className={cn(
          "absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full",
          highlight ? "bg-cyan-500/20 text-cyan-400" : "bg-primary/20 text-primary"
        )}>
          {badge}
        </span>
      )}
      <h3 className={cn(
        "font-semibold mb-1 text-base sm:text-lg",
        highlight ? "text-cyan-300" : "text-foreground"
      )}>{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
      <button 
        className={cn(
          'akior-link',
          disabled && 'pointer-events-none',
          highlight && 'text-cyan-400 hover:text-cyan-300'
        )}
        disabled={disabled}
      >
        Go <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

interface AkiorMenuProps {
  onNavigate: (view: 'voice' | 'chat' | 'settings' | 'knowledge' | 'hud') => void;
}

export function AkiorMenu({ onNavigate }: AkiorMenuProps) {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Talk to AKIOR',
      description: 'Futuristic voice interface with HUD display',
      onClick: () => onNavigate('hud'),
      badge: 'NEW',
      highlight: true,
    },
    {
      title: 'AKIOR (Voice)',
      description: 'Voice assistant with OpenAI TTS',
      onClick: () => onNavigate('voice'),
      badge: 'TTS',
    },
    {
      title: 'Knowledge Base',
      description: 'Upload documents to teach AKIOR',
      onClick: () => onNavigate('knowledge'),
      badge: 'RAG',
    },
    {
      title: 'Chat',
      description: 'Text chat with memory & knowledge',
      onClick: () => onNavigate('chat'),
      badge: 'Memory',
    },
    {
      title: '3D Model',
      description: 'Create models from captured images',
      disabled: true,
    },
    {
      title: 'Create Image',
      description: 'Generate images from prompts',
      disabled: true,
    },
    {
      title: '3D Printers',
      description: 'Monitor and control Bambu Lab printers',
      disabled: true,
    },
    {
      title: 'Files',
      description: 'Shared library of generated assets',
      disabled: true,
    },
    {
      title: 'Security',
      description: 'Live dashboard for connected cameras',
      disabled: true,
    },
    {
      title: 'Settings',
      description: 'Agent personality, voice & memory',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Header - mobile optimized */}
      <div className="px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Select a module to get started
            </p>
          </div>
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground truncate max-w-[200px]">{user.email}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of cards - responsive columns */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 max-w-5xl">
          {menuItems.map((item, idx) => (
            <MenuCard
              key={idx}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
              disabled={item.disabled}
              badge={item.badge}
              highlight={item.highlight}
            />
          ))}
        </div>
      </div>

      {/* AKIOR Logo - bottom right, hidden on mobile */}
      <div className="absolute bottom-6 right-6 hidden xl:block pointer-events-none">
        <AkiorLogo size="md" />
      </div>
    </div>
  );
}