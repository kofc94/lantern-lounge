import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cognito from './cognito';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp,
  resendSignUpCode,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  signInWithRedirect,
} from '@aws-amplify/auth';

// Mock Amplify Auth
vi.mock('@aws-amplify/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  resendSignUpCode: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  fetchUserAttributes: vi.fn(),
  signInWithRedirect: vi.fn(),
}));

vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));

describe('Cognito Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signIn calls amplifySignIn with correct params', async () => {
    await cognito.signIn('test@example.com', 'password123');
    expect(amplifySignIn).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123',
    });
  });

  it('signUp calls amplifySignUp with correct params', async () => {
    await cognito.signUp('Test User', 'test@example.com', 'password123');
    expect(amplifySignUp).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123',
      options: {
        userAttributes: {
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    });
  });

  it('confirmRegistration calls confirmSignUp', async () => {
    await cognito.confirmRegistration('test@example.com', '123456');
    expect(confirmSignUp).toHaveBeenCalledWith({
      username: 'test@example.com',
      confirmationCode: '123456',
    });
  });

  it('resendConfirmationCode calls resendSignUpCode', async () => {
    await cognito.resendConfirmationCode('test@example.com');
    expect(resendSignUpCode).toHaveBeenCalledWith({
      username: 'test@example.com',
    });
  });

  it('signOut calls amplifySignOut', async () => {
    await cognito.signOut();
    expect(amplifySignOut).toHaveBeenCalled();
  });

  it('federatedSignIn calls signInWithRedirect', async () => {
    await cognito.federatedSignIn('Google');
    expect(signInWithRedirect).toHaveBeenCalledWith({ provider: 'Google' });
  });

  describe('getCurrentUser', () => {
    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            name: 'Test User',
            'cognito:groups': ['member'],
          },
        },
      },
    };

    it('returns user details when authenticated', async () => {
      amplifyGetCurrentUser.mockResolvedValue({ username: 'test-user-id' });
      fetchAuthSession.mockResolvedValue(mockSession);
      fetchUserAttributes.mockResolvedValue({
        email: 'test@example.com',
        name: 'Test User',
      });

      const user = await cognito.getCurrentUser();

      expect(user).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        groups: ['member'],
        session: mockSession,
      });
    });

    it('falls back to token payload if fetchUserAttributes fails (e.g., federated user)', async () => {
      amplifyGetCurrentUser.mockResolvedValue({ username: 'google-user-id' });
      fetchAuthSession.mockResolvedValue(mockSession);
      fetchUserAttributes.mockRejectedValue(new Error('Not supported'));

      const user = await cognito.getCurrentUser();

      expect(user.email).toBe('test@example.com');
      expect(user.groups).toContain('member');
    });

    it('returns null if not authenticated', async () => {
      amplifyGetCurrentUser.mockRejectedValue(new Error('No user'));
      const user = await cognito.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getAuthToken', () => {
    it('returns token string if session exists', async () => {
      const mockToken = { toString: () => 'fake-jwt-token' };
      fetchAuthSession.mockResolvedValue({
        tokens: { idToken: mockToken },
      });

      const token = await cognito.getAuthToken();
      expect(token).toBe('fake-jwt-token');
    });

    it('returns null if session fetch fails', async () => {
      fetchAuthSession.mockRejectedValue(new Error('No session'));
      const token = await cognito.getAuthToken();
      expect(token).toBeNull();
    });
  });
});
