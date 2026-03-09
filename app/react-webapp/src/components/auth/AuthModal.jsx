import { useState } from 'react';
import Modal from '../common/Modal';
import FormGroup from '../common/FormGroup';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { federatedSignIn } from '../../services/cognito';

/**
 * Authentication Modal with Sign In, Sign Up, and Verify Email tabs
 */
const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('signin'); // signin, signup, verify
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const { signIn, signUp, confirmEmail, resendCode } = useAuth();

  // Sign In Form
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '' });

  // Verify Form
  const [verifyData, setVerifyData] = useState({ email: '', code: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await signIn(signInData.email, signInData.password);

    if (result.success) {
      setSuccess('Signed in successfully!');
      setTimeout(() => {
        onClose();
        setSignInData({ email: '', password: '' });
      }, 1000);
    } else {
      setError(result.error || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await signUp(signUpData.name, signUpData.email, signUpData.password);

    if (result.success) {
      setSuccess('Account created! Please check your email for verification code.');
      setPendingEmail(signUpData.email);
      setVerifyData({ email: signUpData.email, code: '' });
      setTimeout(() => {
        setActiveTab('verify');
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || 'Failed to sign up');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await confirmEmail(verifyData.email, verifyData.code);

    if (result.success) {
      setSuccess('Email verified! You can now sign in.');
      setTimeout(() => {
        setActiveTab('signin');
        setVerifyData({ email: '', code: '' });
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || 'Failed to verify email');
    }
  };

  const handleResendCode = async () => {
    setError('');
    const result = await resendCode(verifyData.email);
    if (result.success) {
      setSuccess('Verification code resent!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

  const resetAndClose = () => {
    setActiveTab('signin');
    setError('');
    setSuccess('');
    setSignInData({ email: '', password: '' });
    setSignUpData({ name: '', email: '', password: '' });
    setVerifyData({ email: '', code: '' });
    onClose();
  };

  const handleSocialSignIn = (provider) => {
    try {
      federatedSignIn(provider);
    } catch (error) {
      setError('Social sign-in is not configured yet. Please use email/password.');
    }
  };

  const SocialSignInButtons = () => (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => handleSocialSignIn('Google')}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 transition-all"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-light text-gray-400">Or continue with email</span>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Member Login">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('signin')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'signin'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'signup'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'verify'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Verify Email
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded text-green-500">
          {success}
        </div>
      )}

      {/* Sign In Tab */}
      {activeTab === 'signin' && (
        <>
          <SocialSignInButtons />
          <form onSubmit={handleSignIn}>
            <FormGroup
              label="Email"
              name="email"
              type="email"
              value={signInData.email}
              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
            <FormGroup
              label="Password"
              name="password"
              type="password"
              value={signInData.password}
              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
            <Button type="submit" variant="primary" fullWidth className="mt-6">
              Sign In
            </Button>
          </form>
        </>
      )}

      {/* Sign Up Tab */}
      {activeTab === 'signup' && (
        <>
          <SocialSignInButtons />
          <form onSubmit={handleSignUp}>
            <FormGroup
              label="Full Name"
              name="name"
              type="text"
              value={signUpData.name}
              onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            <FormGroup
              label="Email"
              name="email"
              type="email"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
            <FormGroup
              label="Password"
              name="password"
              type="password"
              value={signUpData.password}
              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              placeholder="Choose a strong password"
              required
              helperText="Minimum 8 characters"
            />
            <Button type="submit" variant="primary" fullWidth className="mt-6">
              Sign Up
            </Button>
          </form>
        </>
      )}

      {/* Verify Email Tab */}
      {activeTab === 'verify' && (
        <form onSubmit={handleVerify}>
          <FormGroup
            label="Email"
            name="email"
            type="email"
            value={verifyData.email}
            onChange={(e) => setVerifyData({ ...verifyData, email: e.target.value })}
            placeholder="your@email.com"
            required
          />
          <FormGroup
            label="Verification Code"
            name="code"
            type="text"
            value={verifyData.code}
            onChange={(e) => setVerifyData({ ...verifyData, code: e.target.value })}
            placeholder="Enter 6-digit code"
            required
            helperText="Check your email for the verification code"
          />
          <div className="flex space-x-4 mt-6">
            <Button type="submit" variant="primary" fullWidth>
              Verify Email
            </Button>
            <Button type="button" variant="secondary" onClick={handleResendCode}>
              Resend Code
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AuthModal;
