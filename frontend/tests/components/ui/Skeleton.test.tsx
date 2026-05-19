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
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-surface');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<Skeleton aria-label="Loading" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom dimensions', () => {
    const { container } = render(<Skeleton className="w-10 h-10" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('w-10');
    expect(skeleton).toHaveClass('h-10');
  });

  it('renders with rounded-full for circular skeleton', () => {
    const { container } = render(<Skeleton className="rounded-full" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
  });
});

describe('CardSkeleton component', () => {
  it('renders card skeleton structure', () => {
    const { container } = render(<CardSkeleton />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-surface');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-border');
    expect(card).toHaveClass('rounded-lg');
  });

  it('contains multiple skeleton elements', () => {
    const { container } = render(<CardSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('has proper padding', () => {
    const { container } = render(<CardSkeleton />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-4');
  });

  it('has responsive padding on medium screens', () => {
    const { container } = render(<CardSkeleton />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('md:p-6');
  });
});

describe('ActivitySkeleton component', () => {
  it('renders activity skeleton structure', () => {
    const { container } = render(<ActivitySkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('bg-surface');
    expect(containerEl).toHaveClass('border');
    expect(containerEl).toHaveClass('border-border');
    expect(containerEl).toHaveClass('rounded-lg');
  });

  it('contains avatar skeleton', () => {
    const { container } = render(<ActivitySkeleton />);
    
    const avatarSkeleton = container.querySelector('[aria-label="rounded-full"]') as HTMLElement;
    expect(avatarSkeleton).toHaveClass('w-12');
    expect(avatarSkeleton).toHaveClass('h-12');
    expect(avatarSkeleton).toHaveClass('rounded-full');
  });

  it('has flex container for layout', () => {
    const { container } = render(<ActivitySkeleton />);
    
    const flexContainer = container.querySelector('[aria-label="flex items-center gap-4"]') as HTMLElement;
    expect(flexContainer).toHaveClass('flex');
    expect(flexContainer).toHaveClass('items-center');
    expect(flexContainer).toHaveClass('gap-4');
  });

  it('contains multiple text skeleton elements', () => {
    const { container } = render(<ActivitySkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});

describe('ChartSkeleton component', () => {
  it('renders chart skeleton structure', () => {
    const { container } = render(<ChartSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('bg-surface');
    expect(containerEl).toHaveClass('border');
    expect(containerEl).toHaveClass('border-border');
    expect(containerEl).toHaveClass('rounded-lg');
  });

  it('contains title skeleton', () => {
    const { container } = render(<ChartSkeleton />);
    
    const titleSkeleton = container.querySelector('[aria-label="h-4 w-1/4"]') as HTMLElement;
    expect(titleSkeleton).toHaveClass('h-4');
    expect(titleSkeleton).toHaveClass('w-1/4');
  });

  it('contains chart area skeleton', () => {
    const { container } = render(<ChartSkeleton />);
    
    const chartArea = container.querySelector('[aria-label="h-48 w-full"]') as HTMLElement;
    expect(chartArea).toHaveClass('h-48');
    expect(chartArea).toHaveClass('w-full');
  });

  it('has proper spacing', () => {
    const { container } = render(<ChartSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons[0]).toHaveClass('mb-4');
  });
});

describe('DashboardSkeleton component', () => {
  it('renders dashboard skeleton structure', () => {
    const { container } = render(<DashboardSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains header skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('contains quick stats grid', () => {
    const { container } = render(<DashboardSkeleton />);
    
    const grid = container.querySelector('[aria-label="grid grid-cols-2 lg:grid-cols-4 gap-4"]') as HTMLElement;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains PMC chart skeleton', () => {
    const { container } = render(<DashboardSkeleton />);
    
    const chartSkeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(Array.from(chartSkeletons).some(s => s.className.includes('h-48'))).toBe(true);
  });

  it('contains recommendation section', () => {
    const { container } = render(<DashboardSkeleton />);
    
    const recommendation = container.querySelector('[aria-label="bg-surface border border-border rounded-lg p-4 md:p-6"]') as HTMLElement;
    expect(recommendation).toBeInTheDocument();
  });
});

describe('ActivitiesSkeleton component', () => {
  it('renders activities skeleton structure', () => {
    const { container } = render(<ActivitiesSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains header with title and button', () => {
    const { container } = render(<ActivitiesSkeleton />);
    
    const header = container.querySelector('[aria-label="flex justify-between items-center"]') as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('justify-between');
    expect(header).toHaveClass('items-center');
  });

  it('contains multiple activity skeletons', () => {
    const { container } = render(<ActivitiesSkeleton />);
    
    const activitySkeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(activitySkeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('has proper spacing between activities', () => {
    const { container } = render(<ActivitiesSkeleton />);
    
    const activitiesContainer = container.querySelector('[aria-label="space-y-4"]') as HTMLElement;
    expect(activitiesContainer).toHaveClass('space-y-4');
  });
});

describe('ProfileSkeleton component', () => {
  it('renders profile skeleton structure', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains header with avatar', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const header = container.querySelector('[aria-label="flex items-center gap-6"]') as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
    expect(header).toHaveClass('gap-6');
  });

  it('contains large avatar skeleton', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const avatar = container.querySelector('[aria-label="h-24 w-24 rounded-full"]') as HTMLElement;
    expect(avatar).toHaveClass('h-24');
    expect(avatar).toHaveClass('w-24');
    expect(avatar).toHaveClass('rounded-full');
  });

  it('contains form skeleton', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const form = container.querySelector('[aria-label="space-y-4"]') as HTMLElement;
    expect(form).toHaveClass('space-y-4');
  });

  it('contains multiple form field skeletons', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('contains submit button skeleton', () => {
    const { container } = render(<ProfileSkeleton />);
    
    const submitButton = container.querySelector('[aria-label="h-12 w-32"]') as HTMLElement;
    expect(submitButton).toHaveClass('h-12');
    expect(submitButton).toHaveClass('w-32');
  });
});

describe('CoachSkeleton component', () => {
  it('renders coach skeleton structure', () => {
    const { container } = render(<CoachSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains title skeleton', () => {
    const { container } = render(<CoachSkeleton />);
    
    const title = container.querySelector('[aria-label="h-8 w-40"]') as HTMLElement;
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-40');
  });

  it('contains plans grid', () => {
    const { container } = render(<CoachSkeleton />);
    
    const grid = container.querySelector('[aria-label="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"]') as HTMLElement;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains multiple card skeletons', () => {
    const { container } = render(<CoachSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SocialSkeleton component', () => {
  it('renders social skeleton structure', () => {
    const { container } = render(<SocialSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains tabs skeleton', () => {
    const { container } = render(<SocialSkeleton />);
    
    const tabsContainer = container.querySelector('[aria-label="flex gap-2 border-b border-border pb-4"]') as HTMLElement;
    expect(tabsContainer).toHaveClass('flex');
    expect(tabsContainer).toHaveClass('gap-2');
    expect(tabsContainer).toHaveClass('border-b');
    expect(tabsContainer).toHaveClass('border-border');
  });

  it('contains multiple tab skeletons', () => {
    const { container } = render(<SocialSkeleton />);
    
    const tabSkeletons = container.querySelectorAll('[aria-label="h-10 w-24"]');
    expect(tabSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('contains feed items', () => {
    const { container } = render(<SocialSkeleton />);
    
    const feedContainer = container.querySelector('[aria-label="space-y-4"]') as HTMLElement;
    expect(feedContainer).toHaveClass('space-y-4');
  });

  it('contains feed item skeletons', () => {
    const { container } = render(<SocialSkeleton />);
    
    const feedItems = container.querySelectorAll('[class*="animate-pulse"]');
    expect(feedItems.length).toBeGreaterThanOrEqual(10);
  });
});

describe('PerformanceSkeleton component', () => {
  it('renders performance skeleton structure', () => {
    const { container } = render(<PerformanceSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('contains title skeleton', () => {
    const { container } = render(<PerformanceSkeleton />);
    
    const title = container.querySelector('[aria-label="h-8 w-48"]') as HTMLElement;
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-48');
  });

  it('contains stats cards grid', () => {
    const { container } = render(<PerformanceSkeleton />);
    
    const grid = container.querySelector('[aria-label="grid grid-cols-2 lg:grid-cols-4 gap-4"]') as HTMLElement;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-4');
  });

  it('contains 8 stat skeletons', () => {
    const { container } = render(<PerformanceSkeleton />);
    
    const statSkeletons = container.querySelectorAll('[aria-label="h-24 w-full"]');
    expect(statSkeletons.length).toBe(8);
  });

  it('contains charts grid', () => {
    const { container } = render(<PerformanceSkeleton />);
    
    const chartsGrid = container.querySelector('[aria-label="grid grid-cols-1 lg:grid-cols-2 gap-6"]') as HTMLElement;
    expect(chartsGrid).toHaveClass('grid');
    expect(chartsGrid).toHaveClass('grid-cols-1');
    expect(chartsGrid).toHaveClass('lg:grid-cols-2');
    expect(chartsGrid).toHaveClass('gap-6');
  });
});

describe('PageSkeleton component', () => {
  it('renders page skeleton with title by default', () => {
    const { container } = render(<PageSkeleton />);
    
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
    expect(containerEl).toHaveClass('animate-fade-in');
  });

  it('renders title skeleton when title prop is true', () => {
    const { container } = render(<PageSkeleton title={true} />);
    
    const title = container.querySelector('[aria-label="h-8 w-48"]') as HTMLElement;
    expect(title).toHaveClass('h-8');
    expect(title).toHaveClass('w-48');
  });

  it('does not render title skeleton when title prop is false', () => {
    const { container } = render(<PageSkeleton title={false} />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    const titleSkeletons = Array.from(skeletons).filter(s => s.className.includes('h-8') && s.className.includes('w-48'));
    expect(titleSkeletons.length).toBe(0);
  });

  it('contains content container', () => {
    const { container } = render(<PageSkeleton />);
    
    const content = container.querySelector('[aria-label="bg-surface border border-border rounded-lg p-6 space-y-4"]') as HTMLElement;
    expect(content).toHaveClass('bg-surface');
    expect(content).toHaveClass('border');
    expect(content).toHaveClass('border-border');
    expect(content).toHaveClass('rounded-lg');
    expect(content).toHaveClass('p-6');
  });

  it('contains multiple content skeletons', () => {
    const { container } = render(<PageSkeleton />);
    
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Skeleton components accessibility', () => {
  it('Skeleton has role attribute', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('role', 'generic');
  });

  it('Skeleton supports aria-label', () => {
    const { container } = render(<Skeleton aria-label="Loading content" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('Skeleton supports aria-hidden', () => {
    const { container } = render(<Skeleton aria-hidden="true" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('all skeleton components have animate-pulse class', () => {
    const components = [
      <DashboardSkeleton key="d" />,
      <ActivitiesSkeleton key="a" />,
      <ProfileSkeleton key="p" />,
      <CoachSkeleton key="c" />,
      <SocialSkeleton key="s" />,
      <PerformanceSkeleton key="perf" />,
      <PageSkeleton key="page" />
    ];

    components.forEach((component) => {
      const { container } = render(component);
      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl).toHaveClass('animate-fade-in');
    });
  });
});
