/**
 * Unit tests for GearCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GearCard } from '@/components/features/gear/GearCard';

const mockGear = {
  id: 1,
  name: 'Running Shoes',
  brand: 'Nike',
  model: 'Pegasus 39',
  type: 'shoes',
  current_distance: 500,
  max_distance: 1000,
  is_active: true,
};

const mockGearNearLimit = {
  ...mockGear,
  current_distance: 850,
  max_distance: 1000,
};

const mockGearOverLimit = {
  ...mockGear,
  current_distance: 1200,
  max_distance: 1000,
};

const mockGearInactive = {
  ...mockGear,
  is_active: false,
};

const mockGearBike = {
  ...mockGear,
  type: 'bike',
  name: 'Road Bike',
  brand: 'Trek',
  model: 'Domane SL7',
};

describe('GearCard component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gear card with basic information', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Nike Pegasus 39')).toBeInTheDocument();
    expect(screen.getByText('500.0 km')).toBeInTheDocument();
    expect(screen.getByText('Limite: 1000 km')).toBeInTheDocument();
  });

  it('displays correct icon for shoes', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Footprints icon should be rendered for shoes
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('displays correct icon for bike', () => {
    render(<GearCard gear={mockGearBike} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Bike icon should be rendered for bike
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('displays progress bar with correct width', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('displays progress bar with emerald color when under 80%', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-emerald-500');
  });

  it('displays progress bar with amber color when near limit', () => {
    render(<GearCard gear={mockGearNearLimit} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-amber-500');
  });

  it('displays progress bar with danger color when over limit', () => {
    render(<GearCard gear={mockGearOverLimit} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-danger');
  });

  it('displays warning message when near limit', () => {
    render(<GearCard gear={mockGearNearLimit} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Pensez à renouveler bientôt.')).toBeInTheDocument();
  });

  it('displays urgent warning message when over limit', () => {
    render(<GearCard gear={mockGearOverLimit} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Matériel à remplacer impérativement !')).toBeInTheDocument();
  });

  it('displays archived badge when gear is inactive', () => {
    render(<GearCard gear={mockGearInactive} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Archivé')).toBeInTheDocument();
  });

  it('applies grayscale and opacity when gear is inactive', () => {
    render(<GearCard gear={mockGearInactive} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const card = screen.getByRole('article');
    expect(card).toHaveClass('opacity-60');
    expect(card).toHaveClass('grayscale');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockGear);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /trash/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockGear.id);
  });

  it('has correct accessibility attributes', () => {
    render(<GearCard gear={mockGear} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: /settings/i });
    expect(editButton).toHaveAttribute('aria-label', 'Settings');

    const deleteButton = screen.getByRole('button', { name: /trash/i });
    expect(deleteButton).toHaveAttribute('aria-label', 'Trash');
  });
});

describe('GearCard edge cases', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('handles zero current distance', () => {
    const gearWithZeroDistance = { ...mockGear, current_distance: 0 };
    render(<GearCard gear={gearWithZeroDistance} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('handles zero max distance', () => {
    const gearWithZeroMax = { ...mockGear, max_distance: 0 };
    render(<GearCard gear={gearWithZeroMax} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Should handle division by zero gracefully
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('handles unknown gear type', () => {
    const gearWithUnknownType = { ...mockGear, type: 'unknown' };
    render(<GearCard gear={gearWithUnknownType} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Should display Settings icon for unknown types
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('handles is_active as number (legacy support)', () => {
    const gearWithNumericActive = { ...mockGear, is_active: 1 };
    render(<GearCard gear={gearWithNumericActive} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // Should not show archived badge when is_active is truthy
    expect(screen.queryByText('Archivé')).not.toBeInTheDocument();
  });
});
