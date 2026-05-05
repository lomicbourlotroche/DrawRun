/**
 * Dialog Components - Wrapper around Modal for compatibility
 */

import { Modal } from './Modal';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { ReactNode } from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={() => onOpenChange?.(false)}>
      {children}
    </Modal>
  );
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={className}>{children}</div>;
}

interface DialogHeaderProps {
  children: ReactNode;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <CardHeader>{children}</CardHeader>;
}

interface DialogTitleProps {
  children: ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <CardTitle>{children}</CardTitle>;
}
