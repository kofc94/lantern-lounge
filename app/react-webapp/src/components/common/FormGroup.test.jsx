import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormGroup from './FormGroup';

describe('FormGroup Component', () => {
  it('renders text input correctly', () => {
    render(<FormGroup label="Name" name="name" type="text" placeholder="Enter name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toHaveAttribute('type', 'text');
  });

  it('renders required indicator', () => {
    render(<FormGroup label="Email" name="email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders helper text and errors', () => {
    const { rerender } = render(<FormGroup label="Field" name="field" helperText="Some helper" />);
    expect(screen.getByText('Some helper')).toBeInTheDocument();

    rerender(<FormGroup label="Field" name="field" helperText="Some helper" error="An error occurred" />);
    expect(screen.queryByText('Some helper')).not.toBeInTheDocument(); // Helper text is hidden when error exists
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = vi.fn();
    render(<FormGroup label="Test" name="test" onChange={handleChange} />);
    
    fireEvent.change(screen.getByLabelText('Test'), { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders textarea', () => {
    render(<FormGroup label="Notes" name="notes" type="textarea" rows={5} />);
    const textarea = screen.getByLabelText('Notes');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('renders select with options', () => {
    const options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    render(<FormGroup label="Choices" name="choices" type="select" options={options} />);
    
    const select = screen.getByLabelText('Choices');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders checkbox', () => {
    render(<FormGroup label="Accept terms" name="terms" type="checkbox" />);
    const checkbox = screen.getByLabelText('Accept terms');
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('is disabled when disabled prop is true', () => {
    render(<FormGroup label="Disabled Field" name="disabledField" disabled />);
    const input = screen.getByLabelText('Disabled Field');
    expect(input).toBeDisabled();
  });

  it('applies correct theme classes', () => {
    const { rerender } = render(<FormGroup label="Themed" name="themeField" theme="dark" />);
    expect(screen.getByLabelText('Themed')).toHaveClass('bg-dark');

    rerender(<FormGroup label="Themed" name="themeField" theme="vintage" />);
    expect(screen.getByLabelText('Themed')).toHaveClass('bg-white');
  });
});
