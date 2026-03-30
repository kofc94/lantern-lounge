import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

/**
 * Verify Page - Handles the custom verification link from Cognito
 * URL: /verify?code=123456&username=user-uuid&email=user@example.com
 */
const Verify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmEmail } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Use a ref to prevent multiple verification attempts in StrictMode
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (verificationAttempted.current) return;
    
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const username = params.get('username');
    const email = params.get('email');
    
    if (email) setUserEmail(email);

    if (!code || !username) {
      setStatus('error');
      setError('Invalid verification link. Please check your email and try again.');
      return;
    }

    const performVerification = async () => {
      verificationAttempted.current = true;
      try {
        // confirmEmail in AuthContext calls cognitoService.confirmRegistration(email, code)
        // We use the email (or username) as the identifier
        const result = await confirmEmail(email || username, code);
        
        if (result.success) {
          setStatus('success');
          // Automatically redirect to home/login after 3 seconds
          setTimeout(() => {
            navigate('/', { state: { openLogin: true, message: 'Account verified! Please sign in.' } });
          }, 3000);
        } else {
          setStatus('error');
          setError(result.error || 'Verification failed. The code may have expired.');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'An unexpected error occurred during verification.');
      }
    };

    performVerification();
  }, [location, confirmEmail, navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 bg-stone-50">
      <div className="max-w-md w-full bg-white border border-[#dcd1bc] p-10 shadow-xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-neutral-dark tracking-tight">
            Registry <span className="text-stone-400 font-light italic">Verification</span>
          </h1>
          <div className="w-12 h-px bg-accent-gold mx-auto mt-4"></div>
        </div>

        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-stone-200 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-stone-600 font-serif italic">
              Consulting the ledger for {userEmail || 'your account'}...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-serif text-neutral-dark">Entry Approved</h3>
            <p className="text-stone-600">
              Your association with the Lantern Lounge has been verified. You will be redirected shortly.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate('/')}>Return to Entrance</Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-serif text-neutral-dark">Entry Denied</h3>
            <p className="text-stone-600">
              {error}
            </p>
            <div className="pt-4">
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
        &copy; 2026 THE LANTERN LOUNGE ASSOCIATION
      </div>
    </div>
  );
};

export default Verify;
