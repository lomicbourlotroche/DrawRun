import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { describe, it, expect, vi } from 'vitest';

describe('ThemeToggle', () => {
  it('should have an aria-label for accessibility', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
