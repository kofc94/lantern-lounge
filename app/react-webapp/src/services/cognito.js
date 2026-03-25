import { Amplify } from 'aws-amplify';
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
import CONFIG from '../config/aws-config';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: CONFIG.cognito.userPoolId,
      userPoolClientId: CONFIG.cognito.appClientId,
      loginWith: {
        oauth: {
          domain: CONFIG.cognito.domain,
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [`${window.location.origin}/`],
          redirectSignOut: [`${window.location.origin}/`],
          responseType: 'code',
        },
      },
    },
  },
});

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  await amplifySignIn({ username: email, password });
};

/**
 * Sign up a new user
 */
export const signUp = async (name, email, password) => {
  await amplifySignUp({
    username: email,
    password,
    options: {
      userAttributes: { email, name },
    },
  });
};

/**
 * Confirm user registration with verification code
 */
export const confirmRegistration = async (email, code) => {
  await confirmSignUp({ username: email, confirmationCode: code });
};

/**
 * Resend confirmation code
 */
export const resendConfirmationCode = async (email) => {
  await resendSignUpCode({ username: email });
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  await amplifySignOut();
};

/**
 * Get current authenticated user with attributes and group membership.
 * Returns null if no session exists.
 */
export const getCurrentUser = async () => {
  try {
    await amplifyGetCurrentUser();
    const session = await fetchAuthSession();
    const groups = session.tokens?.idToken?.payload['cognito:groups'] ?? [];
    const tokenPayload = session.tokens?.idToken?.payload ?? {};

    let email = tokenPayload.email;
    let name = tokenPayload.name;
    let profile = tokenPayload.profile;
    let sub = tokenPayload.sub;

    // For native Cognito users, fetchUserAttributes is more reliable
    try {
      const attributes = await fetchUserAttributes();
      email = attributes.email ?? email;
      name = attributes.name ?? name;
      profile = attributes.profile ?? profile;
      sub = attributes.sub ?? sub;
    } catch {
      // Federated (Google) users may not support fetchUserAttributes — fall back to token claims
    }

    return { email, name, groups, profile, sub, session };
  } catch {
    return null;
  }
};

/**
 * Get the ID token JWT for API requests
 */
export const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
};

/**
 * Initiate federated sign-in via Cognito Hosted UI.
 * Amplify handles the OAuth redirect and token exchange automatically.
 */
export const federatedSignIn = async (provider) => {
  await signInWithRedirect({ provider });
};

export default {
  signIn,
  signUp,
  confirmRegistration,
  resendConfirmationCode,
  signOut,
  getCurrentUser,
  getAuthToken,
  federatedSignIn,
};
