import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchWalletPass } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Button from '../common/Button';
import Card from '../common/Card';

const WalletCard = () => {
  const { user, token } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      loadWalletData();
    }
  }, [token]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const data = await fetchWalletPass(token);
      setWalletData(data);
    } catch (err) {
      setError('Could not load membership card');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto overflow-hidden">
      <div className="bg-lantern-gold text-lantern-black p-4 text-center font-bold text-xl uppercase tracking-widest border-b-4 border-lantern-black">
        Lantern Lounge Membership
      </div>

      <div className="p-8 flex flex-col items-center bg-white">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lantern-gold"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 py-10">{error}</div>
        ) : walletData ? (
          <>
            <div className="mb-6 p-4 border-8 border-lantern-black rounded-xl bg-white shadow-inner">
              <QRCodeSVG
                value={walletData.wallet_token}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-lantern-black">{user.name}</h3>
              <p className="text-gray-500 uppercase tracking-tighter text-sm font-medium">Member Since 2026</p>
            </div>
          </>
        ) : (
          <Button onClick={loadWalletData}>Generate Membership Card</Button>
        )}

        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            className="flex items-center justify-center bg-black text-white rounded-lg py-2 px-4 transition hover:bg-gray-900 disabled:opacity-50 cursor-not-allowed"
            disabled
          >
            <span className="mr-2"></span> Add to Apple Wallet
          </button>
          {walletData?.google_save_url ? (
            <a
              href={walletData.google_save_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-black text-white rounded-lg py-2 px-4 transition hover:bg-gray-900"
            >
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Add to Google Wallet
            </a>
          ) : (
            <button
              className="flex items-center justify-center bg-black text-white rounded-lg py-2 px-4 transition opacity-50 cursor-not-allowed"
              disabled
            >
              <svg className="w-4 h-4 mr-2 shrink-0 opacity-50" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              Add to Google Wallet
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-100 p-3 text-center text-xs text-gray-400 font-mono">
        TOKEN: {walletData?.wallet_token || 'PENDING...'}
      </div>
    </Card>
  );
};

export default WalletCard;
