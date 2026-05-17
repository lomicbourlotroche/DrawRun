/**
 * Unit tests for Skeleton components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  CardSkeleton,
  ActivitySkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  ActivitiesSkeleton,
  ProfileSkeleton,
  CoachSkeleton,
  SocialSkeleton,
  PerformanceSkeleton,
  PageSkeleton
} from '@/components/ui/Skeleton';

describe('Skeleton component', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-surface');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('has correct accessibility attributes', () => {
    render(<Skeleton aria-label="Loading" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom dimensions', () => {
    render(<Skeleton className="w-10 h-10" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('w-10');
    expect(skeleton).toHaveClass('h-10');
  });

  it('renders with rounded-full for circular skeleton', () => {
    render(<Skeleton className="rounded-full" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('rounded-full');
  });
});

describe('CardSkeleton component', () => {
  it('renders card skeleton structure', () => {
    render(<CardSkeleton />);
    
    const card = screen.getByRole('generic');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-surface');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-border');
    expect(card).toHaveClass('rounded-lg');
  });

  it('contains multiple skeleton elements', () => {
    render(<CardSkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('has proper padding', () => {
    render(<CardSkeleton />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('p-4');
  });

  it('has responsive padding on medium screens', () => {
    render(<CardSkeleton />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('md:p-6');
  });
});

describe('ActivitySkeleton component', () => {
  it('renders activity skeleton structure', () => {
    render(<ActivitySkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-surface');
    expect(container).toHaveClass('border');
    expect(container).toHaveClass('border-border');
    expect(container).toHaveClass('rounded-lg');
  });

  it('contains avatar skeleton', () => {
    render(<ActivitySkeleton />);
    
    const avatarSkeleton = screen.getByRole('generic', { name: /rounded-full/ });
    expect(avatarSkeleton).toHaveClass('w-12');
    expect(avatarSkeleton).toHaveClass('h-12');
    expect(avatarSkeleton).toHaveClass('rounded-full');
  });

  it('has flex container for layout', () => {
    render(<ActivitySkeleton />);
    
    const flexContainer = screen.getByRole('generic', { name: /flex items-center/ });
    expect(flexContainer).toHaveClass('flex');
    expect(flexContainer).toHaveClass('items-center');
    expect(flexContainer).toHaveClass('gap-4');
  });

  it('contains multiple text skeleton elements', () => {
    render(<ActivitySkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});

describe('ChartSkeleton component', () => {
  it('renders chart skeleton structure', () => {
    render(<ChartSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-surface');
    expect(container).toHaveClass('border');
    expect(container).toHaveClass('border-border');
    expect(container).toHaveClass('rounded-lg');
  });

  it('contains title skeleton', () => {
    render(<ChartSkeleton />);
    
    const titleSkeleton = screen.getByRole('generic', { name: /h-4 w-1\/4/ });
    expect(titleSkeleton).toHaveClass('h-4');
    expect(titleSkeleton).toHaveClass('w-1/4');
  });

  it('contains chart area skeleton', () => {
    render(<ChartSkeleton />);
    
    const chartArea = screen.getByRole('generic', { name: /h-48 w-full/ });
    expect(chartArea).toHaveClass('h-48');
    expect(chartArea).toHaveClass('w-full');
  });

  it('has proper spacing', () => {
    render(<ChartSkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons[0]).toHaveClass('mb-4');
  });
});

describe('DashboardSkeleton component', () => {
  it('renders dashboard skeleton structure', () => {
    render(<DashboardSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains header skeletons', () => {
    render(<DashboardSkeleton />);
    
    const headerSkeletons = screen.getAllByRole('generic');
    expect(headerSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('contains quick stats grid', () => {
    render(<DashboardSkeleton />);
    
    const grid = screen.getByRole('generic', { name: /grid grid-cols/ });
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains PMC chart skeleton', () => {
    render(<DashboardSkeleton />);
    
    // ChartSkeleton should be rendered
    const chartSkeletons = screen.getAllByRole('generic');
    expect(chartSkeletons.some(s => s.className.includes('h-48'))).toBe(true);
  });

  it('contains recommendation section', () => {
    render(<DashboardSkeleton />);
    
    const recommendation = screen.getByRole('generic', { name: /bg-surface border/ });
    expect(recommendation).toBeInTheDocument();
  });
});

describe('ActivitiesSkeleton component', () => {
  it('renders activities skeleton structure', () => {
    render(<ActivitiesSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains header with title and button', () => {
    render(<ActivitiesSkeleton />);
    
    const header = screen.getByRole('generic', { name: /flex justify-between/ });
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('justify-between');
    expect(header).toHaveClass('items-center');
  });

  it('contains multiple activity skeletons', () => {
    render(<ActivitiesSkeleton />);
    
    const activitySkeletons = screen.getAllByRole('generic');
    // Should have header skeletons + 5 activity skeletons
    expect(activitySkeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('has proper spacing between activities', () => {
    render(<ActivitiesSkeleton />);
    
    const activitiesContainer = screen.getByRole('generic', { name: /space-y-4/ });
    expect(activitiesContainer).toHaveClass('space-y-4');
  });
});

describe('ProfileSkeleton component', () => {
  it('renders profile skeleton structure', () => {
    render(<ProfileSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains header with avatar', () => {
    render(<ProfileSkeleton />);
    
    const header = screen.getByRole('generic', { name: /flex items-center gap/ });
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
    expect(header).toHaveClass('gap-6');
  });

  it('contains large avatar skeleton', () => {
    render(<ProfileSkeleton />);
    
    const avatar = screen.getByRole('generic', { name: /h-24 w-24 rounded-full/ });
    expect(avatar).toHaveClass('h-24');
    expect(avatar).toHaveClass('w-24');
    expect(avatar).toHaveClass('rounded-full');
  });

  it('contains form skeleton', () => {
    render(<ProfileSkeleton />);
    
    const form = screen.getByRole('generic', { name: /space-y-4/ });
    expect(form).toHaveClass('space-y-4');
  });

  it('contains multiple form field skeletons', () => {
    render(<ProfileSkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('contains submit button skeleton', () => {
    render(<ProfileSkeleton />);
    
    const submitButton = screen.getByRole('generic', { name: /h-12 w-32/ });
    expect(submitButton).toHaveClass('h-12');
    expect(submitButton).toHaveClass('w-32');
  });
});

describe('CoachSkeleton component', () => {
  it('renders coach skeleton structure', () => {
    render(<CoachSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains title skeleton', () => {
    render(<CoachSkeleton />);
    
    const title = screen.getByRole('generic', { name: /h-8 w-40/ });
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-40');
  });

  it('contains plans grid', () => {
    render(<CoachSkeleton />);
    
    const grid = screen.getByRole('generic', { name: /grid grid-cols-1/ });
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains multiple card skeletons', () => {
    render(<CoachSkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    // Should have title + 3 card skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SocialSkeleton component', () => {
  it('renders social skeleton structure', () => {
    render(<SocialSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains tabs skeleton', () => {
    render(<SocialSkeleton />);
    
    const tabsContainer = screen.getByRole('generic', { name: /flex gap-2/ });
    expect(tabsContainer).toHaveClass('flex');
    expect(tabsContainer).toHaveClass('gap-2');
    expect(tabsContainer).toHaveClass('border-b');
    expect(tabsContainer).toHaveClass('border-border');
  });

  it('contains multiple tab skeletons', () => {
    render(<SocialSkeleton />);
    
    const tabSkeletons = screen.getAllByRole('generic', { name: /h-10 w-24/ });
    expect(tabSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('contains feed items', () => {
    render(<SocialSkeleton />);
    
    const feedContainer = screen.getByRole('generic', { name: /space-y-4/ });
    expect(feedContainer).toHaveClass('space-y-4');
  });

  it('contains feed item skeletons', () => {
    render(<SocialSkeleton />);
    
    const feedItems = screen.getAllByRole('generic');
    // Should have tabs + feed items
    expect(feedItems.length).toBeGreaterThanOrEqual(10);
  });
});

describe('PerformanceSkeleton component', () => {
  it('renders performance skeleton structure', () => {
    render(<PerformanceSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('contains title skeleton', () => {
    render(<PerformanceSkeleton />);
    
    const title = screen.getByRole('generic', { name: /h-8 w-48/ });
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-48');
  });

  it('contains stats cards grid', () => {
    render(<PerformanceSkeleton />);
    
    const grid = screen.getByRole('generic', { name: /grid grid-cols-2/ });
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains 8 stat skeletons', () => {
    render(<PerformanceSkeleton />);
    
    const statSkeletons = screen.getAllByRole('generic', { name: /h-24 w-full/ });
    expect(statSkeletons.length).toBe(8);
  });

  it('contains charts grid', () => {
    render(<PerformanceSkeleton />);
    
    const chartsGrid = screen.getByRole('generic', { name: /grid grid-cols-1 lg:grid-cols-2/ });
    expect(chartsGrid).toHaveClass('grid');
    expect(chartsGrid).toHaveClass('grid-cols-1');
    expect(chartsGrid).toHaveClass('lg:grid-cols-2');
    expect(chartsGrid).toHaveClass('gap-6');
  });
});

describe('PageSkeleton component', () => {
  it('renders page skeleton with title by default', () => {
    render(<PageSkeleton />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('animate-fade-in');
  });

  it('renders title skeleton when title prop is true', () => {
    render(<PageSkeleton title={true} />);
    
    const title = screen.getByRole('generic', { name: /h-8 w-48/ });
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-48');
  });

  it('does not render title skeleton when title prop is false', () => {
    render(<PageSkeleton title={false} />);
    
    const skeletons = screen.getAllByRole('generic');
    // Should only have content skeletons, no title
    const titleSkeletons = skeletons.filter(s => s.className.includes('h-8 w-48'));
    expect(titleSkeletons.length).toBe(0);
  });

  it('contains content container', () => {
    render(<PageSkeleton />);
    
    const content = screen.getByRole('generic', { name: /bg-surface border/ });
    expect(content).toHaveClass('bg-surface');
    expect(content).toHaveClass('border');
    expect(content).toHaveClass('border-border');
    expect(content).toHaveClass('rounded-lg');
    expect(content).toHaveClass('p-6');
  });

  it('contains multiple content skeletons', () => {
    render(<PageSkeleton />);
    
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Skeleton components accessibility', () => {
  it('Skeleton has role attribute', () => {
    render(<Skeleton />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveAttribute('role', 'generic');
  });

  it('Skeleton supports aria-label', () => {
    render(<Skeleton aria-label="Loading content" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('Skeleton supports aria-hidden', () => {
    render(<Skeleton aria-hidden="true" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('all skeleton components have animate-pulse class', () => {
    const components = [
      <DashboardSkeleton />,
      <ActivitiesSkeleton />,
      <ProfileSkeleton />,
      <CoachSkeleton />,
      <SocialSkeleton />,
      <PerformanceSkeleton />,
      <PageSkeleton />
    ];

    components.forEach((component, index) => {
      render(component);
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('animate-fade-in');
    });
  });
});
