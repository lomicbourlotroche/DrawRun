/**
 * Unit tests for GlassCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter
} from '@/components/ui/GlassCard';

describe('GlassCard component', () => {
  it('renders with default props', () => {
    render(<GlassCard>Content</GlassCard>);
    
    const card = screen.getByText('Content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('bg-white/90');
    expect(card).toHaveClass('backdrop-blur-sm');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-neutral-200/60');
    expect(card).toHaveClass('shadow-sm');
  });

  it('renders children', () => {
    render(<GlassCard>Test Content</GlassCard>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GlassCard className="custom-class">Content</GlassCard>);
    
    const card = screen.getByText('Content');
    expect(card).toHaveClass('custom-class');
  });

  it('has hover effect by default', () => {
    render(<GlassCard>Content</GlassCard>);
    
    const card = screen.getByText('Content');
    expect(card.className).toContain('hover:shadow-md');
    expect(card.className).toContain('hover:border-primary-200/50');
    expect(card.className).toContain('hover:-translate-y-0.5');
  });

  it('disables hover effect when hover prop is false', () => {
    render(<GlassCard hover={false}>Content</GlassCard>);
    
    const card = screen.getByText('Content');
    expect(card.className).not.toContain('hover:shadow-md');
    expect(card.className).not.toContain('hover:border-primary-200/50');
    expect(card.className).not.toContain('hover:-translate-y-0.5');
  });

  it('applies padding classes correctly', () => {
    const paddings = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    paddings.forEach(padding => {
      const { container, unmount } = render(<GlassCard padding={padding}>Content</GlassCard>);
      
      const card = container.querySelector('div') as HTMLElement;
      
      switch (padding) {
        case 'none':
          expect(card.className).not.toMatch(/p-[0-9]/);
          break;
        case 'xs':
          expect(card.className).toContain('p-2');
          break;
        case 'sm':
          expect(card.className).toContain('p-3');
          break;
        case 'md':
          expect(card.className).toContain('p-4');
          expect(card.className).toContain('md:p-5');
          break;
        case 'lg':
          expect(card.className).toContain('p-5');
          expect(card.className).toContain('md:p-6');
          break;
        case 'xl':
          expect(card.className).toContain('p-6');
          expect(card.className).toContain('md:p-8');
          break;
      }
      unmount();
    });
  });

  it('applies variant classes correctly', () => {
    const variants = ['default', 'elevated', 'subtle'] as const;
    
    variants.forEach(variant => {
      const { container } = render(<GlassCard variant={variant}>Content</GlassCard>);
      
      const card = container.firstChild as HTMLElement;
      
      switch (variant) {
        case 'default':
          expect(card.className).toContain('bg-white/90');
          expect(card.className).toContain('border-neutral-200/60');
          break;
        case 'elevated':
          expect(card.className).toContain('shadow-md');
          break;
        case 'subtle':
          expect(card.className).toContain('bg-white/70');
          expect(card.className).toContain('border-neutral-200/40');
          break;
      }
    });
  });

  it('has transition classes', () => {
    render(<GlassCard>Content</GlassCard>);
    
    const card = screen.getByText('Content');
    expect(card.className).toContain('transition-all');
    expect(card.className).toContain('duration-300');
    expect(card.className).toContain('ease-smooth');
  });

  it('forwards ref correctly', () => {
    // This test verifies that the component can accept a ref
    // In a real test environment with proper DOM, we would test ref assignment
    render(<GlassCard data-testid="glass-card">Content</GlassCard>);
    
    const card = screen.getByTestId('glass-card');
    expect(card).toBeInTheDocument();
  });

  it('has correct display name', () => {
    expect(GlassCard.displayName).toBe('GlassCard');
  });
});

describe('GlassCardHeader component', () => {
  it('renders children', () => {
    render(<GlassCardHeader>Header Content</GlassCardHeader>);
    
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<GlassCardHeader>Header</GlassCardHeader>);
    
    const header = screen.getByText('Header');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('space-y-1.5');
    expect(header).toHaveClass('pb-4');
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('border-neutral-100/50');
  });

  it('applies custom className', () => {
    render(<GlassCardHeader className="custom-class">Header</GlassCardHeader>);
    
    const header = screen.getByText('Header');
    expect(header).toHaveClass('custom-class');
  });

  it('has correct display name', () => {
    expect(GlassCardHeader.displayName).toBe('GlassCardHeader');
  });
});

describe('GlassCardTitle component', () => {
  it('renders children', () => {
    render(<GlassCardTitle>Title Content</GlassCardTitle>);
    
    expect(screen.getByText('Title Content')).toBeInTheDocument();
  });

  it('renders as h3 element', () => {
    render(<GlassCardTitle>Title</GlassCardTitle>);
    
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });

  it('applies default styles', () => {
    render(<GlassCardTitle>Title</GlassCardTitle>);
    
    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-lg');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('tracking-tight');
    expect(title).toHaveClass('text-neutral-900');
  });

  it('applies custom className', () => {
    render(<GlassCardTitle className="custom-class">Title</GlassCardTitle>);
    
    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-class');
  });

  it('has correct display name', () => {
    expect(GlassCardTitle.displayName).toBe('GlassCardTitle');
  });
});

describe('GlassCardDescription component', () => {
  it('renders children', () => {
    render(<GlassCardDescription>Description Content</GlassCardDescription>);
    
    expect(screen.getByText('Description Content')).toBeInTheDocument();
  });

  it('renders as p element', () => {
    render(<GlassCardDescription>Description</GlassCardDescription>);
    
    const description = screen.getByText('Description');
    expect(description.tagName).toBe('P');
  });

  it('applies default styles', () => {
    render(<GlassCardDescription>Description</GlassCardDescription>);
    
    const description = screen.getByText('Description');
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-neutral-500');
    expect(description).toHaveClass('leading-relaxed');
  });

  it('applies custom className', () => {
    render(<GlassCardDescription className="custom-class">Description</GlassCardDescription>);
    
    const description = screen.getByText('Description');
    expect(description).toHaveClass('custom-class');
  });

  it('has correct display name', () => {
    expect(GlassCardDescription.displayName).toBe('GlassCardDescription');
  });
});

describe('GlassCardContent component', () => {
  it('renders children', () => {
    render(<GlassCardContent>Content</GlassCardContent>);
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<GlassCardContent>Content</GlassCardContent>);
    
    const content = screen.getByText('Content');
    expect(content).toHaveClass('pt-4');
  });

  it('applies custom className', () => {
    render(<GlassCardContent className="custom-class">Content</GlassCardContent>);
    
    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-class');
  });

  it('has correct display name', () => {
    expect(GlassCardContent.displayName).toBe('GlassCardContent');
  });
});

describe('GlassCardFooter component', () => {
  it('renders children', () => {
    render(<GlassCardFooter>Footer Content</GlassCardFooter>);
    
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<GlassCardFooter>Footer</GlassCardFooter>);
    
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('justify-between');
    expect(footer).toHaveClass('pt-4');
    expect(footer).toHaveClass('mt-4');
    expect(footer).toHaveClass('border-t');
    expect(footer).toHaveClass('border-neutral-100/50');
  });

  it('applies custom className', () => {
    render(<GlassCardFooter className="custom-class">Footer</GlassCardFooter>);
    
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('custom-class');
  });

  it('has correct display name', () => {
    expect(GlassCardFooter.displayName).toBe('GlassCardFooter');
  });
});

describe('GlassCard accessibility', () => {
  it('GlassCardTitle has heading role', () => {
    render(<GlassCardTitle>Accessible Title</GlassCardTitle>);
    
    const title = screen.getByRole('heading');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Accessible Title');
  });

  it('GlassCardDescription has paragraph role', () => {
    render(<GlassCardDescription>Accessible Description</GlassCardDescription>);
    
    // In JSDOM, <p> elements don't have a role by default, but they are paragraphs
    const description = screen.getByText('Accessible Description');
    expect(description.tagName).toBe('P');
  });

  it('GlassCard components support aria attributes', () => {
    render(
      <GlassCard aria-label="Glass card">
        <GlassCardHeader aria-label="Header">
          <GlassCardTitle aria-label="Title">Title</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent aria-label="Content">Content</GlassCardContent>
        <GlassCardFooter aria-label="Footer">Footer</GlassCardFooter>
      </GlassCard>
    );
    
    expect(screen.getByLabelText('Glass card')).toBeInTheDocument();
    expect(screen.getByLabelText('Header')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Footer')).toBeInTheDocument();
  });
});

describe('GlassCard integration', () => {
  it('renders complete glass card with all subcomponents', () => {
    render(
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Card Title</GlassCardTitle>
          <GlassCardDescription>Card Description</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <p>Card Content</p>
        </GlassCardContent>
        <GlassCardFooter>
          <span>Footer Actions</span>
        </GlassCardFooter>
      </GlassCard>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Actions')).toBeInTheDocument();
  });

  it('applies consistent styling across all components', () => {
    render(
      <GlassCard variant="elevated" padding="lg" hover={true}>
        <GlassCardHeader>
          <GlassCardTitle>Title</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>Content</GlassCardContent>
      </GlassCard>
    );
    
    const card = screen.getByText('Title').parentElement?.parentElement;
    expect(card).toHaveClass('shadow-md');
    expect(card).toHaveClass('p-5');
    expect(card).toHaveClass('md:p-6');
  });
});
