import { createContext, useState, useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import * as cognitoService from '../services/cognito';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    try {
      const user = await cognitoService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load user:', err);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // Listen for auth events — covers the OAuth callback (signedIn)
    // as well as sign-out from any tab
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        loadUser().finally(() => setIsLoading(false));
      } else if (payload.event === 'signedOut') {
        setCurrentUser(null);
      }
    });

    // Check for an existing session on initial load
    loadUser().finally(() => setIsLoading(false));

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      await cognitoService.signIn(email, password);
      await loadUser();
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

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

  const signOut = async () => {
    await cognitoService.signOut();
    setCurrentUser(null);
  };

  const getToken = async () => {
    return await cognitoService.getAuthToken();
  };

  const refreshSession = async () => {
    await loadUser();
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLimited: currentUser?.groups?.includes('limited') ?? false,
    isMember: currentUser?.groups?.includes('member') ?? false,
    isAdmin: currentUser?.groups?.includes('admin') ?? false,
    isLoading,
    error,
    signIn,
    signUp,
    confirmEmail,
    resendCode,
    signOut,
    getToken,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
