import { useState } from 'react';
import Modal from '../common/Modal';
import FormGroup from '../common/FormGroup';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

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
      )}

      {/* Sign Up Tab */}
      {activeTab === 'signup' && (
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
