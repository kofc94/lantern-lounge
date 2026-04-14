import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  downloadAppleWalletPass,
  fetchWalletPass,
  checkInUser,
  fetchUsers,
  updateUserRole,
} from './api';
import CONFIG from '../config/aws-config';

// Mock global fetch
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('fetches events with correct URL and headers', async () => {
      const mockEvents = [{ id: '1', title: 'Test Event' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvents }),
      });

      const events = await fetchEvents('2025-01-01', '2025-01-31');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.apiEndpoint}${CONFIG.api.getItems}?startDate=2025-01-01&endDate=2025-01-31`),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(events).toEqual(mockEvents);
    });

    it('includes authorization header when authToken is provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await fetchEvents(null, null, 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchEvents()).rejects.toThrow('HTTP error! status: 500');
      consoleSpy.mockRestore();
    });
  });

  describe('createEvent', () => {
    it('sends a POST request with the correct body', async () => {
      const eventData = { title: 'New Event', date: '2025-02-01' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Created', item: eventData }),
      });

      const result = await createEvent(eventData, 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.apiEndpoint}${CONFIG.api.createItem}`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify(eventData),
        })
      );
      expect(result.item).toEqual(eventData);
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(createEvent({ title: 'Test' }, null)).rejects.toThrow('You must be signed in to create events');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Bad Request' }),
      });

      await expect(createEvent({ title: 'Test' }, 'fake-token')).rejects.toThrow('Bad Request');
      consoleSpy.mockRestore();
    });
  });

  describe('updateEvent', () => {
    it('sends a PUT request with the correct body', async () => {
      const eventData = { title: 'Updated Event' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: eventData }),
      });

      const result = await updateEvent('event-1', eventData, 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.apiEndpoint}${CONFIG.api.updateItem}/event-1`),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify(eventData),
        })
      );
      expect(result).toEqual({ item: eventData });
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(updateEvent('event-1', {}, null)).rejects.toThrow('You must be signed in to update events');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      });

      await expect(updateEvent('event-1', {}, 'fake-token')).rejects.toThrow('Update failed');
      consoleSpy.mockRestore();
    });
  });

  describe('deleteEvent', () => {
    it('sends a DELETE request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await deleteEvent('event-1', 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.apiEndpoint}${CONFIG.api.deleteItem}/event-1`),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(deleteEvent('event-1', null)).rejects.toThrow('You must be signed in to delete events');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Delete failed' }),
      });

      await expect(deleteEvent('event-1', 'fake-token')).rejects.toThrow('Delete failed');
      consoleSpy.mockRestore();
    });
  });

  describe('downloadAppleWalletPass', () => {
    it('downloads the pass and returns a blob', async () => {
      const mockBlob = new Blob(['pass content']);
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await downloadAppleWalletPass('fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.checkinsApiEndpoint || CONFIG.apiEndpoint}${CONFIG.api.getApplePass}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
      expect(result).toBe(mockBlob);
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(downloadAppleWalletPass(null)).rejects.toThrow('You must be signed in to get a wallet pass');
    });

    it('throws an error when the response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Pass error' }),
      });

      await expect(downloadAppleWalletPass('fake-token')).rejects.toThrow('Pass error');
    });
  });

  describe('fetchWalletPass', () => {
    it('fetches the wallet pass data', async () => {
      const passData = { google_save_url: 'https://google.com/save' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => passData,
      });

      const result = await fetchWalletPass('fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.checkinsApiEndpoint || CONFIG.apiEndpoint}${CONFIG.api.getPass}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
      expect(result).toEqual(passData);
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(fetchWalletPass(null)).rejects.toThrow('You must be signed in to get a wallet pass');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchWalletPass('fake-token')).rejects.toThrow('HTTP error! status: 500');
      consoleSpy.mockRestore();
    });
  });

  describe('checkInUser', () => {
    it('sends a POST request to check in a user', async () => {
      const responseData = { success: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const result = await checkInUser('test@example.com', 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.checkinsApiEndpoint || CONFIG.apiEndpoint}${CONFIG.api.checkIn}`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(checkInUser('test@example.com', null)).rejects.toThrow('Unauthorized');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Check-in failed' }),
      });

      await expect(checkInUser('test@example.com', 'fake-token')).rejects.toThrow('Check-in failed');
      consoleSpy.mockRestore();
    });
  });

  describe('fetchUsers', () => {
    it('fetches users', async () => {
      const usersData = { users: [{ username: 'user1' }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => usersData,
      });

      const result = await fetchUsers('fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.usersApiEndpoint}/users`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
          }),
        })
      );
      expect(result).toEqual(usersData);
    });

    it('appends paginationToken to URL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });

      await fetchUsers('fake-token', 'page-2');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`?paginationToken=page-2`),
        expect.any(Object)
      );
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(fetchUsers(null)).rejects.toThrow('Authentication required');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      });

      await expect(fetchUsers('fake-token')).rejects.toThrow('Forbidden');
      consoleSpy.mockRestore();
    });
  });

  describe('updateUserRole', () => {
    it('sends a PATCH request to update a user role', async () => {
      const responseData = { success: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const result = await updateUserRole('user1', 'admin', 'fake-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${CONFIG.usersApiEndpoint}/users/user1`),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify({ profile: 'admin' }),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('throws an error if no authToken is provided', async () => {
      await expect(updateUserRole('user1', 'admin', null)).rejects.toThrow('Authentication required');
    });

    it('throws an error when the response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad profile' }),
      });

      await expect(updateUserRole('user1', 'admin', 'fake-token')).rejects.toThrow('Bad profile');
      consoleSpy.mockRestore();
    });
  });
});
