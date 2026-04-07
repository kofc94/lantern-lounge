import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import useAuth from '../hooks/useAuth';
import { checkInUser, checkInByScan } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const emptyGuest = () => ({ name: '', email: '' });

const StepDots = ({ step }) => {
  const steps = ['checkin', 'guests', 'done'];
  return (
    <div className="flex items-center justify-center gap-2 py-3 border-b border-white/5">
      {steps.map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === step
              ? 'w-5 h-1.5 bg-lantern-gold'
              : steps.indexOf(s) < steps.indexOf(step)
              ? 'w-1.5 h-1.5 bg-lantern-gold/40'
              : 'w-1.5 h-1.5 bg-white/10'
          }`}
        />
      ))}
    </div>
  );
};

const CheckIn = () => {
  const { user, getToken, isStaff } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const [step, setStep] = useState('checkin'); // 'checkin' | 'guests' | 'done' | 'unregistered' | 'expired'
  const [guests, setGuests] = useState([emptyGuest()]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState(null);
  const [unregisteredMember, setUnregisteredMember] = useState(null);
  const [expiredMember, setExpiredMember] = useState(null);

  const handleUpdate = async (err, scanResult) => {
    if (scanResult && scanning) {
      setScanning(false);
      let zeffyToken = null;
      try {
        zeffyToken = new URL(scanResult.text).searchParams.get('token');
      } catch {
        // not a URL
      }
      await processCheckIn({ zeffyToken });
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!email) return;
    setScanning(false);
    await processCheckIn({ email });
  };

  const processCheckIn = async ({ email: emailAddr, zeffyToken }) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = emailAddr
        ? await checkInUser(emailAddr, token, [])
        : await checkInByScan(zeffyToken, token, []);
      const firstName = data.user_name ? data.user_name.split(' ')[0] : null;
      setResult({
        success: true,
        message: firstName ? `Welcome ${firstName}!` : 'Guest Checked In!',
        details: data,
      });
      setPendingCheckIn({ email: emailAddr, zeffyToken });
      setStep('guests');
    } catch (err) {
      if (err.code === 'not_registered' && err.zeffyMember) {
        setUnregisteredMember(err.zeffyMember);
        setStep('unregistered');
      } else if (err.code === 'membership_expired') {
        setExpiredMember({ expiryDate: err.expiryDate });
        setStep('expired');
      } else {
        setError(err.message || 'Check-in failed');
        setResult({ success: false });
        setStep('done');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = () => setGuests([...guests, emptyGuest()]);
  const handleRemoveGuest = (i) => setGuests(guests.filter((_, idx) => idx !== i));
  const handleGuestChange = (i, field, value) => {
    const updated = [...guests];
    updated[i] = { ...updated[i], [field]: value };
    setGuests(updated);
  };

  const handleSubmitGuests = async (e) => {
    e.preventDefault();
    const validGuests = guests.filter(g => g.name.trim() && g.email.trim());
    setGuestLoading(true);
    try {
      const token = await getToken();
      const data = pendingCheckIn.email
        ? await checkInUser(pendingCheckIn.email, token, validGuests)
        : await checkInByScan(pendingCheckIn.zeffyToken, token, validGuests);
      setResult(prev => ({ ...prev, details: { ...prev.details, guests: data.guests } }));
    } catch {
      // Non-fatal — member is already checked in
    } finally {
      setGuestLoading(false);
      setStep('done');
    }
  };

  const handleSkipGuests = () => setStep('done');

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setEmail('');
    setStep('checkin');
    setGuests([emptyGuest()]);
    setPendingCheckIn(null);
    setUnregisteredMember(null);
    setExpiredMember(null);
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
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="font-display text-3xl font-bold mb-6 text-center text-lantern-gold uppercase tracking-widest">
        Entrance Check-In
      </h1>

      <Card className="overflow-hidden bg-dark-light border border-lantern-gold/30 shadow-[0_0_30px_rgba(197,160,89,0.08)]" hover={false}>
        {step !== 'checkin' && <StepDots step={step} />}

        {/* ── Scanner / Manual entry ── */}
        {step === 'checkin' && !loading && (
          <>
            {!scanning ? (
              <div className="p-6">
                <h2 className="text-sm font-bold text-white mb-5 text-center uppercase tracking-widest">
                  Manual Check-In
                </h2>
                <form onSubmit={handleManualCheckIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">
                      Member Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-dark border border-white/10 text-white p-4 rounded-sm focus:border-lantern-gold outline-none transition-colors placeholder:text-gray-600"
                      placeholder="member@example.com"
                      autoFocus
                      autoComplete="email"
                      required
                    />
                  </div>
                  <Button type="submit" variant="gold" fullWidth>
                    Verify &amp; Check In
                  </Button>
                  <button
                    type="button"
                    onClick={() => setScanning(true)}
                    className="w-full py-3 text-gray-500 text-xs uppercase font-bold tracking-widest hover:text-gray-300 transition-colors"
                  >
                    ← Back to Scanner
                  </button>
                </form>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => setScanning(false)}
                    aria-label="Switch to manual entry"
                    className="bg-black/70 text-lantern-gold text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-sm border border-lantern-gold/30 hover:bg-lantern-gold hover:text-black transition-all"
                  >
                    Manual Entry
                  </button>
                </div>
                <BarcodeScanner width="100%" height="300px" onUpdate={handleUpdate} />
                <div className="absolute inset-0 pointer-events-none border-2 border-lantern-gold/50 m-10 rounded-sm animate-pulse" />
                <p className="text-center p-4 text-lantern-gold/70 font-mono text-xs uppercase tracking-widest">
                  Scanning for Membership QR…
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lantern-gold mx-auto mb-4" />
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">
              Verifying…
            </p>
          </div>
        )}

        {/* ── Failed check-in ── */}
        {step === 'done' && result && !result.success && (
          <div className="p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <h2 className="text-xl font-bold text-white mb-2">Not Found</h2>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <Button onClick={resetScanner} variant="secondary" fullWidth>
              Try Again
            </Button>
          </div>
        )}

        {/* ── Unregistered Zeffy member ── */}
        {step === 'unregistered' && unregisteredMember && (() => {
          const params = new URLSearchParams({
            name: `${unregisteredMember.first_name} ${unregisteredMember.last_name}`.trim(),
            email: unregisteredMember.email,
          });
          const registerUrl = `https://www.lanternlounge.org/register?${params}`;
          return (
            <div className="p-8 text-center">
              <div className="text-lantern-gold text-4xl mb-3">!</div>
              <h2 className="font-display text-xl font-bold text-white mb-1">
                {unregisteredMember.first_name} {unregisteredMember.last_name}
              </h2>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">{unregisteredMember.email}</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Although you are a member of the Lantern Lounge, you also need to register on the lanternlounge.org website. Please scan the QR code to do this.
              </p>
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white rounded-sm">
                  <QRCodeSVG value={registerUrl} size={140} level="H" />
                </div>
              </div>
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-6">lanternlounge.org/register</p>
              <Button onClick={resetScanner} variant="secondary" fullWidth>
                Scan Next Guest
              </Button>
            </div>
          );
        })()}

        {/* ── Expired membership ── */}
        {step === 'expired' && expiredMember && (
          <div className="p-8 text-center">
            <div className="text-red-500 text-4xl mb-3">✕</div>
            <h2 className="font-display text-xl font-bold text-white mb-3">Membership Expired</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              Sorry, you must renew your membership in order to use the Lantern Lounge.
            </p>
            {expiredMember.expiryDate && (
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">
                Expired {new Date(expiredMember.expiryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white rounded-sm">
                <QRCodeSVG value="https://www.lanternlounge.org/join-us" size={140} level="H" />
              </div>
            </div>
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-6">lanternlounge.org/join-us</p>
            <Button onClick={resetScanner} variant="secondary" fullWidth>
              Scan Next Guest
            </Button>
          </div>
        )}

        {/* ── Non-member guest entry ── */}
        {step === 'guests' && result?.success && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-green-400 text-3xl mb-2">✓</div>
              <h2 className="text-xl font-bold text-white font-display">{result.message}</h2>
            </div>

            {result.details?.expiry_date && (() => {
              const expiry = new Date(result.details.expiry_date + 'T00:00:00');
              const daysLeft = Math.ceil((expiry - new Date()) / 86400000);
              return daysLeft <= 30 ? (
                <div className="mb-4 p-3 rounded-sm border border-amber-500/40 bg-amber-500/10">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                    Membership expires {expiry.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Don't forget to renew!
                  </p>
                </div>
              ) : null;
            })()}

            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Non-Member Guests
            </p>

            <form onSubmit={handleSubmitGuests} className="space-y-3">
              {guests.map((guest, i) => (
                <div key={i} className="bg-dark border border-white/8 rounded-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                      Guest {i + 1}
                    </span>
                    {guests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(i)}
                        aria-label={`Remove guest ${i + 1}`}
                        className="text-gray-600 hover:text-red-400 text-xs uppercase font-bold tracking-widest transition-colors py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => handleGuestChange(i, 'name', e.target.value)}
                    className="w-full bg-dark-light border border-white/10 text-white p-3 rounded-sm focus:border-lantern-gold outline-none transition-colors text-sm placeholder:text-gray-600"
                    placeholder="Full name"
                    autoFocus={i === 0}
                  />
                  <input
                    type="email"
                    value={guest.email}
                    onChange={(e) => handleGuestChange(i, 'email', e.target.value)}
                    className="w-full bg-dark-light border border-white/10 text-white p-3 rounded-sm focus:border-lantern-gold outline-none transition-colors text-sm placeholder:text-gray-600"
                    placeholder="Email address"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddGuest}
                className="w-full border border-dashed border-white/10 text-gray-500 hover:border-lantern-gold/50 hover:text-lantern-gold text-xs uppercase font-bold tracking-widest py-3 rounded-sm transition-colors"
              >
                + Add Another Guest
              </button>

              <Button type="submit" variant="gold" fullWidth disabled={guestLoading}>
                {guestLoading ? 'Saving…' : 'Submit Guests'}
              </Button>

              <button
                type="button"
                onClick={handleSkipGuests}
                className="w-full py-3 text-gray-600 text-xs uppercase font-bold tracking-widest hover:text-gray-400 transition-colors"
              >
                No guests tonight — skip
              </button>
            </form>
          </div>
        )}

        {/* ── Final result ── */}
        {step === 'done' && result?.success && (
          <div className="p-8 text-center">
            <div className="text-green-400 text-5xl mb-3">✓</div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">{result.message}</h2>
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-4">Checked in successfully</p>

            {result.details?.expiry_date && (() => {
              const expiry = new Date(result.details.expiry_date + 'T00:00:00');
              const daysLeft = Math.ceil((expiry - new Date()) / 86400000);
              return daysLeft <= 30 ? (
                <div className="mb-4 p-3 rounded-sm border border-amber-500/40 bg-amber-500/10 text-left">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                    Membership expires {expiry.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Don't forget to renew!
                  </p>
                </div>
              ) : null;
            })()}

            {result.details?.guests?.length > 0 && (
              <div className="space-y-2 text-left mb-6">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">Guests</p>
                {result.details.guests.map((g, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-sm border ${
                      g.should_become_member
                        ? 'border-lantern-gold/40 bg-lantern-gold/5'
                        : 'border-white/8 bg-white/3'
                    }`}
                  >
                    <p className="text-white text-sm font-bold">{g.name}</p>
                    <p className="text-gray-500 text-xs">{g.email}</p>
                    {g.should_become_member && (
                      <p className="text-lantern-gold text-xs mt-1.5 font-bold uppercase tracking-widest">
                        ★ {g.visit_count} visits — invite to become a member
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button onClick={resetScanner} variant="gold" fullWidth>
              Scan Next Guest
            </Button>
          </div>
        )}
      </Card>

      {/* Staff identity strip */}
      <div className="mt-4 px-4 py-3 flex items-center gap-3 border border-white/5 rounded-sm bg-dark-light/50">
        <div className="w-7 h-7 rounded-full bg-lantern-gold/20 border border-lantern-gold/30 flex items-center justify-center text-lantern-gold font-bold text-xs shrink-0">
          {user?.name?.charAt(0) || 'S'}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-bold leading-none truncate">{user?.name}</p>
          <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-0.5">Authorized Staff</p>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
