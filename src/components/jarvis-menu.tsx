'use client';

/**
 * Jarvis Menu/Dashboard View
 * Card-based navigation matching the reference design
 */

import { ArrowRight, Mic, MessageSquare, Settings, Image, Box, Printer, FolderOpen, Shield, Camera, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JarvisLogo } from './jarvis-logo';

interface MenuCardProps {
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function MenuCard({ title, description, onClick, disabled }: MenuCardProps) {
  return (
    <div 
      className={cn(
        'jarvis-card cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <button 
        className={cn(
          'jarvis-link',
          disabled && 'pointer-events-none'
        )}
        disabled={disabled}
      >
        Go <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

interface JarvisMenuProps {
  onNavigate: (view: 'voice' | 'chat' | 'settings') => void;
}

export function JarvisMenu({ onNavigate }: JarvisMenuProps) {
  const menuItems = [
    {
      title: 'Jarvis (Voice)',
      description: 'OpenAI Realtime voice assistant',
      onClick: () => onNavigate('voice'),
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
      title: 'Chat',
      description: 'Text chat with function calling',
      onClick: () => onNavigate('chat'),
    },
    {
      title: 'Security',
      description: 'Live dashboard for connected cameras',
      disabled: true,
    },
    {
      title: 'Camera',
      description: 'Register a device as a camera client',
      disabled: true,
    },
    {
      title: 'Scan',
      description: 'Futuristic scanning interface with camera sync',
      disabled: true,
    },
    {
      title: 'Settings',
      description: 'Jarvis & Meshy configuration',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a module to get started
        </p>
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
            />
          ))}
        </div>
      </div>

      {/* Jarvis Logo - bottom right */}
      <div className="absolute bottom-6 right-6 hidden lg:block">
        <JarvisLogo size="md" />
      </div>
    </div>
  );
}
