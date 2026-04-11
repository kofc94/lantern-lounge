import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  fetchEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  fetchWalletPass, 
  checkInUser, 
  recordGuests 
} from './api';
import CONFIG from '../config/aws-config';

// Mock global fetch
global.fetch = vi.fn();

describe('api.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('fetches events successfully', async () => {
      const mockEvents = [{ id: '1', title: 'Test Event' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvents }),
      });

      const result = await fetchEvents();
      expect(result).toEqual(mockEvents);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(CONFIG.api.getItems),
        expect.any(Object)
      );
    });

    it('handles query parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await fetchEvents('2023-01-01', '2023-01-31');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2023-01-01&endDate=2023-01-31'),
        expect.any(Object)
      );
    });

    it('throws error on failure', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchEvents()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('checkInUser', () => {
    it('checks in a user successfully', async () => {
      const mockResponse = { id: 'checkin-1', userName: 'Test User' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkInUser('test@example.com', 'fake-token');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(CONFIG.api.checkIn),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });

    it('throws error on unauthorized', async () => {
      await expect(checkInUser('test@example.com', null)).rejects.toThrow('Unauthorized');
    });

    it('handles API errors with details', async () => {
      const errorResponse = { error: 'Validation failed', details: 'Invalid email' };
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const call = checkInUser('invalid', 'token');
      await expect(call).rejects.toThrow('Validation failed');
      
      try {
        await call;
      } catch (err) {
        expect(err.status).toBe(400);
        expect(err.details).toBe('Invalid email');
      }
    });
  });

  describe('recordGuests', () => {
    it('records guests successfully', async () => {
      const mockResponse = { id: 'checkin-1', guests: [{ name: 'Guest', visitCount: 1 }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const guests = [{ name: 'Guest', email: 'guest@example.com' }];
      const result = await recordGuests('checkin-1', guests, 'token');
      
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('checkins/checkin-1/guests'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ guests }),
        })
      );
    });
  });
});
