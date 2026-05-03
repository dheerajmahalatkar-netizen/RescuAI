import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  Flame, 
  Wind, 
  Droplet, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { EmergencyCategory } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [showSOS, setShowSOS] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('disclaimerAccepted'));

  const categories = [
    { id: EmergencyCategory.MEDICAL, label: 'Medical', icon: Activity, color: 'bg-blue-500' },
    { id: EmergencyCategory.ACCIDENT, label: 'Accident', icon: Truck, color: 'bg-orange-500' },
    { id: EmergencyCategory.FIRE, label: 'Fire', icon: Flame, color: 'bg-red-500' },
    { id: EmergencyCategory.BREATHING, label: 'Breathing', icon: Wind, color: 'bg-teal-500' },
    { id: EmergencyCategory.BLEEDING, label: 'Bleeding', icon: Droplet, color: 'bg-rose-500' },
    { id: EmergencyCategory.OTHER, label: 'Other', icon: AlertCircle, color: 'bg-gray-500' },
  ];

  const handleSOS = () => {
    setShowSOS(true);
  };

  const selectCategory = (type: string) => {
    navigate(`/emergency/${type}`);
  };

  const acceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">RescuAI</h1>
        <p className="text-gray-500">Instant AI-powered emergency support</p>
      </header>

      {/* SOS Button Section */}
      <div className="flex flex-col items-center justify-center mb-12">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSOS}
          className="relative w-56 h-56 rounded-full bg-red-600 shadow-2xl flex flex-col items-center justify-center text-white border-8 border-red-100/30 group mb-4"
        >
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
          <ShieldAlert size={64} className="mb-2" />
          <span className="text-3xl font-black tracking-tighter uppercase">SOS</span>
        </motion.button>
        <p className="text-sm font-semibold text-red-600 uppercase tracking-widest">Hold for 3 seconds to trigger</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectCategory(cat.id)}
            className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition-all"
          >
            <div className={`w-12 h-12 ${cat.color} rounded-full flex items-center justify-center text-white mb-2 shadow-inner`}>
              <cat.icon size={24} />
            </div>
            <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Quick Help Tip */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
        <div>
          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Safety First</p>
          <p className="text-sm text-yellow-700 leading-tight">Always try to clear the area and stay safe before providing assistance.</p>
        </div>
      </div>

      {/* SOS Selection Overlay */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end p-6"
          >
            <div className="bg-white w-full rounded-3xl p-6 pb-10">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Type?</h2>
              <p className="text-gray-500 mb-6">Select a category for faster guidance</p>
              
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-10 h-10 ${cat.color} rounded-full flex items-center justify-center text-white shadow-sm`}>
                      <cat.icon size={20} />
                    </div>
                    <span className="font-semibold text-gray-800">{cat.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowSOS(false)}
                className="w-full mt-8 py-4 text-gray-500 font-semibold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[200] flex flex-col p-8 overflow-y-auto"
          >
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <ShieldAlert size={40} className="text-red-600" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-4 text-center">Safety Disclaimer</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-center mb-10">
                <p>This app provides <strong>guided assistance</strong> based on AI triage. It is <span className="text-red-600 font-bold underline">NOT a substitute</span> for professional medical care.</p>
                <p>In all critical emergencies, you must <strong>contact official emergency services (112, 911)</strong> immediately.</p>
                <p>By continuing, you agree that you understand the guidance is informational and you are using it at your own risk.</p>
              </div>
              <button
                onClick={acceptDisclaimer}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-black/10 active:scale-95 transition-transform"
              >
                I Understand & Accept
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
