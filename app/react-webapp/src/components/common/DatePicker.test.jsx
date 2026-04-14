import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DatePicker from './DatePicker';

describe('DatePicker Component', () => {
  beforeEach(() => {
    // Set a fixed date: Wednesday, April 10, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 3, 10)); // Month is 0-indexed
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with label and placeholder', () => {
    render(<DatePicker label="Select Date" name="eventDate" value="" onChange={() => {}} />);
    expect(screen.getByText('Select Date')).toBeInTheDocument();
    expect(screen.getByText('Select a date')).toBeInTheDocument();
  });

  it('renders required indicator and errors', () => {
    const { rerender } = render(<DatePicker label="Required Date" name="date" required value="" onChange={() => {}} />);
    expect(screen.getByText('*')).toBeInTheDocument();

    rerender(<DatePicker label="Date" name="date" error="Invalid date" value="" onChange={() => {}} />);
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('displays the selected date', () => {
    render(<DatePicker label="Date" name="date" value="2025-04-15" onChange={() => {}} />);
    // April 15, 2025 is a Tuesday
    expect(screen.getByText('Tue, Apr 15, 2025')).toBeInTheDocument();
  });

  it('opens calendar when input is clicked', () => {
    render(<DatePicker label="Date" name="date" value="" onChange={() => {}} />);
    
    fireEvent.click(screen.getByText('Select a date'));
    
    // Check if month navigation is visible
    expect(screen.getByText('April 2025')).toBeInTheDocument();
    // Check if day headers are visible
    expect(screen.getByText('Su')).toBeInTheDocument();
  });

  it('navigates months correctly', () => {
    render(<DatePicker label="Date" name="date" value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Select a date'));
    
    expect(screen.getByText('April 2025')).toBeInTheDocument();

    const prevButton = screen.getByText('<');
    const nextButton = screen.getByText('>');

    fireEvent.click(prevButton);
    expect(screen.getByText('March 2025')).toBeInTheDocument();

    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    expect(screen.getByText('May 2025')).toBeInTheDocument();
  });

  it('selects a valid date and closes the calendar', () => {
    const handleChange = vi.fn();
    render(<DatePicker label="Date" name="date" value="" onChange={handleChange} />);
    
    fireEvent.click(screen.getByText('Select a date'));
    
    // April 15 is a Tuesday (valid)
    const day15 = screen.getAllByText('15')[0]; // There might be previous/next month days, but the first 15 should be April
    fireEvent.click(day15);

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: { name: 'date', value: '2025-04-15' }
    }));
    
    // Calendar should be closed
    expect(screen.queryByText('April 2025')).not.toBeInTheDocument();
  });

  it('disables past dates and closed days (Sat, Sun, Mon)', () => {
    render(<DatePicker label="Date" name="date" value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Select a date'));
    
    // Current date is April 10, 2025 (Wednesday)
    
    // Past date (April 9, Tuesday) should be disabled
    const day9 = screen.getAllByText('9').find(el => el.classList.contains('text-stone-700') || el.classList.contains('text-white'));
    expect(day9).toBeDisabled();

    // Weekend date (April 12, Saturday) should be disabled
    const day12 = screen.getAllByText('12').find(el => el.classList.contains('text-stone-700') || el.classList.contains('text-white'));
    expect(day12).toBeDisabled();

    // Future valid date (April 11, Thursday) should be enabled
    const day11 = screen.getAllByText('11').find(el => el.classList.contains('text-stone-700') || el.classList.contains('text-white'));
    expect(day11).not.toBeDisabled();
  });

  it('closes calendar when clicking outside', () => {
    render(<DatePicker label="Date" name="date" value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Select a date'));
    
    expect(screen.getByText('April 2025')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    
    expect(screen.queryByText('April 2025')).not.toBeInTheDocument();
  });

  it('selects today when Today button is clicked', () => {
    const handleChange = vi.fn();
    render(<DatePicker label="Date" name="date" value="" onChange={handleChange} />);
    
    fireEvent.click(screen.getByText('Select a date'));
    
    // Today is April 10, 2025 (Wednesday)
    fireEvent.click(screen.getByText('Today'));

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: { name: 'date', value: '2025-04-10' }
    }));
  });

  it('disables Today button if today is a closed day', () => {
    // Set system time to a Sunday
    vi.setSystemTime(new Date(2025, 3, 13)); // Sunday, April 13, 2025
    
    render(<DatePicker label="Date" name="date" value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('Select a date'));
    
    const todayButton = screen.getByText('Today');
    expect(todayButton).toBeDisabled();
    
    // Set back to Wednesday for other tests
    vi.setSystemTime(new Date(2025, 3, 10));
  });

  it('applies correct theme classes', () => {
    const { rerender } = render(<DatePicker label="Theme" name="theme" value="" onChange={() => {}} theme="dark" />);
    const triggerBtnDark = screen.getByText('Select a date');
    expect(triggerBtnDark).toHaveClass('bg-dark');

    rerender(<DatePicker label="Theme" name="theme" value="" onChange={() => {}} theme="vintage" />);
    const triggerBtnVintage = screen.getByText('Select a date');
    expect(triggerBtnVintage).toHaveClass('bg-white');
  });
});
