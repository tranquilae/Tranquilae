import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  withTint?: boolean;
  hover?: boolean;
}

export default function GlassCard({ 
  children, 
  className = '', 
  variant = 'primary',
  withTint = false,
  hover = true
}: GlassCardProps) {
  return (
    <div 
      className={cn(
        'glass-card relative',
        variant === 'secondary' && 'glass-card-secondary',
        withTint && 'glass-tint',
        !hover && 'hover:transform-none hover:shadow-glass',
        className
      )}
    >
      {children}
    </div>
  );
}

// Glass Card Header
export function GlassCardHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('p-6 pb-4', className)}>
      {children}
    </div>
  );
}

// Glass Card Content
export function GlassCardContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
}

// Glass Card Footer
export function GlassCardFooter({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('p-6 pt-4 border-t border-glass-border/50', className)}>
      {children}
    </div>
  );
}