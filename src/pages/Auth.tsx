import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';

export default function Auth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha resolved');
        }
      });
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return setError('Enter a phone number');
    setError('');
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      setError('Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8">
      <div id="recaptcha-container"></div>
      
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-12">
          <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-red-200">
            <HeartPulse size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">RescuAI</h1>
          <p className="text-gray-500 font-medium">Fast access to life-saving tools.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      placeholder="+91 12345 67890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>}

              <button
                disabled={loading}
                onClick={handleSendOtp}
                className="w-full bg-black text-white rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic OTP'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Verification Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all font-semibold tracking-[0.5em] text-center text-xl"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>}

              <button
                disabled={loading}
                onClick={handleVerifyOtp}
                className="w-full bg-red-600 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-red-200 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Continue to Dashboard'}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full mt-4 text-gray-400 font-bold uppercase tracking-widest text-xs"
              >
                Change Number
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-12 text-xs text-gray-400 text-center leading-relaxed">
          By continuing, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>. Standard message rates apply.
        </p>

        {/* FOR PREVIEW PURPOSES: Demo Bypass */}
        <div className="mt-8 pt-8 border-t border-gray-100 hidden">
           <p className="text-[10px] text-gray-300 uppercase tracking-widest text-center mb-2">Preview Only</p>
           <button 
             onClick={() => alert("Simulation point: Usually you'd use a real phone. For now, try with your actual number!")}
             className="w-full text-gray-400 text-[10px] uppercase font-bold"
           >
             Having trouble? Ensure you are in a new tab.
           </button>
        </div>
      </div>
    </div>
  );
}
