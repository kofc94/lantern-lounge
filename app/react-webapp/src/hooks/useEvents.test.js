import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useEvents from './useEvents';
import { fetchEvents } from '../services/api';
import useAuth from './useAuth';

// Mock the services and other hooks
vi.mock('../services/api');
vi.mock('./useAuth');

describe('useEvents hook', () => {
  const mockAuthToken = 'fake-auth-token';
  const mockEvents = [
    { id: '1', title: 'Test Event 1', date: '2025-04-10' },
    { id: '2', title: 'Test Event 2', date: '2025-04-15' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    useAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockAuthToken),
      isAuthenticated: true,
    });
    
    fetchEvents.mockResolvedValue(mockEvents);
  });

  it('initially fetches events for the current month', async () => {
    const { result } = renderHook(() => useEvents());

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(fetchEvents).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      mockAuthToken
    );
  });

  it('updates the month when navigateMonth is called', async () => {
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initialMonth = result.current.currentMonth.getMonth();

    await act(async () => {
      result.current.navigateMonth(1); // Next month
    });

    expect(result.current.currentMonth.getMonth()).toBe((initialMonth + 1) % 12);
    
    // Wait for the second API call triggered by useEffect
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('filters events for a specific date', async () => {
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Create date in a way that avoids timezone shifts
    const testDate = new Date(2025, 3, 10); // April 10, 2025 (month is 0-indexed)
    const dateEvents = result.current.getEventsForDate(testDate);
    expect(dateEvents).toHaveLength(1);
    expect(dateEvents[0].title).toBe('Test Event 1');
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchEvents.mockRejectedValueOnce(new Error('Network Error'));
    
    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to load events');
    expect(result.current.events).toEqual([]);
    
    consoleSpy.mockRestore();
  });
});
