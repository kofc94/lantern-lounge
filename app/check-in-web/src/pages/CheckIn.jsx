import React, { useState } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import useAuth from '../hooks/useAuth';
import { checkInUser } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const CheckIn = () => {
  const { user, token, isStaff } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const handleUpdate = async (err, result) => {
    if (result && scanning) {
      setScanning(false);
      await processCheckIn(result.text, null);
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!email) return;
    setScanning(false);
    await processCheckIn(null, email);
  };

  const processCheckIn = async (walletToken, emailAddr) => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkInUser(walletToken, emailAddr, token);
      setResult({
        success: true,
        message: 'Guest Checked In Successfully!',
        details: data
      });
    } catch (err) {
      setError(err.message || 'Check-in failed');
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setEmail('');
  };

  if (!isStaff) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-400">This page is for staff use only.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-3xl font-bold mb-8 text-center text-lantern-gold uppercase tracking-widest border-b-2 border-lantern-gold pb-4">
        Entrance Check-In
      </h1>

      <Card className="overflow-hidden bg-black border-2 border-lantern-gold shadow-[0_0_20px_rgba(255,215,0,0.2)]">
        {!scanning && !loading && !result ? (
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-widest">Manual Check-In</h2>
            <form onSubmit={handleManualCheckIn} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Guest Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white p-4 rounded-sm focus:border-lantern-gold outline-none transition-colors"
                  placeholder="guest@example.com"
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Verify & Check In
              </Button>
              <button 
                type="button"
                onClick={() => setScanning(true)}
                className="w-full text-gray-500 text-xs uppercase font-bold tracking-widest hover:text-white transition-colors"
              >
                Back to Scanner
              </button>
            </form>
          </div>
        ) : scanning ? (
          <div className="relative">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setScanning(false)}
                className="bg-black/80 text-lantern-gold text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full border border-lantern-gold/50 hover:bg-lantern-gold hover:text-black transition-all"
              >
                Manual Entry
              </button>
            </div>
            <BarcodeScanner
              width="100%"
              height="300px"
              onUpdate={handleUpdate}
            />
            <div className="absolute inset-0 pointer-events-none border-2 border-lantern-gold m-10 border-dashed opacity-50 animate-pulse"></div>
            <p className="text-center p-4 text-lantern-gold font-mono uppercase tracking-tighter">
              Scanning for Membership QR...
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            {loading ? (
              <div className="py-10">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lantern-gold mx-auto mb-4"></div>
                <p className="text-white">Verifying Membership...</p>
              </div>
            ) : result?.success ? (
              <div className="py-6">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-white mb-2">{result.message}</h2>
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800 mb-6 text-left">
                  <p className="text-xs text-gray-500 uppercase mb-1">Guest ID</p>
                  <p className="text-white font-mono text-sm truncate">{result.details.user_id}</p>
                  <p className="text-xs text-gray-500 uppercase mt-3 mb-1">Check-in Method</p>
                  <p className="text-white text-sm capitalize">{result.details.method || 'Digital Pass'}</p>
                </div>
                <Button onClick={resetScanner} variant="primary" className="w-full">
                  Scan Next Guest
                </Button>
              </div>
            ) : (
              <div className="py-6">
                <div className="text-red-500 text-6xl mb-4">✕</div>
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-red-400 mb-6">{error}</p>
                <Button onClick={resetScanner} variant="secondary" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="mt-8 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Logged In As</h3>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-lantern-gold flex items-center justify-center text-black font-bold text-xs mr-3">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="text-white text-sm font-bold">{user?.name}</p>
            <p className="text-gray-500 text-xs uppercase">Authorized Staff</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
