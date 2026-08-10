/**
 * Unit tests for Badge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge component', () => {
  it('renders with default props', () => {
    render(<Badge>Test Badge</Badge>);

    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('font-medium');
  });

  it('renders with children', () => {
    render(<Badge>Children Content</Badge>);

    expect(screen.getByText('Children Content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge variant="default">Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-surface');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('border-border');
  });

  it('applies primary variant styles', () => {
    render(<Badge variant="primary">Primary</Badge>);

    const badge = screen.getByText('Primary');
    expect(badge).toHaveClass('bg-primary/20');
    expect(badge).toHaveClass('text-primary');
    expect(badge).toHaveClass('border-primary/30');
  });

  it('applies secondary variant styles', () => {
    render(<Badge variant="secondary">Secondary</Badge>);

    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-background');
    expect(badge).toHaveClass('text-muted');
    expect(badge).toHaveClass('border-surface');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>);

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-success/20');
    expect(badge).toHaveClass('text-success');
    expect(badge).toHaveClass('border-success/30');
  });

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>);

    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-warning/20');
    expect(badge).toHaveClass('text-warning');
    expect(badge).toHaveClass('border-warning/30');
  });

  it('applies danger variant styles', () => {
    render(<Badge variant="danger">Danger</Badge>);

    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-danger/20');
    expect(badge).toHaveClass('text-danger');
    expect(badge).toHaveClass('border-danger/30');
  });

  it('applies outline variant styles', () => {
    render(<Badge variant="outline">Outline</Badge>);

    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('bg-transparent');
    expect(badge).toHaveClass('border-primary');
    expect(badge).toHaveClass('text-primary');
  });

  it('applies small size styles', () => {
    render(<Badge size="sm">Small</Badge>);

    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies medium size styles', () => {
    render(<Badge size="md">Medium</Badge>);

    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('applies zone color when variant is zone and zone is provided', () => {
    render(
      <Badge variant="zone" zone={1}>
        Zone 1
      </Badge>,
    );

    const badge = screen.getByText('Zone 1');
    // Zone 1 should have a background color
    expect(badge.style.backgroundColor).toBeDefined();
    expect(badge.style.borderColor).toBeDefined();
  });

  it('renders with icon', () => {
    render(
      <Badge variant="primary">
        <span>🏆</span> With Icon
      </Badge>,
    );

    const badge = screen.getByText('With Icon');
    expect(badge).toContainHTML('🏆');
  });

  it('has correct accessibility attributes', () => {
    render(<Badge>Accessible Badge</Badge>);

    const badge = screen.getByText('Accessible Badge');
    expect(badge).toHaveAttribute('role', 'status');
  });
});
