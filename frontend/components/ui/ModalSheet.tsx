'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  withBorder?: boolean;
  withFlex?: boolean;
  dense?: boolean;
}

const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function ModalSheet({ open, onClose, children, className, maxWidth = 'lg', withBorder = false, withFlex = false, dense = false }: ModalSheetProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center',
        dense ? 'p-4' : 'p-2 sm:p-4'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden',
          MAX_WIDTHS[maxWidth],
          withBorder && 'border border-border',
          withFlex && 'max-h-[85vh] flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
