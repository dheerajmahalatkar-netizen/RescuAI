import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ShieldCheck, HeartPulse, ArrowRight, Mail, Lock, LogIn, UserPlus, Activity, ShieldAlert, Globe } from 'lucide-react';
import { 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  googleProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';

export default function Auth() {
  const [mode, setMode] = useState<'method-selection' | 'phone' | 'otp' | 'email-login' | 'email-signup'>('method-selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return setError('Enter credentials');
    setError('');
    setLoading(true);
    try {
      if (mode === 'email-signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Auth failed');
    } finally {
      setLoading(false);
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
      setMode('otp');
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
    <div className="min-h-screen bg-slate-900 flex flex-col p-8 overflow-hidden relative">
      <div id="recaptcha-container"></div>
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <header className="mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-red-600/20"
          >
            <Activity size={44} strokeWidth={2.5} />
          </motion.div>
          <div className="space-y-1">
             <p className="text-red-500 font-mono text-[10px] font-black uppercase tracking-[0.4em]">Initialize_Sequence</p>
             <h1 className="text-5xl font-black tracking-tighter text-white uppercase font-display italic">RescuAI</h1>
             <p className="text-white/40 font-medium text-sm leading-tight max-w-[200px]">Next-gen clinical protocol access.</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'method-selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                 <button
                   onClick={() => setMode('phone')}
                   className="tech-card bg-white/5 border-white/5 hover:bg-white hover:text-slate-900 p-6 flex flex-col items-center gap-3 group transition-all"
                 >
                   <Phone size={24} className="text-red-500 group-hover:text-red-600 transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest font-mono">Mobile_ID</span>
                 </button>
                 <button
                   onClick={() => setMode('email-login')}
                   className="tech-card bg-white/5 border-white/5 hover:bg-white hover:text-slate-900 p-6 flex flex-col items-center gap-3 group transition-all"
                 >
                   <Mail size={24} className="text-red-500 group-hover:text-red-600 transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest font-mono">Terminal_ID</span>
                 </button>
              </div>

              <div className="relative py-4 flex items-center">
                 <div className="flex-1 h-px bg-white/5" />
                 <span className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Secure_Link_Option</span>
                 <div className="flex-1 h-px bg-white/5" />
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-18 bg-white text-slate-900 rounded-[2rem] flex items-center justify-center gap-4 font-black transition-all active:scale-95 shadow-2xl disabled:opacity-50"
              >
                <Globe size={24} className="text-red-600" />
                <span className="font-display tracking-tight text-xl uppercase">Google_Sync</span>
              </button>
            </motion.div>
          )}

          {mode === 'phone' && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                 <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">AUTH_PHASE: MOBILE</p>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-display">CELLULAR_LINK</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-1 font-mono">Phone_Sequence</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                      type="tel"
                      placeholder="+91_NODE_ENDPOINT"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-6 pl-16 pr-6 focus:bg-white/10 focus:border-red-500/50 outline-none transition-all font-bold text-white tracking-widest"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-bold leading-relaxed px-2 uppercase tracking-tight">{error}</p>}

                <button
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="w-full h-18 bg-red-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-red-600/20 disabled:opacity-50 font-display"
                >
                  {loading ? 'Transmitting...' : 'ESTABLISH_LINK'}
                  <ArrowRight size={22} />
                </button>

                <button onClick={() => setMode('method-selection')} className="w-full py-4 text-white/20 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">
                  Abort_Handshake
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                 <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">AUTH_PHASE: VERIFY</p>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-display">SECURITY_CODE</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-1 font-mono">Verification_Sequence</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                      type="number"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-6 pl-16 pr-6 focus:bg-white/10 focus:border-red-500/50 outline-none transition-all font-bold text-white tracking-[1em] text-center text-3xl font-display"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-bold leading-relaxed px-2 uppercase tracking-tight">{error}</p>}

                <button
                  disabled={loading}
                  onClick={handleVerifyOtp}
                  className="w-full h-18 bg-emerald-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-emerald-600/20 disabled:opacity-50 font-display"
                >
                  {loading ? 'Verifying...' : 'GRANT_ACCESS'}
                </button>

                <button onClick={() => setMode('phone')} className="w-full py-4 text-white/20 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">
                  Retry_Sequence
                </button>
              </div>
            </motion.div>
          )}

          {(mode === 'email-login' || mode === 'email-signup') && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                 <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">AUTH_PHASE: TERMINAL</p>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-display">
                    {mode === 'email-signup' ? 'NEW_ACCOUNT' : 'LOG_IN'}
                 </h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-1 font-mono">Terminal_ID</label>
                  <input
                    type="email"
                    placeholder="clinical_relay@endpoint.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 focus:bg-white/10 outline-none transition-all font-bold text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-1 font-mono">Access_Key</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 focus:bg-white/10 outline-none transition-all font-bold text-white text-sm"
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-bold leading-relaxed px-2 uppercase tracking-tight">{error}</p>}

                <button
                  disabled={loading}
                  onClick={handleEmailAuth}
                  className="w-full h-16 bg-white text-slate-900 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all uppercase font-display"
                >
                  {loading ? 'Processing...' : (mode === 'email-signup' ? 'REGISTER_NODE' : 'ACCESS_TERMINAL')}
                </button>

                <div className="flex flex-col gap-4 mt-6">
                  <button onClick={() => setMode(mode === 'email-signup' ? 'email-login' : 'email-signup')} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">
                    {mode === 'email-signup' ? 'Shift to Login Protocol' : 'Shift to Registry Protocol'}
                  </button>
                  <button onClick={() => setMode('method-selection')} className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white/40">
                    Other Channels
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20">
           <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
              <p className="text-[10px] text-white/30 text-center leading-relaxed font-medium uppercase tracking-[0.05em]">
                Secure clinical data channel initialized. By mounting this link, you acknowledge safety protocols and residency in compliant regions.
              </p>
           </div>
           <div className="mt-6 flex justify-center gap-4 text-white/10">
              <ShieldCheck size={16} />
              <Activity size={16} />
              <Globe size={16} />
           </div>
        </footer>
      </div>
    </div>
  );
}
