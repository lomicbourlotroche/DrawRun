import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/Select';

describe('Select component accessibility', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ];

  it('implements combobox pattern correctly', async () => {
    const user = userEvent.setup();
    render(<Select options={options} onChange={() => {}} />);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    // aria-controls is only present when listbox is open
    expect(combobox).not.toHaveAttribute('aria-controls');

    await user.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(combobox.getAttribute('aria-controls')).toBe(listbox.id);

    const optionsElements = screen.getAllByRole('option');
    expect(optionsElements).toHaveLength(2);
  });
});
