import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as auth from '@aws-amplify/auth';
import { 
  signIn, 
  signUp, 
  confirmRegistration, 
  resendConfirmationCode, 
  signOut, 
  getCurrentUser, 
  getAuthToken, 
  federatedSignIn 
} from './cognito';

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

describe('cognito.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('calls amplifySignIn with correct arguments', async () => {
      await signIn('test@example.com', 'password123');
      expect(auth.signIn).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns user details when authenticated', async () => {
      const mockSession = {
        tokens: {
          idToken: {
            payload: {
              'cognito:groups': ['staff'],
              email: 'staff@example.com',
              name: 'Staff User',
            },
          },
        },
      };
      auth.getCurrentUser.mockResolvedValueOnce({ username: 'user-sub' });
      auth.fetchAuthSession.mockResolvedValueOnce(mockSession);
      auth.fetchUserAttributes.mockResolvedValueOnce({
        email: 'staff@example.com',
        name: 'Staff User',
      });

      const user = await getCurrentUser();
      expect(user).toEqual({
        email: 'staff@example.com',
        name: 'Staff User',
        groups: ['staff'],
        session: mockSession,
      });
    });

    it('returns null when not authenticated', async () => {
      auth.getCurrentUser.mockRejectedValueOnce(new Error('No user'));
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getAuthToken', () => {
    it('returns token string from session', async () => {
      const mockToken = { toString: () => 'fake-jwt-token' };
      auth.fetchAuthSession.mockResolvedValueOnce({
        tokens: { idToken: mockToken },
      });

      const token = await getAuthToken();
      expect(token).toBe('fake-jwt-token');
    });

    it('returns null on failure', async () => {
      auth.fetchAuthSession.mockRejectedValueOnce(new Error('No session'));
      const token = await getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('signUp', () => {
    it('calls amplifySignUp with correct arguments', async () => {
      await signUp('Name', 'e@e.com', 'pass');
      expect(auth.signUp).toHaveBeenCalledWith({
        username: 'e@e.com',
        password: 'pass',
        options: {
          userAttributes: { email: 'e@e.com', name: 'Name' },
        },
      });
    });
  });

  describe('confirmRegistration', () => {
    it('calls confirmSignUp', async () => {
      await confirmRegistration('e@e.com', '123456');
      expect(auth.confirmSignUp).toHaveBeenCalledWith({
        username: 'e@e.com',
        confirmationCode: '123456',
      });
    });
  });

  describe('resendConfirmationCode', () => {
    it('calls resendSignUpCode', async () => {
      await resendConfirmationCode('e@e.com');
      expect(auth.resendSignUpCode).toHaveBeenCalledWith({
        username: 'e@e.com',
      });
    });
  });

  describe('signOut', () => {
    it('calls amplifySignOut', async () => {
      await signOut();
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  describe('federatedSignIn', () => {
    it('calls signInWithRedirect', async () => {
      await federatedSignIn('Google');
      expect(auth.signInWithRedirect).toHaveBeenCalledWith({ provider: 'Google' });
    });
  });
});
