import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, AuthContext } from './AuthContext';
import * as cognitoService from '../services/cognito';
import { Hub } from 'aws-amplify/utils';

// Mock cognito service
vi.mock('../services/cognito', () => ({
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getAuthToken: vi.fn(),
  signUp: vi.fn(),
  confirmRegistration: vi.fn(),
  resendConfirmationCode: vi.fn(),
}));

// Mock Hub
vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: vi.fn(() => vi.fn()),
  },
}));

const TestComponent = () => {
  const context = React.useContext(AuthContext);
  return (
    <div>
      <div data-testid="auth-status">{context.isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-email">{context.currentUser?.email}</div>
      <div data-testid="loading">{context.isLoading ? 'loading' : 'done'}</div>
      {context.error && <div data-testid="error">{context.error}</div>}
      <button onClick={() => context.signIn('test@example.com', 'pass')}>Sign In</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides authentication state and handles successful sign in', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);
    
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('loading')).toHaveTextContent('loading');
    
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('done');
    });
    expect(getByTestId('auth-status')).toHaveTextContent('unauthenticated');

    // Test sign in
    const mockUser = { email: 'staff@example.com', groups: ['staff'] };
    cognitoService.signIn.mockResolvedValueOnce({ success: true });
    cognitoService.getCurrentUser.mockResolvedValueOnce(mockUser);

    await act(async () => {
      getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-email')).toHaveTextContent('staff@example.com');
    });
  });

  it('performs hard-kick for non-staff users', async () => {
    const nonStaffUser = { email: 'user@example.com', groups: ['member'] };
    cognitoService.getCurrentUser.mockResolvedValue(nonStaffUser);
    
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(cognitoService.signOut).toHaveBeenCalled();
      expect(getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      expect(getByTestId('error')).toHaveTextContent(/Access Denied/);
    });
  });

  it('handles Hub signedIn event', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);
    let hubCallback;
    Hub.listen.mockImplementation((channel, cb) => {
      if (channel === 'auth') hubCallback = cb;
      return vi.fn();
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const mockUser = { email: 'hub@example.com', groups: ['staff'] };
    cognitoService.getCurrentUser.mockResolvedValueOnce(mockUser);

    await act(async () => {
      hubCallback({ payload: { event: 'signedIn' } });
    });

    await waitFor(() => {
      expect(cognitoService.getCurrentUser).toHaveBeenCalledTimes(2);
      expect(getByTestId('user-email')).toHaveTextContent('hub@example.com');
    });
  });

  it('handles Hub signedOut event', async () => {
    let hubCallback;
    Hub.listen.mockImplementation((channel, cb) => {
      if (channel === 'auth') hubCallback = cb;
      return vi.fn();
    });

    const mockUser = { email: 'staff@example.com', groups: ['staff'] };
    cognitoService.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { getByTestId } = render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => expect(getByTestId('auth-status')).toHaveTextContent('authenticated'));

    await act(async () => {
      hubCallback({ payload: { event: 'signedOut' } });
    });

    expect(getByTestId('auth-status')).toHaveTextContent('unauthenticated');
  });

  it('handles sign in error', async () => {
    cognitoService.signIn.mockRejectedValueOnce(new Error('Invalid password'));
    const { getByText, getByTestId } = render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await act(async () => {
      getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Invalid password');
    });
  });

  it('handles signUp and confirmEmail results', async () => {
    cognitoService.getCurrentUser.mockResolvedValue(null);
    cognitoService.signUp.mockResolvedValueOnce({ success: true, needsVerification: true });
    cognitoService.confirmRegistration.mockResolvedValueOnce({ success: true });

    let results = {};
    const ActionTest = () => {
      const context = React.useContext(AuthContext);
      return (
        <button onClick={async () => {
          results.signUp = await context.signUp('Name', 'e@e.com', 'pass');
          results.confirm = await context.confirmEmail('e@e.com', '123');
        }}>Test</button>
      );
    };

    const { getByText } = render(<AuthProvider><ActionTest /></AuthProvider>);
    await act(async () => { getByText('Test').click(); });

    expect(results.signUp.success).toBe(true);
    expect(results.confirm.success).toBe(true);
  });

  it('handles signUp and confirmEmail errors', async () => {
    cognitoService.signUp.mockRejectedValueOnce(new Error('User exists'));
    cognitoService.confirmRegistration.mockRejectedValueOnce(new Error('Bad code'));

    let results = {};
    const ActionTest = () => {
      const context = React.useContext(AuthContext);
      return (
        <button onClick={async () => {
          results.signUp = await context.signUp();
          results.confirm = await context.confirmEmail();
        }}>Test</button>
      );
    };

    const { getByText } = render(<AuthProvider><ActionTest /></AuthProvider>);
    await act(async () => { getByText('Test').click(); });

    expect(results.signUp.success).toBe(false);
    expect(results.confirm.success).toBe(false);
  });

  it('handles resendCode and signOut', async () => {
    cognitoService.resendConfirmationCode.mockResolvedValueOnce({ success: true });
    
    const ActionTest = () => {
      const context = React.useContext(AuthContext);
      return (
        <div>
          <button onClick={() => context.resendCode('e@e.com')}>Resend</button>
          <button onClick={() => context.signOut()}>Sign Out</button>
          <button onClick={() => context.getToken()}>Token</button>
        </div>
      );
    };

    const { getByText } = render(<AuthProvider><ActionTest /></AuthProvider>);
    
    await act(async () => { getByText('Resend').click(); });
    expect(cognitoService.resendConfirmationCode).toHaveBeenCalled();

    await act(async () => { getByText('Sign Out').click(); });
    expect(cognitoService.signOut).toHaveBeenCalled();

    await act(async () => { getByText('Token').click(); });
    expect(cognitoService.getAuthToken).toHaveBeenCalled();
  });
});
