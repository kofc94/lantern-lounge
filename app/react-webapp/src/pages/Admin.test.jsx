import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Admin from './Admin';
import { useAuth } from '../hooks/useAuth';
import { fetchUsers } from '../services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../hooks/useAuth');
vi.mock('../services/api');

describe('Admin Page', () => {
  const mockGetToken = vi.fn().mockResolvedValue('fake-token');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders access denied for non-admins', () => {
    useAuth.mockReturnValue({ isAdmin: false, getToken: mockGetToken, isLoading: false });
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders user list with Joined date for admins', async () => {
    const mockUsers = [
      { 
        username: 'user1', 
        email: 'user1@test.com', 
        name: 'User One', 
        profile: 'member',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z'
      }
    ];
    
    useAuth.mockReturnValue({ 
      isAdmin: true, 
      getToken: mockGetToken, 
      isLoading: false 
    });
    
    fetchUsers.mockResolvedValueOnce({ users: mockUsers, paginationToken: null });

    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      // "2026-01-15T10:00:00Z" should be formatted as "Jan 15, 2026"
      expect(screen.getByText(/Jan 15, 2026/i)).toBeInTheDocument();
    });
  });
});
