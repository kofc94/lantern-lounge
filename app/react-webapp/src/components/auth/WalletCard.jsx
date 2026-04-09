import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchWalletPass, downloadAppleWalletPass } from '../../services/api';
import useAuth from '../../hooks/useAuth';

const WalletCard = () => {
  const { currentUser: user, getToken } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const android = /Android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(ios || android);

    if (user && (ios || android)) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchWalletPass(token);
      setWalletData(data);
    } catch (err) {
      setError('Could not load membership data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleWallet = async () => {
    setAppleLoading(true);
    try {
      const token = await getToken();
      const blob = await downloadAppleWalletPass(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lanternlounge.pkpass');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Apple Wallet error:', err);
      alert('Failed to download Apple Wallet pass. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  if (!user) return null;

  // Desktop View: Render QR code immediately without API calls
  if (!isMobile) {
    const checkinToken = `LL-CHECKIN:${user.email}`;
    const qrValue = `${window.location.origin}/wallet-download?checkin=${encodeURIComponent(checkinToken)}`;
    
    return (
      <div className="flex flex-col items-center w-full">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-3 text-center">Download Mobile Pass</p>
        <div className="p-3 bg-white rounded-sm border border-stone-200 shadow-sm">
          <QRCodeSVG
            value={qrValue}
            size={140}
            level="H"
            includeMargin={false}
          />
        </div>
        <span className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-[0.1em] text-center">Scan with your phone</span>
      </div>
    );
  }

  // Mobile View: Render loading/error/buttons
  return (
    <div className="flex flex-col items-center w-full">
      {loading ? (
        <div className="py-4 flex flex-col items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-gold mb-2"></div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Preparing Wallet Links...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-[10px] py-2 uppercase font-bold tracking-widest">{error}</div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1 text-center">Save to Wallet</p>
          
          {isIOS && (
            <button
              onClick={handleAppleWallet}
              disabled={appleLoading}
              className="flex items-center justify-center bg-black text-white rounded-sm py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {appleLoading ? (
                <span className="mr-2 animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-3 h-3 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              Apple Wallet
            </button>
          )}

          {isAndroid && walletData?.google_save_url && (
            <a
              href={walletData.google_save_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-black text-white rounded-sm py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition hover:bg-gray-900"
            >
              <svg className="w-3 h-3 mr-2 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Wallet
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletCard;
