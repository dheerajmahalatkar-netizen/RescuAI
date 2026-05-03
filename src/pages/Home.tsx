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
  Truck,
  Shield,
  MapPin,
  Heart,
  Stethoscope,
  ChevronRight,
  Wifi,
  Battery,
  XCircle
} from 'lucide-react';
import { EmergencyCategory } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const [showSOS, setShowSOS] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('disclaimerAccepted'));
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { id: EmergencyCategory.MEDICAL, label: 'Medical', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: EmergencyCategory.ACCIDENT, label: 'Accident', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: EmergencyCategory.FIRE, label: 'Fire', icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
    { id: EmergencyCategory.BREATHING, label: 'Breathing', icon: Wind, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: EmergencyCategory.BLEEDING, label: 'Bleeding', icon: Droplet, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: EmergencyCategory.OTHER, label: 'Other', icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
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
    <div className="min-h-screen bg-[var(--color-medical-bg)] flex flex-col">
      {/* Simulation StatusBar */}
      <div className="bg-slate-900 px-6 py-2 flex justify-between items-center text-white/50 font-mono text-[9px] font-bold">
        <div className="flex items-center gap-4">
          <span>{time}</span>
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-emerald-500/80">RESCU_LINK: STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Wifi size={10} />
          <Battery size={10} />
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Header */}
        <header className="mb-10 flex justify-between items-end">
           <div>
             <p className="text-red-600 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-1">SYSTEM_OPERATIONAL</p>
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 font-display leading-none">RescuAI</h1>
           </div>
           <div className="flex flex-col items-end">
             <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg overflow-hidden border border-white/10">
                <Shield size={20} className="text-emerald-400" />
             </div>
           </div>
        </header>

        {/* SOS Button Section */}
        <section className="flex-1 flex flex-col items-center justify-center py-8">
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative"
           >
              {/* Outer pulse layers */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-red-600 rounded-full filter blur-3xl -z-10"
              />
              
              <motion.button
                whileTap={{ scale: 0.9, rotate: -2 }}
                onClick={handleSOS}
                className="relative w-64 h-64 rounded-[3.5rem] bg-red-600 shadow-[0_30px_100px_-20px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center text-white border-[12px] border-white/20 group ring-1 ring-white/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                <motion.div
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ShieldAlert size={80} className="mb-4 drop-shadow-2xl" />
                </motion.div>
                <span className="text-5xl font-black tracking-tighter uppercase font-display italic">SOS</span>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce mx-0.5" />
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce mx-0.5 [animation-delay:0.2s]" />
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce mx-0.5 [animation-delay:0.4s]" />
                </div>
              </motion.button>
           </motion.div>
           
           <div className="mt-10 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-tight">TRIGGER_RESPONSE_UNIT</p>
              <p className="text-slate-900 font-bold text-sm">Critical life-safety protocols active</p>
           </div>
        </section>

        {/* Categories Grid - Compact & Technical */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6 px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Activity size={14} className="text-red-500" />
                Situational Awareness
             </h2>
             <span className="font-mono text-[8px] text-slate-300">MOD_ALPHA_09</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             {categories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectCategory(cat.id)}
                  className="flex flex-col items-center justify-center aspect-square bg-white rounded-[1.75rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all p-3 group"
                >
                   <div className={`w-10 h-10 ${cat.bg} rounded-xl flex items-center justify-center ${cat.color} mb-2 shadow-inner group-hover:scale-110 transition-transform`}>
                      <cat.icon size={20} strokeWidth={2.5} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{cat.label}</span>
                </motion.button>
             ))}
          </div>
        </section>

        {/* Functional Quick Actions */}
        <section className="grid grid-cols-2 gap-4 mb-4">
           <button 
             onClick={() => navigate('/safety-radar')}
             className="tech-card p-6 flex flex-col gap-4 relative overflow-hidden bg-slate-900 text-white group"
           >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-emerald-500/20 transition-colors">
                <MapPin size={24} className="text-emerald-400" />
              </div>
              <div className="text-left mt-2">
                <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1 font-display">Safety Radar</h3>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-tight">Live Response Map</p>
              </div>
              <ChevronRight className="absolute top-6 right-6 text-white/20 group-hover:text-white transition-colors" size={20} />
           </button>

           <button 
             onClick={() => navigate('/blood-radar')}
             className="tech-card p-6 flex flex-col gap-4 relative overflow-hidden bg-white text-slate-900 border border-slate-100 group"
           >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all">
                <Droplet size={24} className="group-hover:fill-current" />
              </div>
              <div className="text-left mt-2">
                <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1 font-display">Blood Hub</h3>
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-tight">Emergency Reserve</p>
              </div>
              <ChevronRight className="absolute top-6 right-6 text-slate-200 group-hover:text-slate-900 transition-colors" size={20} />
           </button>
        </section>
      </div>

      {/* SOS Selection Overlay */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-end p-6"
          >
            <motion.div
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100, scale: 0.9 }}
              className="bg-white w-full rounded-[3rem] p-8 pb-12 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-1/2 h-full bg-red-600"
                  />
               </div>
               
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">CATEGORY_SELECTION_REQUIRED</p>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-display leading-tight">IDENTIFY_SITUATION</h2>
                  </div>
                  <XCircle size={32} className="text-slate-200 hover:text-slate-900 transition-colors cursor-pointer" onClick={() => setShowSOS(false)} />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 {categories.map((cat) => (
                   <button
                     key={cat.id}
                     onClick={() => selectCategory(cat.id)}
                     className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.75rem] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all group"
                   >
                     <div className={`w-12 h-12 ${cat.bg} rounded-2xl flex items-center justify-center ${cat.color} shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                       <cat.icon size={22} strokeWidth={2.5} />
                     </div>
                     <span className="font-black text-sm uppercase tracking-tighter font-display">{cat.label}</span>
                   </button>
                 ))}
               </div>

               <button 
                 onClick={() => setShowSOS(false)}
                 className="w-full mt-8 py-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-slate-900 transition-colors"
               >
                 ABORT_PROCEDURE
               </button>
            </motion.div>
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
            className="fixed inset-0 bg-slate-900 z-[200] flex flex-col p-8 overflow-y-auto"
          >
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto items-center">
              <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-red-600/30">
                <ShieldAlert size={48} className="text-white" />
              </div>
              <p className="text-red-500 font-mono text-[10px] font-black uppercase tracking-[0.4em] mb-4">PROTOCOL_ACK_REQUIRED</p>
              <h2 className="text-4xl font-black tracking-tighter text-white mb-6 text-center uppercase font-display leading-none">Safe Use Agreement</h2>
              
              <div className="space-y-6 text-white/50 font-medium leading-relaxed text-center mb-12">
                <p className="text-sm border-l-2 border-red-600 pl-6 text-left">
                   <strong className="text-white uppercase text-xs block mb-1">Clinical Disclaimer</strong>
                   This terminal provides guided triage via AI logic. It is NOT a substitute for formal clinical intervention or professional first response.
                </p>
                <p className="text-sm border-l-2 border-slate-700 pl-6 text-left">
                   <strong className="text-white uppercase text-xs block mb-1">Emergency Protocol</strong>
                   In life-critical scenarios, initialize official emergency channels (112, 911) concurrently with this application.
                </p>
              </div>

              <div className="w-full space-y-4">
                 <button
                   onClick={acceptDisclaimer}
                   className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all uppercase font-display tracking-tighter"
                 >
                   I_ACCEPT_PROTOCOL
                 </button>
                 <p className="text-white/20 font-mono text-[8px] uppercase tracking-[0.2em] text-center">SECURE_AUTH_REQUIRED_FOR_CLOUD_SYNC</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
