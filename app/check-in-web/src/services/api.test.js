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
    });

    it('throws error on failure', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchEvents()).rejects.toThrow('HTTP error! status: 500');
    });

    it('handles unexpected catch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchEvents()).rejects.toThrow('Network error');
    });
  });

  describe('createEvent', () => {
    it('creates event successfully', async () => {
      const mockEvent = { id: '1', title: 'New' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      });

      const result = await createEvent({ title: 'New' }, 'token');
      expect(result).toEqual(mockEvent);
    });

    it('throws when no token', async () => {
      await expect(createEvent({})).rejects.toThrow(/signed in/);
    });

    it('handles API error response', async () => {
      fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Fail' }) });
      await expect(createEvent({}, 'token')).rejects.toThrow('Fail');
    });

    it('handles network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Down'));
      await expect(createEvent({}, 'token')).rejects.toThrow('Down');
    });
  });

  describe('updateEvent', () => {
    it('updates event successfully', async () => {
      const mockEvent = { id: '1', title: 'Updated' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      });

      const result = await updateEvent('1', { title: 'Updated' }, 'token');
      expect(result).toEqual(mockEvent);
    });

    it('handles API error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Err' }) });
      await expect(updateEvent('1', {}, 'token')).rejects.toThrow('Err');
    });
  });

  describe('deleteEvent', () => {
    it('deletes event successfully', async () => {
      fetch.mockResolvedValueOnce({ ok: true });
      await deleteEvent('1', 'token');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/1'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('handles API error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Err' }) });
      await expect(deleteEvent('1', 'token')).rejects.toThrow('Err');
    });
  });

  describe('fetchWalletPass', () => {
    it('fetches pass successfully', async () => {
      const mockPass = { walletToken: 'xyz' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPass,
      });

      const result = await fetchWalletPass('token');
      expect(result).toEqual(mockPass);
    });

    it('handles error', async () => {
      fetch.mockRejectedValueOnce(new Error('Err'));
      await expect(fetchWalletPass('token')).rejects.toThrow('Err');
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
    });
  });
});
