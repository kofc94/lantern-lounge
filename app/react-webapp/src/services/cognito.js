import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import CONFIG from '../config/aws-config';

// Initialize Cognito User Pool
const poolData = {
  UserPoolId: CONFIG.cognito.userPoolId,
  ClientId: CONFIG.cognito.appClientId
};

const userPool = new CognitoUserPool(poolData);

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Session result
 */
export const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: email,
      Password: password
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * Sign up a new user
 * @param {string} name - User's full name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Signup result
 */
export const signUp = (name, email, password) => {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email
      }),
      new CognitoUserAttribute({
        Name: 'name',
        Value: name
      })
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Confirm user registration with verification code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @returns {Promise<string>} - Confirmation result
 */
export const confirmRegistration = (email, code) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Resend confirmation code to user email
 * @param {string} email - User email
 * @returns {Promise<string>} - Resend result
 */
export const resendConfirmationCode = (email) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Sign out current user
 */
export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} - User object with email, name, and session
 */
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          console.error('Error getting user attributes:', err);
          resolve(null);
          return;
        }

        const email = attributes.find(attr => attr.Name === 'email')?.Value;
        const name = attributes.find(attr => attr.Name === 'name')?.Value;

        resolve({
          email,
          name,
          session
        });
      });
    });
  });
};

/**
 * Get authentication token for API requests
 * @returns {Promise<string|null>} - JWT token
 */
export const getAuthToken = () => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
};

export default {
  signIn,
  signUp,
  confirmRegistration,
  resendConfirmationCode,
  signOut,
  getCurrentUser,
  getAuthToken
};
