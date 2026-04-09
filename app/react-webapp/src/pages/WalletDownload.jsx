import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchWalletPass, downloadAppleWalletPass } from '../services/api';
import Button from '../components/common/Button';
import AuthModal from '../components/auth/AuthModal';

/**
 * WalletDownload Page
 * Automatically detects mobile OS and triggers pass download/save.
 * Requires authentication.
 */
const WalletDownload = () => {
  const { isAuthenticated, isLoading, getToken } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading_data, checking_os, downloading, success, error
  const [error, setError] = useState(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleDownload = useCallback(async () => {
    if (hasAttempted) return;
    setHasAttempted(true);
    setStatus('loading_data');
    
    try {
      const token = await getToken();
      const walletData = await fetchWalletPass(token);
      
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(userAgent);

      if (isIOS) {
        setStatus('downloading');
        const blob = await downloadAppleWalletPass(token);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lanternlounge.pkpass');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        setStatus('success');
      } else if (isAndroid && walletData.google_save_url) {
        setStatus('success');
        // Redirect to Google Wallet save URL
        window.location.href = walletData.google_save_url;
      } else {
        setError('Please use an iOS or Android device to download your membership pass.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Wallet download error:', err);
      setError('Failed to process wallet pass. Please try again.');
      setStatus('error');
      setHasAttempted(false);
    }
  }, [getToken, hasAttempted]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAttempted) {
      handleDownload();
    }
  }, [isAuthenticated, isLoading, handleDownload, hasAttempted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 text-center max-w-xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-6">Membership Pass</h1>
        <div className="bg-neutral-dark/40 border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
          <p className="text-xl text-gray-400 mb-8 relative z-10">
            Please sign in to your account to download your digital membership pass to your phone.
          </p>
          <Button variant="cta" onClick={() => setIsAuthModalOpen(true)} className="px-12 py-4 relative z-10">
            Sign In to Download
          </Button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="container-custom py-20 text-center max-w-xl mx-auto">
      <h1 className="text-4xl font-display font-bold text-white mb-6">
        {status === 'success' ? 'Pass Ready!' : 'Preparing Your Pass'}
      </h1>
      
      <div className="bg-neutral-dark/40 border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-grain" />
        <div className="relative z-10">
          {status === 'loading_data' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-gold mb-4"></div>
              <p className="text-gray-400 font-medium">Fetching your membership details...</p>
            </div>
          )}
          
          {status === 'downloading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-gold mb-4"></div>
              <p className="text-gray-400 font-medium">Downloading Apple Wallet pass...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-2xl text-white font-bold mb-4">Your pass is ready!</p>
              <p className="text-gray-400 mb-8">
                The download should have started automatically.
              </p>
              <p className="text-sm text-gray-500">
                If nothing happened, <button onClick={() => { setHasAttempted(false); handleDownload(); }} className="text-accent-gold hover:text-accent-gold/80 underline font-bold transition-colors">click here to try again</button>.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <span className="text-red-500 text-4xl font-bold">!</span>
              </div>
              <p className="text-red-500 mb-8 font-bold text-xl">{error}</p>
              <Button 
                onClick={() => { setHasAttempted(false); handleDownload(); }}
                className="!bg-neutral-dark !text-white hover:!bg-black border border-white/10"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDownload;
