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
            className="flex items-center justify-center bg-black text-white rounded-lg py-2 px-4 transition hover:bg-gray-900 disabled:opacity-50"
            disabled={!walletData}
          >
            <span className="mr-2"></span> Add to Apple Wallet
          </button>
          <button 
            className="flex items-center justify-center bg-black text-white rounded-lg py-2 px-4 transition hover:bg-gray-900 disabled:opacity-50"
            disabled={!walletData}
          >
            <span className="mr-2">G</span> Add to Google Wallet
          </button>
        </div>
      </div>
      
      <div className="bg-gray-100 p-3 text-center text-xs text-gray-400 font-mono">
        TOKEN: {walletData?.wallet_token || 'PENDING...'}
      </div>
    </Card>
  );
};

export default WalletCard;
