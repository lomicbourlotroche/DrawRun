/**
 * Unit tests for Input component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input component', () => {
  it('renders with default props', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('bg-surface');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('rounded-lg');
  });

  it('renders with label', () => {
    render(<Input label="Test Label" />);

    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for');
  });

  it('renders with error message', () => {
    render(<Input error="Error message" />);

    const error = screen.getByText('Error message');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-danger');
  });

  it('renders with hint message', () => {
    render(<Input hint="Hint message" />);

    const hint = screen.getByText('Hint message');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveClass('text-muted');
  });

  it('does not render hint when error is present', () => {
    render(<Input error="Error" hint="Hint" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<span>🔍</span>} />);

    const icon = screen.getByText('🔍');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('absolute');
    expect(icon).toHaveClass('left-3');
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<span>✓</span>} />);

    const icon = screen.getByText('✓');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('absolute');
    expect(icon).toHaveClass('right-3');
  });

  it('applies error border style when error is present', () => {
    render(<Input error="Error" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-danger-400');
  });

  it('applies default border style when no error', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-border');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('supports different input types', () => {
    render(<Input type="password" />);

    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('supports placeholder', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('supports default value', () => {
    render(<Input defaultValue="Default value" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Default value');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalledTimes(4);
  });

  it('supports disabled state', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports required attribute', () => {
    render(<Input required />);

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('has correct accessibility attributes', () => {
    render(<Input label="Name" id="name-input" />);

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Name');

    expect(input).toHaveAttribute('id', 'name-input');
    expect(label).toHaveAttribute('for', 'name-input');
  });

  it('generates unique id when not provided', () => {
    render(<Input label="Test Input" />);

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Input');

    // check that ID exists and label points to it
    expect(input.id).toBeTruthy();
    expect(label).toHaveAttribute('for', input.id);
  });
});
