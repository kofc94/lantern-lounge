import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './AuthContext';
import * as cognitoService from '../services/cognito';
import { Hub } from 'aws-amplify/utils';

// Mock dependencies
vi.mock('../services/cognito');
vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: vi.fn(() => vi.fn()), // Returns an unsubscribe function
  },
}));

// Helper component to access context in tests
const TestConsumer = () => {
  const auth = useContext(AuthContext);
  return (
    <div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <div data-testid="user-email">{auth.currentUser?.email || 'none'}</div>
      <div data-testid="is-admin">{auth.isAdmin.toString()}</div>
      <div data-testid="error">{auth.error || 'none'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={auth.signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
    groups: ['member'],
  };

  const mockAdminUser = {
    email: 'admin@example.com',
    name: 'Admin User',
    groups: ['admin', 'member'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with a user if one exists', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(mockUser);

    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
  });

  it('initializes as not authenticated if no user exists', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);

    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('identifies admin users correctly', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(mockAdminUser);

    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
    });
  });

  it('handles signIn successfully', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);
    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(screen.getByTestId('is-loading').textContent).toBe('false'));

    // Prepare mock for successful sign in
    cognitoService.signIn.mockResolvedValue({ success: true });
    cognitoService.getCurrentUser.mockResolvedValue(mockUser);

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    });

    expect(cognitoService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('handles signIn failure', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);
    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(screen.getByTestId('is-loading').textContent).toBe('false'));

    cognitoService.signIn.mockRejectedValue(new Error('Invalid credentials'));

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });
  });

  it('handles signOut', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(mockUser);
    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(screen.getByTestId('is-authenticated').textContent).toBe('true'));

    await act(async () => {
      screen.getByText('Sign Out').click();
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    expect(cognitoService.signOut).toHaveBeenCalled();
  });

  it('listens for auth Hub events', async () => {
    let hubCallback;
    Hub.listen.mockImplementation((channel, callback) => {
      if (channel === 'auth') hubCallback = callback;
      return vi.fn(); // Unsubscribe
    });

    cognitoService.getCurrentUser.mockResolvedValue(null);
    let screen;
    await act(async () => {
      screen = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(screen.getByTestId('is-loading').textContent).toBe('false'));

    // Simulate signedIn event from Hub (e.g., after OAuth redirect)
    cognitoService.getCurrentUser.mockResolvedValue(mockUser);
    await act(async () => {
      hubCallback({ payload: { event: 'signedIn' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    // Simulate signedOut event
    await act(async () => {
      hubCallback({ payload: { event: 'signedOut' } });
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
  });
});
