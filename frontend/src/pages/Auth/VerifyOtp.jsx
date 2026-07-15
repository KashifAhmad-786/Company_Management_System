import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const VerifyOtp = () => {
  const { verifyOtp, resendOtp, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [timer, setTimer] = useState(60); // 60s cooldown for resend
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    clearError();
    if (!email) {
      setLocalError('No email address provided. Please return to login.');
    }
  }, [email]);

  // Resend OTP countdown
  useEffect(() => {
    let interval = null;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Allow numbers only
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Get last typed character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: move focus back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const charArray = pastedData.split('');
      setOtp(charArray);
      // Focus on the last input
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');
    
    const code = otp.join('');
    if (code.length !== 6) {
      setLocalError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, code);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLocalError('');
    setLocalSuccess('');
    setLoading(true);

    try {
      await resendOtp(email);
      setLocalSuccess('A fresh 6-digit verification code has been dispatched to your email.');
      setCanResend(false);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setLocalError(err.message || 'Failed to dispatch a new verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-brand-600 to-cyan-400 rounded-2xl shadow-xl shadow-brand-500/20 mb-4 animate-pulse">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Verify Your Account</h2>
          <p className="text-slate-400 mt-2 text-sm">We've sent a 6-digit OTP code to</p>
          <p className="text-brand-400 font-semibold text-sm mt-1">{email || 'your email address'}</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-slate-800">
          {localError || authError ? (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{localError || authError}</span>
            </div>
          ) : null}

          {localSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{localSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Grid */}
            <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={!email || loading}
                  className="w-12 h-14 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-xl font-bold text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm shadow-lg shadow-brand-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Verify Account'
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="text-center mt-6">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Code
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                Resend code in <strong className="text-slate-400 font-bold">{timer}s</strong>
              </span>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 mt-6 text-xs">
          Need to change email?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
