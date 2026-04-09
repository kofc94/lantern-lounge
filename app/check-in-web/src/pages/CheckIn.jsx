import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import useAuth from '../hooks/useAuth';
import { checkInUser, checkInByScan } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import clsx from 'clsx';

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
  const { getToken, isStaff } = useAuth();
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
      const text = scanResult.text;
      
      if (text.includes('LL-CHECKIN:')) {
        const parts = text.split('LL-CHECKIN:');
        const emailFromPrefix = parts[1].split(/[?&#]/)[0];
        await processCheckIn({ email: emailFromPrefix });
      } else if (text.includes('@') && !text.includes('?')) {
        await processCheckIn({ email: text });
      } else {
        let zeffyToken = null;
        try {
          const urlObj = new URL(text);
          zeffyToken = urlObj.searchParams.get('token') || urlObj.searchParams.get('checkin') || text;
          if (zeffyToken.includes('LL-CHECKIN:')) {
            const emailPart = zeffyToken.replace('LL-CHECKIN:', '');
            await processCheckIn({ email: emailPart });
            return;
          }
        } catch {
          zeffyToken = text;
        }
        await processCheckIn({ zeffyToken });
      }
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
    
    // If no guests entered, same as skip
    if (validGuests.length === 0) {
      resetScanner();
      return;
    }

    setGuestLoading(true);
    try {
      const token = await getToken();
      const data = await (pendingCheckIn.email
        ? checkInUser(pendingCheckIn.email, token, validGuests)
        : checkInByScan(pendingCheckIn.zeffyToken, token, validGuests));
      
      // Check if any guest has reached the visit limit (3 visits max)
      const warningGuests = data.guests?.filter(g => g.should_become_member) || [];
      
      if (warningGuests.length > 0) {
        setResult({
          success: true,
          message: 'Limit Reached',
          warningGuests: warningGuests
        });
        setStep('done');
      } else {
        // Success and no warnings: return directly to scanner
        resetScanner();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit guests');
      setStep('done');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleSkipGuests = () => resetScanner();

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

  // Check if any guest info has been typed
  const hasGuestData = guests.some(g => g.name.trim() || g.email.trim());

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

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <h3 className="text-[10px] font-bold text-lantern-gold uppercase tracking-[0.2em] mb-4">
                    Create a Wallet Pass
                  </h3>
                  <div className="flex justify-center mb-4">
                    <div className="p-2 bg-white rounded-sm shadow-xl">
                      <QRCodeSVG value="https://www.lanternlounge.org" size={120} level="M" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed max-w-[200px] mx-auto">
                    Scan to visit lanternlounge.org, sign in, open the menu and tap <span className="text-white font-bold">"Add to Wallet"</span> to save your membership card.
                  </p>
                </div>
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
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <Button onClick={resetScanner} variant="secondary" fullWidth>
              Try Again
            </Button>
          </div>
        )}

        {/* ── Special states (Warnings) ── */}
        {step === 'done' && result && result.success && result.warningGuests && (
          <div className="p-8 text-center">
            <div className="text-lantern-gold text-4xl mb-3">★</div>
            <h2 className="font-display text-xl font-bold text-white mb-2 uppercase tracking-widest">Member Invitation</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 text-center mx-auto">
              One or more guests have reached the 3-visit limit. We'd love for them to join the club!
            </p>
            
            <div className="space-y-3 mb-8 text-left max-w-[280px] mx-auto">
              {result.warningGuests.map((g, i) => (
                <div key={i} className="p-3 rounded-sm border border-lantern-gold/40 bg-lantern-gold/5">
                  <p className="text-white text-sm font-bold truncate">{g.name}</p>
                  <p className="text-gray-500 text-xs truncate">{g.email}</p>
                  <p className="text-lantern-gold text-[10px] mt-1.5 font-bold uppercase tracking-widest">
                    Visit #{g.visit_count} — Time to Join!
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-sm shadow-2xl">
                <QRCodeSVG value="https://www.lanternlounge.org/join-us" size={160} level="H" />
              </div>
            </div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-8 font-mono">lanternlounge.org/join-us</p>
            
            <Button onClick={resetScanner} variant="gold" fullWidth>
              Scan Next Guest
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

        {/* ── Guest entry ── */}
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
                <div className="mb-6 p-3 rounded-sm border border-amber-500/40 bg-amber-500/10">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                    Membership expires {expiry.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — Don't forget to renew!
                  </p>
                </div>
              ) : null;
            })()}

            <div className="mb-6">
              <h3 className="text-sm font-bold text-lantern-gold uppercase tracking-widest mb-1 text-center">
                Having some friends?
              </h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">
                Please sign them in!
              </p>
            </div>

            <form onSubmit={handleSubmitGuests} className="space-y-4">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guest Name</th>
                      <th className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">Email Address</th>
                      <th className="py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {guests.map((guest, i) => (
                      <tr key={i} className="group">
                        <td className="py-3 pr-2">
                          <input
                            type="text"
                            value={guest.name}
                            onChange={(e) => handleGuestChange(i, 'name', e.target.value)}
                            className="w-full bg-dark/50 border border-white/10 text-white p-2 rounded-sm focus:border-lantern-gold outline-none transition-colors text-xs placeholder:text-gray-700"
                            placeholder="Full name"
                            autoFocus={i === 0}
                          />
                        </td>
                        <td className="py-3 pl-2 pr-2">
                          <input
                            type="email"
                            value={guest.email}
                            onChange={(e) => handleGuestChange(i, 'email', e.target.value)}
                            className="w-full bg-dark/50 border border-white/10 text-white p-2 rounded-sm focus:border-lantern-gold outline-none transition-colors text-xs placeholder:text-gray-700"
                            placeholder="Email"
                          />
                        </td>
                        <td className="py-3 text-right">
                          {guests.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGuest(i)}
                              className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                              title="Remove Guest"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddGuest}
                className="w-full border border-dashed border-white/10 text-gray-600 hover:border-lantern-gold/40 hover:text-lantern-gold text-[10px] uppercase font-bold tracking-widest py-2 rounded-sm transition-colors"
              >
                + Add Another Friend
              </button>

              <div className="pt-4 flex flex-col gap-3">
                {hasGuestData ? (
                  <Button type="submit" variant="gold" fullWidth disabled={guestLoading}>
                    {guestLoading ? 'Saving Guests…' : 'Submit & Finish'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="gold"
                    fullWidth
                    onClick={handleSkipGuests}
                  >
                    No guests tonight — skip
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CheckIn;
