import { createContext, useState, useEffect } from 'react';
import * as cognitoService from '../services/cognito';

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await cognitoService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Sign in user
   */
  const signIn = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      await cognitoService.signIn(email, password);
      const user = await cognitoService.getCurrentUser();
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new user
   */
  const signUp = async (name, email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      await cognitoService.signUp(name, email, password);
      return { success: true, needsVerification: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign up';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirm email with verification code
   */
  const confirmEmail = async (email, code) => {
    try {
      setError(null);
      setIsLoading(true);
      await cognitoService.confirmRegistration(email, code);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to verify email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend confirmation code
   */
  const resendCode = async (email) => {
    try {
      setError(null);
      await cognitoService.resendConfirmationCode(email);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to resend code';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Sign out current user
   */
  const signOut = () => {
    cognitoService.signOut();
    setCurrentUser(null);
  };

  /**
   * Get auth token for API requests
   */
  const getToken = async () => {
    return await cognitoService.getAuthToken();
  };

  /**
   * Refresh current user session
   */
  const refreshSession = async () => {
    try {
      const user = await cognitoService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to refresh session:', err);
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    signIn,
    signUp,
    confirmEmail,
    resendCode,
    signOut,
    getToken,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
