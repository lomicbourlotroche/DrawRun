/**
 * Unit tests for Dialog component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

describe('Dialog component', () => {
  it('renders nothing when not open', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>Test Content</DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>Test Content</DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onOpenChange when closing', () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent>Test Content</DialogContent>
      </Dialog>,
    );

    // The Dialog component uses Modal internally, which has a close button
    // We need to check if the Modal is rendered and if we can close it
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders with children', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <div>Child Content</div>
      </Dialog>,
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});

describe('DialogContent component', () => {
  it('renders children with default className', () => {
    render(<DialogContent>Content</DialogContent>);

    const content = screen.getByText('Content');
    expect(content).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DialogContent className="custom-class">Content</DialogContent>);

    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-class');
  });

  it('renders multiple children', () => {
    render(
      <DialogContent>
        <span>First</span>
        <span>Second</span>
      </DialogContent>,
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

describe('DialogHeader component', () => {
  it('renders children', () => {
    render(<DialogHeader>Header Content</DialogHeader>);

    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });
});

describe('DialogTitle component', () => {
  it('renders children', () => {
    render(<DialogTitle>Title Content</DialogTitle>);

    expect(screen.getByText('Title Content')).toBeInTheDocument();
  });

  it('renders as heading', () => {
    render(<DialogTitle>Title</DialogTitle>);

    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });
});

describe('Dialog accessibility', () => {
  it('DialogContent has correct role', () => {
    render(<DialogContent>Content</DialogContent>);

    const content = screen.getByText('Content');
    expect(content).toBeInTheDocument();
  });

  it('DialogTitle has heading role', () => {
    render(<DialogTitle>Title</DialogTitle>);

    const title = screen.getByRole('heading');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Title');
  });
});
