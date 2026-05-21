import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlassCard } from '@/components/ui';

describe('debug', () => {
  it('debug glass card classes', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    console.log('CLASSES:', card.className);
    console.log('HOVER:', card.className.includes('hover:shadow'));
  });
});
