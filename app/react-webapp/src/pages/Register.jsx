import { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { federatedSignIn } from '../services/cognito';
import Button from '../components/common/Button';
import FormGroup from '../components/common/FormGroup';

const Register = () => {
  const { signUp, confirmEmail, resendCode } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefillName = searchParams.get('name') || '';
  const prefillEmail = searchParams.get('email') || '';

  const [step, setStep] = useState('register'); // 'register' | 'verify' | 'done'
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const result = await signUp(name.trim(), email.trim(), password);
    setLoading(false);
    if (result.success) {
      setStep('verify');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await confirmEmail(email.trim(), code.trim());
    setLoading(false);
    if (result.success) {
      setStep('done');
    } else {
      setError(result.error || 'Verification failed. Please check your code and try again.');
    }
  };

  const handleResend = async () => {
    setResent(false);
    const result = await resendCode(email.trim());
    if (result.success) setResent(true);
  };

  return (
    <div className="min-h-screen bg-dark">
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(178,34,34,0.05)_0%,transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <span className="text-accent-gold font-mono text-sm tracking-[0.3em] uppercase mb-6 block">Member Portal</span>
          <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 tracking-tight">
            Create Your <span className="text-primary italic">Account</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            You're a Lantern Lounge member. Register here to access member features on our website.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-custom max-w-lg mx-auto">

          {step === 'register' && (
            <>
              <button
                type="button"
                onClick={() => federatedSignIn('Google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 text-sm font-semibold rounded-sm hover:bg-gray-100 transition-colors mb-6"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-dark text-gray-500 text-xs uppercase tracking-widest font-bold">or register with email</span>
                </div>
              </div>

            <form onSubmit={handleRegister} className="space-y-2">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-sm">
                  {error}
                </div>
              )}

              <FormGroup
                label="Full Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus={!prefillName}
              />
              <FormGroup
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus={!!prefillName && !prefillEmail}
                helperText={''}
              />
              <FormGroup
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus={!!(prefillName && prefillEmail)}
              />
              <FormGroup
                label="Confirm Password"
                name="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />

              <div className="pt-4">
                <Button type="submit" variant="primary" fullWidth disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </div>

              <p className="text-center text-gray-500 text-sm pt-4">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-accent-gold hover:text-white transition-colors"
                >
                  Sign in from the home page
                </button>
              </p>
            </form>
            </>
          )}

          {step === 'verify' && (
            <div>
              <div className="text-center mb-10">
                <div className="text-4xl mb-4">✉️</div>
                <h2 className="text-3xl font-display font-bold text-white mb-3">Check Your Email</h2>
                <p className="text-gray-400 leading-relaxed">
                  We sent a verification code to <span className="text-white font-semibold">{email}</span>.
                  Enter it below to activate your account.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-2">
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-sm">
                    {error}
                  </div>
                )}

                <FormGroup
                  label="Verification Code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                />

                <div className="pt-4">
                  <Button type="submit" variant="primary" fullWidth disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify Email'}
                  </Button>
                </div>
              </form>

              <div className="text-center mt-6">
                {resent ? (
                  <p className="text-green-400 text-sm">Code resent — check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-gray-500 hover:text-accent-gold text-sm transition-colors"
                  >
                    Didn't receive a code? Resend
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">✓</div>
              <h2 className="text-4xl font-display font-bold text-white mb-4">
                Welcome to the <span className="text-primary italic">Lounge</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Your account is active. You can now sign in to access member features.
              </p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Go to Home Page
              </Button>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default Register;
