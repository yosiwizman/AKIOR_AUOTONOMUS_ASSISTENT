'use client';

/**
 * AKIOR Menu/Dashboard View
 * Card-based navigation matching the reference design
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
}

function MenuCard({ title, description, onClick, disabled, badge }: MenuCardProps) {
  return (
    <div 
      className={cn(
        'akior-card cursor-pointer group relative',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <button 
        className={cn(
          'akior-link',
          disabled && 'pointer-events-none'
        )}
        disabled={disabled}
      >
        Go <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

interface AkiorMenuProps {
  onNavigate: (view: 'voice' | 'chat' | 'settings' | 'knowledge') => void;
}

export function AkiorMenu({ onNavigate }: AkiorMenuProps) {
  const { user } = useAuth();

  const menuItems = [
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
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a module to get started
            </p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-sm text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of cards */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
          {menuItems.map((item, idx) => (
            <MenuCard
              key={idx}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
              disabled={item.disabled}
              badge={item.badge}
            />
          ))}
        </div>
      </div>

      {/* AKIOR Logo - bottom right */}
      <div className="absolute bottom-6 right-6 hidden lg:block">
        <AkiorLogo size="md" />
      </div>
    </div>
  );
}
