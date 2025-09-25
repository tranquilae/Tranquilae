import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export default function GlassButton({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button'
}: GlassButtonProps) {
  const baseStyles = 'glass-button inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nature-green disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variants = {
    primary: 'bg-nature-green hover:bg-nature-600 text-white border-nature-green shadow-nature',
    secondary: 'text-nature-green hover:text-nature-700 border-glass-border hover:border-nature-green/50',
    ghost: 'text-text-900 hover:text-nature-green border-transparent hover:border-glass-border bg-transparent'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

// Glass Button Group
export function GlassButtonGroup({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('flex space-x-2', className)}>
      {children}
    </div>
  );
}