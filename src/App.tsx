/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Emergency from './pages/Emergency';
import Profile from './pages/Profile';
import Hospitals from './pages/Hospitals';
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500 rounded-full mb-4"></div>
          <p className="text-gray-500 font-medium">RescuAI Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Home /> : <Navigate to="/auth" />} />
          <Route path="/emergency/:type" element={user ? <Emergency /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/hospitals" element={user ? <Hospitals /> : <Navigate to="/auth" />} />
        </Routes>
        {user && <Navigation />}
      </div>
    </BrowserRouter>
  );
}

