'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'glass' | 'neon' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return `
            bg-gradient-to-r from-blue-600 to-blue-700
            hover:from-blue-700 hover:to-blue-800
            text-white
            shadow-lg shadow-blue-500/25
            hover:shadow-xl hover:shadow-blue-500/35
            border border-blue-500/20
          `;
        case 'secondary':
          return `
            bg-white dark:bg-gray-800
            hover:bg-gray-50 dark:hover:bg-gray-700
            text-gray-900 dark:text-gray-100
            border border-gray-200 dark:border-gray-600
            shadow-md shadow-gray-900/5 dark:shadow-black/10
          `;
        case 'gradient':
          return `
            bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600
            hover:from-purple-700 hover:via-pink-700 hover:to-blue-700
            text-white
            shadow-lg shadow-purple-500/25
            hover:shadow-xl hover:shadow-purple-500/35
            border border-white/20
          `;
        case 'glass':
          return `
            backdrop-blur-xl bg-white/10 dark:bg-black/20
            hover:bg-white/20 dark:hover:bg-black/30
            text-gray-900 dark:text-gray-100
            border border-white/20 dark:border-white/10
            shadow-lg shadow-black/10
          `;
        case 'neon':
          return `
            bg-gray-900 dark:bg-black
            hover:bg-gray-800
            text-cyan-400
            border border-cyan-500/30
            shadow-[0_0_20px_rgba(6,182,212,0.3)]
            hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
            hover:border-cyan-400/50
          `;
        case 'danger':
          return `
            bg-gradient-to-r from-red-600 to-red-700
            hover:from-red-700 hover:to-red-800
            text-white
            shadow-lg shadow-red-500/25
            hover:shadow-xl hover:shadow-red-500/35
            border border-red-500/20
          `;
        case 'success':
          return `
            bg-gradient-to-r from-green-600 to-green-700
            hover:from-green-700 hover:to-green-800
            text-white
            shadow-lg shadow-green-500/25
            hover:shadow-xl hover:shadow-green-500/35
            border border-green-500/20
          `;
        default:
          return '';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-sm font-medium rounded-lg';
        case 'md':
          return 'px-4 py-2 text-sm font-medium rounded-xl';
        case 'lg':
          return 'px-6 py-3 text-base font-semibold rounded-xl';
        case 'xl':
          return 'px-8 py-4 text-lg font-bold rounded-2xl';
        default:
          return 'px-4 py-2 text-sm font-medium rounded-xl';
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transform hover:scale-105 active:scale-95',
          
          // Size styles
          getSizeStyles(),
          
          // Variant styles
          getVariantStyles(),
          
          // Focus ring based on variant
          variant === 'primary' && 'focus:ring-blue-500',
          variant === 'secondary' && 'focus:ring-gray-500',
          variant === 'gradient' && 'focus:ring-purple-500',
          variant === 'glass' && 'focus:ring-white/50',
          variant === 'neon' && 'focus:ring-cyan-500',
          variant === 'danger' && 'focus:ring-red-500',
          variant === 'success' && 'focus:ring-green-500',
          
          // Custom className
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && icon}
        {children}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';
