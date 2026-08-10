import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrawButton } from '@/components/features/social/DrawButton';
import { api } from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    toggleActivityDraw: vi.fn(),
  },
}));

describe('DrawButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial draw count', () => {
    render(<DrawButton activityId={1} ownerId={2} initialDrawCount={5} initialHasDrawn={false} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows "Draw" text when count is 0', () => {
    render(<DrawButton activityId={1} ownerId={2} initialDrawCount={0} initialHasDrawn={false} />);

    expect(screen.getByText('Draw')).toBeInTheDocument();
  });

  it('toggles draw state on click', async () => {
    vi.mocked(api.toggleActivityDraw).mockResolvedValueOnce({
      success: true,
      draw_count: 6,
      has_drawn: true,
      message: 'Draw given',
    });

    render(<DrawButton activityId={1} ownerId={2} initialDrawCount={5} initialHasDrawn={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.toggleActivityDraw).toHaveBeenCalledWith(1, 2);
    });
  });

  it('displays loading state while submitting', async () => {
    vi.mocked(api.toggleActivityDraw).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<DrawButton activityId={1} ownerId={2} initialDrawCount={5} initialHasDrawn={false} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  it('calls onDrawChange callback when draw toggled', async () => {
    const onDrawChange = vi.fn();
    vi.mocked(api.toggleActivityDraw).mockResolvedValueOnce({
      success: true,
      draw_count: 6,
      has_drawn: true,
    });

    render(
      <DrawButton
        activityId={1}
        ownerId={2}
        initialDrawCount={5}
        initialHasDrawn={false}
        onDrawChange={onDrawChange}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onDrawChange).toHaveBeenCalledWith(true, 6);
    });
  });
});
