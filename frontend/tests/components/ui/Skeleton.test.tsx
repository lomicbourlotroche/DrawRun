import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
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
  PageSkeleton,
} from '@/components/ui/Skeleton';

describe('Skeleton component', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-shimmer');
    expect(skeleton).toHaveClass('bg-muted/30');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-shimmer');
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Chargement...');
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
    expect(card).toHaveClass('rounded-xl');
  });

  it('contains multiple skeleton elements', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
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
    expect(containerEl).toHaveClass('rounded-xl');
  });

  it('contains avatar skeleton', () => {
    const { container } = render(<ActivitySkeleton />);
    const roundedElements = container.querySelectorAll('.rounded-full');
    expect(roundedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('has flex container for layout', () => {
    const { container } = render(<ActivitySkeleton />);
    const flexContainer = container.firstChild?.firstChild as HTMLElement;
    expect(flexContainer).toHaveClass('flex');
    expect(flexContainer).toHaveClass('items-center');
    expect(flexContainer).toHaveClass('gap-4');
  });

  it('contains multiple skeleton elements', () => {
    const { container } = render(<ActivitySkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
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
    expect(containerEl).toHaveClass('rounded-xl');
  });

  it('contains title skeleton', () => {
    const { container } = render(<ChartSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const titleSkeleton = Array.from(skeletons).find((s) => s.classList.contains('w-1/4'));
    expect(titleSkeleton).toBeTruthy();
    expect(titleSkeleton).toHaveClass('h-4');
  });

  it('contains chart area skeleton', () => {
    const { container } = render(<ChartSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const chartSkeleton = Array.from(skeletons).find((s) => s.classList.contains('h-32'));
    expect(chartSkeleton).toBeTruthy();
    expect(chartSkeleton).toHaveClass('w-full');
    expect(chartSkeleton).toHaveClass('rounded-lg');
  });

  it('has proper spacing', () => {
    const { container } = render(<ChartSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons[0]).toHaveClass('mb-4');
  });
});

describe('DashboardSkeleton component', () => {
  it('renders dashboard skeleton structure', () => {
    const { container } = render(<DashboardSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('contains header skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('contains quick stats grid', () => {
    const { container } = render(<DashboardSkeleton />);
    const grids = container.querySelectorAll('.grid');
    const statsGrid = Array.from(grids).find((g) => g.classList.contains('grid-cols-2'));
    expect(statsGrid).toBeTruthy();
    expect(statsGrid).toHaveClass('lg:grid-cols-4');
    expect(statsGrid).toHaveClass('gap-4');
  });

  it('contains chart skeleton', () => {
    const { container } = render(<DashboardSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(Array.from(skeletons).some((s) => s.classList.contains('h-32'))).toBe(true);
  });

  it('contains recommendation section', () => {
    const { container } = render(<DashboardSkeleton />);
    const sections = container.querySelectorAll('.rounded-xl');
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ActivitiesSkeleton component', () => {
  it('renders activities skeleton structure', () => {
    const { container } = render(<ActivitiesSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-4');
  });

  it('contains header with title and button', () => {
    const { container } = render(<ActivitiesSkeleton />);
    const header = container.querySelector('.justify-between') as HTMLElement;
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
  });

  it('contains multiple activity skeletons', () => {
    const { container } = render(<ActivitiesSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('has proper spacing between activities', () => {
    const { container } = render(<ActivitiesSkeleton />);
    const activitiesContainer = container.querySelector('.space-y-4') as HTMLElement;
    expect(activitiesContainer).toBeInTheDocument();
  });
});

describe('ProfileSkeleton component', () => {
  it('renders profile skeleton structure', () => {
    const { container } = render(<ProfileSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('contains header with avatar', () => {
    const { container } = render(<ProfileSkeleton />);
    const roundedFull = container.querySelectorAll('.rounded-full');
    expect(roundedFull.length).toBeGreaterThanOrEqual(1);
  });

  it('contains large avatar skeleton', () => {
    const { container } = render(<ProfileSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const avatar = Array.from(skeletons).find((s) => s.classList.contains('h-24'));
    expect(avatar).toBeTruthy();
    expect(avatar).toHaveClass('w-24');
  });

  it('contains form field skeletons', () => {
    const { container } = render(<ProfileSkeleton />);
    const formSections = container.querySelectorAll('.space-y-2');
    expect(formSections.length).toBeGreaterThanOrEqual(4);
  });

  it('contains multiple form field skeletons', () => {
    const { container } = render(<ProfileSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('contains submit button skeleton', () => {
    const { container } = render(<ProfileSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const button = Array.from(skeletons).find((s) => s.classList.contains('h-12') && s.classList.contains('w-32'));
    expect(button).toBeTruthy();
  });
});

describe('CoachSkeleton component', () => {
  it('renders coach skeleton structure', () => {
    const { container } = render(<CoachSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('contains title skeleton', () => {
    const { container } = render(<CoachSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const title = Array.from(skeletons).find((s) => s.classList.contains('w-40'));
    expect(title).toBeTruthy();
    expect(title).toHaveClass('h-8');
  });

  it('contains plans grid', () => {
    const { container } = render(<CoachSkeleton />);
    const grids = container.querySelectorAll('.grid');
    const planGrid = Array.from(grids).find((g) => g.classList.contains('grid-cols-1'));
    expect(planGrid).toBeTruthy();
    expect(planGrid).toHaveClass('md:grid-cols-2');
    expect(planGrid).toHaveClass('lg:grid-cols-3');
    expect(planGrid).toHaveClass('gap-4');
  });

  it('contains multiple card skeletons', () => {
    const { container } = render(<CoachSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SocialSkeleton component', () => {
  it('renders social skeleton structure', () => {
    const { container } = render(<SocialSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('contains tabs skeleton', () => {
    const { container } = render(<SocialSkeleton />);
    const tabBar = container.querySelector('.border-b') as HTMLElement;
    expect(tabBar).toHaveClass('flex');
    expect(tabBar).toHaveClass('gap-2');
    expect(tabBar).toHaveClass('border-border');
  });

  it('contains multiple tab skeletons', () => {
    const { container } = render(<SocialSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const tabSkeletons = Array.from(skeletons).filter(
      (s) => s.classList.contains('h-10') && s.classList.contains('w-24'),
    );
    expect(tabSkeletons.length).toBeGreaterThanOrEqual(4);
  });

  it('contains feed items', () => {
    const { container } = render(<SocialSkeleton />);
    const feedContainers = container.querySelectorAll('.space-y-4');
    const feedContainer = feedContainers[feedContainers.length - 1];
    expect(feedContainer).toBeInTheDocument();
  });

  it('contains feed item skeletons', () => {
    const { container } = render(<SocialSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });
});

describe('PerformanceSkeleton component', () => {
  it('renders performance skeleton structure', () => {
    const { container } = render(<PerformanceSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('contains title skeleton', () => {
    const { container } = render(<PerformanceSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const title = Array.from(skeletons).find((s) => s.classList.contains('w-48'));
    expect(title).toBeTruthy();
    expect(title).toHaveClass('h-8');
  });

  it('contains stats cards grid', () => {
    const { container } = render(<PerformanceSkeleton />);
    const grids = container.querySelectorAll('.grid');
    const statsGrid = Array.from(grids).find((g) => g.classList.contains('grid-cols-2'));
    expect(statsGrid).toBeTruthy();
    expect(statsGrid).toHaveClass('lg:grid-cols-4');
    expect(statsGrid).toHaveClass('gap-4');
  });

  it('contains 8 stat skeletons', () => {
    const { container } = render(<PerformanceSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const statSkeletons = Array.from(skeletons).filter((s) => s.classList.contains('h-24'));
    expect(statSkeletons.length).toBe(8);
  });

  it('contains charts grid', () => {
    const { container } = render(<PerformanceSkeleton />);
    const grids = container.querySelectorAll('.grid');
    const chartsGrid = Array.from(grids).find(
      (g) => g.classList.contains('lg:grid-cols-2') && g.classList.contains('gap-6'),
    );
    expect(chartsGrid).toBeTruthy();
    expect(chartsGrid).toHaveClass('grid-cols-1');
  });
});

describe('PageSkeleton component', () => {
  it('renders page skeleton with title by default', () => {
    const { container } = render(<PageSkeleton />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toBeInTheDocument();
    expect(containerEl).toHaveClass('space-y-6');
  });

  it('renders title skeleton when title prop is true', () => {
    const { container } = render(<PageSkeleton title={true} />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const title = Array.from(skeletons).find((s) => s.classList.contains('h-8') && s.classList.contains('w-48'));
    expect(title).toBeTruthy();
  });

  it('does not render title skeleton when title prop is false', () => {
    const { container } = render(<PageSkeleton title={false} />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    const titleSkeletons = Array.from(skeletons).filter(
      (s) => s.classList.contains('h-8') && s.classList.contains('w-48'),
    );
    expect(titleSkeletons.length).toBe(0);
  });

  it('contains content container', () => {
    const { container } = render(<PageSkeleton />);
    const content = container.querySelector('.rounded-xl') as HTMLElement;
    expect(content).toHaveClass('bg-surface');
    expect(content).toHaveClass('border');
    expect(content).toHaveClass('border-border');
    expect(content).toHaveClass('p-6');
  });

  it('contains multiple content skeletons', () => {
    const { container } = render(<PageSkeleton />);
    const skeletons = container.querySelectorAll('[class*="animate-shimmer"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Skeleton components accessibility', () => {
  it('Skeleton has role attribute', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('role', 'status');
  });

  it('Skeleton supports aria-label override', () => {
    const { container } = render(<Skeleton aria-label="Loading content" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
  });

  it('Skeleton supports aria-hidden', () => {
    const { container } = render(<Skeleton aria-hidden="true" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('all skeleton wrappers have role="status"', () => {
    const components = [
      <DashboardSkeleton key="d" />,
      <ActivitiesSkeleton key="a" />,
      <ProfileSkeleton key="p" />,
      <CoachSkeleton key="c" />,
      <SocialSkeleton key="s" />,
      <PerformanceSkeleton key="perf" />,
      <PageSkeleton key="page" />,
    ];

    components.forEach((component) => {
      const { container } = render(component);
      const el = container.firstChild as HTMLElement;
      expect(el).toHaveAttribute('role', 'status');
    });
  });
});
