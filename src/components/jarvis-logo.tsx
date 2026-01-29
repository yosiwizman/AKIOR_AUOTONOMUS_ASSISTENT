'use client';

/**
 * AKIOR Logo Component
 * Circular glowing logo with text, positioned in bottom right
 */

import { cn } from '@/lib/utils';

interface AkiorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AkiorLogo({ className, size = 'md' }: AkiorLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-24 h-24 text-sm',
    lg: 'w-32 h-32 text-base',
  };

  return (
    <div className={cn(
      'relative flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full akior-logo-ring opacity-60" />
      
      {/* Middle ring */}
      <div className="absolute inset-2 rounded-full border border-primary/40" />
      
      {/* Inner circle with text */}
      <div className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-background to-card',
        'border border-primary/30',
        size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-18 h-18' : 'w-24 h-24'
      )}
      style={{
        width: size === 'sm' ? '48px' : size === 'md' ? '72px' : '96px',
        height: size === 'sm' ? '48px' : size === 'md' ? '72px' : '96px',
      }}
      >
        <span className={cn(
          'font-bold tracking-wider text-primary',
          size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[11px]' : 'text-sm'
        )}>
          AKIOR
        </span>
      </div>
      
      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
    </div>
  );
}