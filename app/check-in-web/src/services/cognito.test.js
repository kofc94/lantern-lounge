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
});
