/**
 * Unit tests for Modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal component', () => {
  beforeEach(() => {
    // Reset body overflow style before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.style.overflow = '';
  });

  it('renders nothing when not open', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('Test Title');
  });

  it('renders with description', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} description="Test Description">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Test Title" 
        description="Test Description"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Title">
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside modal', () => {
    const onClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    // Find the backdrop/overlay element
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showClose is false', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} showClose={false}>
        <div>Modal Content</div>
      </Modal>
    );
    
    // Should not have a close button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows close button by default', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    const expectedClasses = ['sm:max-w-sm', 'sm:max-w-md', 'lg:max-w-lg', 'lg:max-w-xl'];
    
    sizes.forEach((size, index) => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}} size={size}>
          <div>Modal Content</div>
        </Modal>
      );
      
      const modal = document.querySelector(`[class*="${expectedClasses[index]}"]`) as HTMLElement;
      expect(modal).not.toBeNull();
      expect(modal.className).toContain(expectedClasses[index]);
      unmount();
    });
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('has correct accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Accessible Modal" description="Modal description">
        <div>Modal Content</div>
      </Modal>
    );
    
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal).toHaveAttribute('role', 'dialog');
    
    const title = screen.getByRole('heading');
    expect(title).toHaveTextContent('Accessible Modal');
  });

  it('has proper z-index for modal overlay', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal.className).toContain('z-modal');
  });

  it('has backdrop blur effect', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop.className).toContain('backdrop-blur-sm');
  });

  it('has animation classes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop.className).toContain('animate-fade-in');
    
    const content = document.querySelector('[class*="animate-slide-up"]') as HTMLElement;
    expect(content.className).toContain('animate-slide-up');
  });
});
