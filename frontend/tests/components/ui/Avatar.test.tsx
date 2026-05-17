/**
 * Unit tests for Avatar component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/ui/Avatar';

describe('Avatar component', () => {
  it('renders with initials when no src is provided', () => {
    render(<Avatar name="John Doe" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('rounded-full');
    expect(avatar).toHaveClass('bg-primary/20');
    expect(avatar).toHaveClass('text-primary');
  });

  it('renders with question mark when no name is provided', () => {
    render(<Avatar />);
    
    const avatar = screen.getByText('?');
    expect(avatar).toBeInTheDocument();
  });

  it('renders with single initial for single name', () => {
    render(<Avatar name="Alice" />);
    
    const avatar = screen.getByText('A');
    expect(avatar).toBeInTheDocument();
  });

  it('renders with two initials for full name', () => {
    render(<Avatar name="John Doe" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('limits initials to 2 characters for long names', () => {
    render(<Avatar name="John Jacob Doe" />);
    
    const avatar = screen.getByText('JJ');
    expect(avatar).toBeInTheDocument();
  });

  it('applies small size styles', () => {
    render(<Avatar name="Test" size="sm" />);
    
    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('w-8');
    expect(avatar).toHaveClass('h-8');
    expect(avatar).toHaveClass('text-xs');
  });

  it('applies medium size styles by default', () => {
    render(<Avatar name="Test" />);
    
    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('w-10');
    expect(avatar).toHaveClass('h-10');
    expect(avatar).toHaveClass('text-sm');
  });

  it('applies large size styles', () => {
    render(<Avatar name="Test" size="lg" />);
    
    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('w-12');
    expect(avatar).toHaveClass('h-12');
    expect(avatar).toHaveClass('text-base');
  });

  it('applies extra large size styles', () => {
    render(<Avatar name="Test" size="xl" />);
    
    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('w-16');
    expect(avatar).toHaveClass('h-16');
    expect(avatar).toHaveClass('text-lg');
  });

  it('applies custom className', () => {
    render(<Avatar name="Test" className="custom-avatar" />);
    
    const avatar = screen.getByText('T');
    expect(avatar).toHaveClass('custom-avatar');
  });

  it('handles uppercase initials correctly', () => {
    render(<Avatar name="john doe" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('handles names with leading/trailing spaces', () => {
    render(<Avatar name="  John  Doe  " />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<Avatar name="Test User" />);
    
    const avatar = screen.getByText('TU');
    expect(avatar).toHaveAttribute('role', 'img');
    expect(avatar).toHaveAttribute('aria-label', 'Test User');
  });
});
