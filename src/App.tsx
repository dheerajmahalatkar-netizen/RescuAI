/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Emergency from './pages/Emergency';
import Profile from './pages/Profile';
import Hospitals from './pages/Hospitals';
import SharedTracking from './pages/SharedTracking';
import SafetyDashboard from './pages/SafetyDashboard';
import BloodDonors from './pages/BloodDonors';
import Navigation from './components/Navigation';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/20 mb-8"
        >
          <Activity size={40} strokeWidth={2.5} />
        </motion.div>
        <div className="text-center">
          <p className="text-2xl font-black tracking-tighter uppercase font-display mb-1">RESCU_AI</p>
          <p className="text-white/40 font-mono text-[9px] font-black uppercase tracking-[0.4em]">Initializing secure safety protocols...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-medical-bg)] flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <main className="flex-1">
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/track/:id" element={<SharedTracking />} />
            <Route path="/" element={user ? <Home /> : <Navigate to="/auth" />} />
            <Route path="/emergency/:type" element={user ? <Emergency /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/hospitals" element={user ? <Hospitals /> : <Navigate to="/auth" />} />
            <Route path="/safety-radar" element={user ? <SafetyDashboard /> : <Navigate to="/auth" />} />
            <Route path="/blood-radar" element={user ? <BloodDonors /> : <Navigate to="/auth" />} />
          </Routes>
        </main>
        {user && <Navigation />}
      </div>
    </BrowserRouter>
  );
}
