import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Mic, 
  Camera, 
  PhoneCall, 
  MapPin, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Globe,
  Send,
  MessageSquare,
  Activity,
  Heart,
  Shield,
  Thermometer,
  Droplets,
  AlertCircle,
  Info,
  Volume2,
  Pause,
  Users,
  X,
  Flame,
  ShieldAlert,
  Car,
  Wind
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useSpeech } from '../hooks/useSpeech';
import { EmergencyCategory, SeverityLevel, FirstAidStep, ChatMessage } from '../types';
import { analyzeEmergency, getAIChatResponse, generateVisual } from '../services/geminiService';

const LANGUAGES = [
  { code: 'en', name: 'English', label: 'English', bcp47: 'en-US' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'bn', name: 'Bengali', label: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'te', name: 'Telugu', label: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'mr', name: 'Marathi', label: 'मରାઠી', bcp47: 'mr-IN' },
  { code: 'ta', name: 'Tamil', label: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી', bcp47: 'gu-IN' },
  { code: 'kn', name: 'Kannada', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', label: 'മലയാളം', bcp47: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', label: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
  { code: 'or', name: 'Odia', label: 'ଓଡ଼ିଆ', bcp47: 'or-IN' },
  { code: 'as', name: 'Assamese', label: 'অসমীয়া', bcp47: 'as-IN' },
];

const ICON_MAP: Record<string, any> = {
  Activity, Heart, Shield, Thermometer, Droplets, AlertCircle, Info, CheckCircle2, Volume2, Pause
};

const SERVICE_NUMBERS: Record<string, { label: string; number: string; icon: any }> = {
  [EmergencyCategory.FIRE]: { label: 'FIRE_DEPARTMENT', number: '101', icon: Flame },
  [EmergencyCategory.MEDICAL]: { label: 'AMBULANCE_ER', number: '102', icon: Activity },
  [EmergencyCategory.ACCIDENT]: { label: 'POLICE_QUICK', number: '100', icon: Car },
  [EmergencyCategory.BREATHING]: { label: 'ER_AMBULANCE', number: '108', icon: Wind },
  [EmergencyCategory.BLEEDING]: { label: 'ER_AMBULANCE', number: '102', icon: Activity },
  [EmergencyCategory.OTHER]: { label: 'NATIONAL_SOS', number: '112', icon: ShieldAlert },
};

export default function Emergency() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { speak, startListening, clearTranscript, isListening, transcript } = useSpeech();
  
  const [flow, setFlow] = useState<'language' | 'input' | 'analyzing' | 'guidance'>('language');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel>(SeverityLevel.HIGH);
  const [aiAdvice, setAiAdvice] = useState<FirstAidStep[]>([]);
  const [visualsLoading, setVisualsLoading] = useState<Record<number, boolean>>({});
  const loadingIndices = useRef<Set<number>>(new Set());
  const [localizedSummary, setLocalizedSummary] = useState('');
  const [isAutoNarrating, setIsAutoNarrating] = useState(false);
  const [currentNarratingStep, setCurrentNarratingStep] = useState<number | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(type || EmergencyCategory.OTHER);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Location Capture & Contacts
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => console.error("Location error", err)
    );

    const fetchContacts = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.emergencyContacts) {
              setEmergencyContacts(data.emergencyContacts.filter((c: string) => c.trim() !== ''));
            }
          }
        } catch (err) {
          console.error("Error fetching contacts", err);
        }
      }
    };
    fetchContacts();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Auto-Narration Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAutoNarrating && aiAdvice.length > 0) {
      const narrateNext = (index: number) => {
        if (index < aiAdvice.length) {
          setCurrentNarratingStep(index);
          const step = aiAdvice[index];
          speak(step.narration || step.description, language.bcp47);
          
          const text = step.narration || step.description;
          const wordCount = text.split(' ').length;
          const duration = Math.max(4000, (wordCount / 2.5) * 1000 + 2000);
          
          timeout = setTimeout(() => {
            narrateNext(index + 1);
          }, duration);
        } else {
          setIsAutoNarrating(false);
          setCurrentNarratingStep(null);
          speak("All instructions completed. Please stay calm and wait for professional help.", language.bcp47);
        }
      };

      narrateNext(0);
    }
    return () => clearTimeout(timeout);
  }, [isAutoNarrating, aiAdvice]);

  // Fetch visuals for steps
  useEffect(() => {
    if (aiAdvice.length > 0) {
      aiAdvice.forEach((step, idx) => {
        if (!step.visualUrl && step.visualPrompt && !loadingIndices.current.has(idx)) {
          loadingIndices.current.add(idx);
          setVisualsLoading(prev => ({ ...prev, [idx]: true }));
          
          generateVisual(step.visualPrompt).then(url => {
            if (url) {
              setAiAdvice(prev => {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], visualUrl: url };
                return updated;
              });
            }
            setVisualsLoading(prev => ({ ...prev, [idx]: false }));
          });
        }
      });
    }
  }, [aiAdvice]);

  const handleLanguageSelect = (lang: typeof LANGUAGES[0]) => {
    setLanguage(lang);
    setFlow('input');
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!description && !image) return;
    setFlow('analyzing');
    
    try {
      const docRef = await addDoc(collection(db, 'emergencies'), {
        userId: auth.currentUser?.uid,
        type: type || EmergencyCategory.OTHER,
        severity: SeverityLevel.HIGH,
        location,
        timestamp: serverTimestamp(),
        status: 'active',
        language: language.name,
        description,
        imageUrl: image
      });
      setEmergencyId(docRef.id);

      const analysis = await analyzeEmergency(description, image || undefined, language.name);
      setSeverity(analysis.severity);
      setAiAdvice(analysis.firstAidAdvice);
      setLocalizedSummary(analysis.localizedSummary);
      setActiveCategory(analysis.category);
      
      await updateDoc(docRef, {
        severity: analysis.severity,
        firstAidAdvice: analysis.firstAidAdvice,
        type: analysis.category
      });

      setFlow('guidance');
      speak(analysis.localizedSummary, language.bcp47);
    } catch (err) {
      console.error("Analysis Error:", err);
      setFlow('guidance');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !emergencyId) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await getAIChatResponse(chatHistory, chatInput, language.name, description);
      const aiMsg: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMsg]);
      
      await updateDoc(doc(db, 'emergencies', emergencyId), {
        chatHistory: arrayUnion(userMsg, aiMsg)
      });
    } catch (err) {
      console.error("Chat error", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Sync voice transcript
  useEffect(() => {
    if (flow === 'input' && transcript && isListening) {
      setDescription(prev => prev + ' ' + transcript);
    }
  }, [transcript, flow]);

  if (flow === 'language') {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center mb-12"
        >
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/20">
            <Globe size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 font-display leading-tight">SELECT_PROTO_LANG</h1>
          <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.4em]">Identify secure communication channel</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
          {LANGUAGES.map((lang, i) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleLanguageSelect(lang)}
              className="bg-white/5 hover:bg-white text-white hover:text-slate-900 p-6 rounded-[2rem] border border-white/5 transition-all text-left group active:scale-95"
            >
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 group-hover:opacity-100 font-mono">{lang.name}</p>
              <p className="text-2xl font-black leading-none font-display">{lang.label}</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (flow === 'input') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-slate-900 p-6 text-white pt-16 pb-12 shrink-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">INPUT_PHASE_01</p>
             <h1 className="text-4xl font-black tracking-tighter uppercase font-display leading-none">Describe Situation</h1>
             <p className="text-white/40 text-[10px] font-medium mt-2 leading-relaxed max-w-xs uppercase tracking-widest">Multi-modal triage active: Text, Voice, or Vision</p>
          </motion.div>
        </header>

        <div className="flex-1 p-6 space-y-6 -mt-8">
          <div className="relative tech-card p-2 bg-white ring-8 ring-slate-900/5">
            <textarea
              className="w-full h-56 bg-slate-50 border-none rounded-[1.5rem] p-6 font-semibold text-lg focus:ring-0 outline-none resize-none placeholder:text-slate-300"
              placeholder="What happened? Where are you hurt?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button 
              onClick={() => startListening(language.bcp47)}
              className={`absolute bottom-6 right-6 p-5 rounded-2xl shadow-xl transition-all duration-300 ${isListening ? 'bg-red-600 text-white scale-110' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              <Mic size={24} />
            </button>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center gap-3 group active:scale-95 transition-all hover:bg-slate-100"
            >
              {image ? (
                <div className="relative w-full h-24 rounded-2xl overflow-hidden shadow-lg">
                   <img src={image} className="w-full h-full object-cover" alt="Emergency" />
                   <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <RotateCcw className="text-white" size={24} />
                   </div>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-red-600 transition-colors">
                    <Camera size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capture Scene</span>
                </>
              )}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageCapture} />
          </div>
        </div>

        <div className="p-6 pb-12 bg-white">
          <button
            onClick={startAnalysis}
            disabled={!description && !image}
            className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-xl tracking-[0.1em] shadow-2xl shadow-red-600/30 active:scale-95 transition-all disabled:opacity-20 uppercase font-display"
          >
            EXECUTE_ANALYSIS
          </button>
          <button 
            onClick={() => setFlow('language')}
            className="w-full mt-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors"
          >
            Reconfigure Language
          </button>
        </div>
      </div>
    );
  }

  if (flow === 'analyzing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="relative mb-12">
           <motion.div 
             animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="w-48 h-48 bg-red-600 rounded-full absolute -inset-8"
           />
           <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl relative">
              <Activity size={56} className="text-red-600" strokeWidth={2.5} />
           </div>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase font-display mb-3">Analyzing...</h2>
        <div className="flex flex-col items-center gap-4">
           <p className="text-white/40 font-mono text-[9px] font-black uppercase tracking-[0.4em] text-center max-w-xs leading-relaxed">
             Syncing incident data for clinical triage in {language.name}
           </p>
           <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-1/2 h-full bg-red-600 shadow-[0_0_15px_#dc2626]"
              />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-medical-bg)] flex flex-col h-screen overflow-hidden relative font-sans">
      {/* Global Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] overflow-hidden">
        <div className="absolute inset-x-0 h-4 bg-white/20 blur-xl animate-[scanline_4s_linear_infinite]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,128,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>

      <header className="bg-slate-900 px-6 pt-16 pb-8 text-white shrink-0 relative overflow-hidden z-30 shadow-2xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="space-y-1">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Live Active Incident</span>
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter uppercase font-display leading-none underline decoration-red-600/30 underline-offset-8 decoration-4">{type || 'Emergency'}</h1>
            <p className="text-white/50 font-mono text-[10px] tracking-tight">INCIDENT_ID_{emergencyId?.slice(-6).toUpperCase() || 'PND'}</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <motion.div 
               animate={{ backgroundColor: severity === SeverityLevel.CRITICAL ? '#dc2626' : 'rgba(255,255,255,0.1)' }}
               className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] border border-white/10 shadow-2xl`}
             >
                {severity} SEVERITY
             </motion.div>
             {aiAdvice.length > 0 && (
               <button 
                 onClick={() => setIsAutoNarrating(!isAutoNarrating)}
                 className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isAutoNarrating ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
               >
                 {isAutoNarrating ? <Pause size={14} className="fill-current" /> : <Volume2 size={14} />}
                 {isAutoNarrating ? 'Active Voice' : 'Start Voice Guide'}
               </button>
             )}
          </div>
        </div>
        
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium leading-relaxed text-white/80 max-w-xl border-l-2 border-red-600 pl-4 py-1 italic mb-8">
          {localizedSummary}
        </motion.p>

        {/* Vitals HUD Section */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 relative z-10">
            <div className="flex-none bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-w-[124px]">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Activity size={10} className="text-red-500" /> RES/RATE
               </p>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">112</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">BPM</span>
               </div>
               <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['40%', '85%', '40%'] }} 
                    transition={{ duration: 4, repeat: Infinity }} 
                    className="h-full bg-red-600 shadow-[0_0_10px_#dc2626]" 
                  />
               </div>
            </div>
            
            <div className="flex-none bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-w-[124px]">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Heart size={10} className="text-red-500" /> STRESS_LVL
               </p>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono font-display">HIGH</span>
               </div>
               <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['70%', '95%', '70%'] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                    className="h-full bg-orange-600 shadow-[0_0_10px_#ea580c]" 
                  />
               </div>
            </div>

            <div className="flex-none bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-w-[124px]">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Shield size={10} className="text-blue-400" /> GPS_LOCK
               </p>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono font-display text-[14px]">SATELLITE_4</span>
               </div>
               <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-blue-400' : 'bg-slate-700 shadow-inner'}`} />)}
               </div>
            </div>
        </div>
        
        <button onClick={() => navigate('/')} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
          <RotateCcw size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar z-10">
        <div className="p-6 pt-10 pb-40 space-y-10">
          <section>
          <div className="flex justify-between items-center mb-6 px-1">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-red-500" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Protocol</h2>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Guide Synchronized</span>
            </div>
          </div>

          {/* Smart Protocol Awareness Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 px-1"
          >
            {(() => {
              const themes: Record<string, any> = {
                [EmergencyCategory.FIRE]: { bg: 'bg-orange-950', accent: 'bg-orange-600', text: 'text-orange-500', ring: 'ring-orange-600/20' },
                [EmergencyCategory.MEDICAL]: { bg: 'bg-slate-900', accent: 'bg-red-600', text: 'text-red-500', ring: 'ring-red-600/20' },
                [EmergencyCategory.ACCIDENT]: { bg: 'bg-blue-950', accent: 'bg-blue-600', text: 'text-blue-500', ring: 'ring-blue-600/20' },
                [EmergencyCategory.OTHER]: { bg: 'bg-slate-900', accent: 'bg-slate-700', text: 'text-slate-400', ring: 'ring-white/10' },
              };
              const theme = themes[activeCategory] || themes[EmergencyCategory.OTHER];
              const Icon = SERVICE_NUMBERS[activeCategory]?.icon || ShieldAlert;

              return (
                <div className={`${theme.bg} rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group border border-white/5`}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Icon size={140} strokeWidth={1} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-3 py-1 ${theme.accent} rounded-full`}>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Smart_Protocol_Active</span>
                      </div>
                      <div className="h-px w-8 bg-white/20" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter font-display leading-tight mb-2">
                      {activeCategory.replace('_', ' ')}_IDENTIFIED
                    </h3>
                    <p className="text-sm text-white/50 font-medium mb-8 max-w-sm leading-relaxed">
                      System has autonomously branched to <span className="text-white font-bold">{activeCategory}</span> triage protocols. Dedicated official channel <span className={`${theme.text} font-bold`}>{SERVICE_NUMBERS[activeCategory]?.number}</span> is prepared and locked for deployment.
                    </p>
                    
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                      <div className={`w-12 h-12 ${theme.accent} rounded-xl flex items-center justify-center text-white shadow-xl ${theme.ring}`}>
                        <PhoneCall size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">OFFICIAL_SERVICE_READY</p>
                        <p className="text-xl font-black text-white tracking-widest font-mono">CHANNEL_{SERVICE_NUMBERS[activeCategory]?.number}</p>
                      </div>
                      <div className={`ml-auto w-2 h-2 ${theme.text.replace('text-', 'bg-')} rounded-full animate-ping`} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
          
          <div className="space-y-10">
             {aiAdvice.map((step, idx) => {
               const Icon = ICON_MAP[step.icon || 'AlertCircle'] || AlertCircle;
               const isNarrating = currentNarratingStep === idx;
               return (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-50px" }}
                   animate={{ scale: isNarrating ? 1.02 : 1, borderColor: isNarrating ? '#dc2626' : '#f1f5f9' }}
                   className={`tech-card overflow-hidden transition-all duration-500 bg-white border-2 border-slate-100 relative ${isNarrating ? 'ring-8 ring-red-600/5 border-red-600' : 'shadow-lg shadow-slate-200/50'}`}
                 >
                    {/* Technical HUD Borders */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-600/20 z-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-600/20 z-20 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-600/20 z-20 pointer-events-none" />
                    
                    {/* Visual Section */}
                    <div className="relative aspect-video max-h-[400px] w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                       {step.visualUrl ? (
                         <motion.img 
                           initial={{ opacity: 0 }} 
                           animate={{ opacity: 1 }} 
                           src={step.visualUrl} 
                           className="w-full h-full object-cover" 
                           alt={step.title} 
                           referrerPolicy="no-referrer" 
                         />
                       ) : (
                         <div className="relative w-full h-full flex items-center justify-center">
                           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                           <motion.div animate={{ top: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[1x] bg-red-600/30 z-10" />
                           <div className="relative z-20 flex flex-col items-center gap-6">
                             <div className="relative">
                               <motion.div animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                                 <Icon className="text-slate-900" size={120} strokeWidth={0.5} />
                               </motion.div>
                               <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                               </div>
                             </div>
                             <div className="text-center">
                               <p className="font-mono text-[8px] font-black uppercase tracking-[0.6em] text-red-600 opacity-40">GENERATING_VISUAL_PROTOCOL</p>
                             </div>
                           </div>
                         </div>
                       )}
                       
                       {/* Floating Step Badge */}
                       <div className="absolute top-6 left-6 flex items-center gap-2">
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border backdrop-blur-xl ${isNarrating ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900/90 text-white border-white/10'}`}>
                             Step {idx + 1}
                          </div>
                          {isNarrating && (
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }} 
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" 
                            />
                          )}
                       </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-10 space-y-5">
                       <div className="flex items-start gap-5">
                          <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center border-2 transition-all ${isNarrating ? 'bg-red-50 border-red-200 text-red-600 shadow-lg shadow-red-600/10' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <Icon size={28} />
                          </div>
                          <div className="flex-1">
                             <h3 className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter font-display mb-3">{step.title}</h3>
                             <div className="h-1.5 w-16 bg-red-600 rounded-full mb-6" />
                             <p className="text-lg text-slate-800 font-bold leading-[1.6]">{step.description}</p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               );
             })}
          </div>
        </section>

        {aiAdvice.length > 0 && emergencyContacts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-1"
          >
            <div className="bg-red-600 rounded-[2.5rem] p-8 shadow-2xl shadow-red-600/30 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Users size={120} strokeWidth={1} />
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">Personal_Safety_Network</p>
                  <h3 className="text-3xl font-black uppercase tracking-tighter font-display leading-tight mb-6">Reach Your Registered Emergency Contacts</h3>
                  <p className="text-sm font-medium opacity-80 mb-8 max-w-sm leading-relaxed italic">Guidance protocol is steady. You may now establish direct audio links with your priority fallback network.</p>
                  
                  <button 
                    onClick={() => setShowContactsModal(true)}
                    className="w-full h-18 bg-white text-red-600 rounded-3xl font-black text-lg shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 group-hover:bg-red-50"
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    CALL_EMERGENCY_CONTACTS
                  </button>
               </div>
            </div>
          </motion.section>
        )}

        <section className="flex-1 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <MessageSquare size={14} />
              Support Terminal
            </h2>
            <span className="font-mono text-[9px] text-slate-300">SECURE_CHANNEL_ACTIVE</span>
          </div>
          
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl">
             <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col" ref={scrollRef}>
                <div className="bg-slate-50 text-slate-500 p-6 rounded-3xl text-sm font-medium leading-relaxed flex gap-4 items-start border border-slate-100 italic">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <Info size={18} className="text-slate-400" />
                  </div>
                  "Ask regarding procedure clarifications, clinical symptoms, or post-incident care. Our AI is monitoring this channel 24/7."
                </div>
                
                <AnimatePresence mode="popLayout">
                  {chatHistory.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-medium shadow-sm transition-all ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 p-6 rounded-3xl rounded-tl-none flex gap-2">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-2 bg-slate-300 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 bg-slate-300 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 bg-slate-300 rounded-full" />
                    </div>
                  </div>
                )}
             </div>

             <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
               <input className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 font-medium text-sm outline-none focus:ring-4 focus:ring-slate-900/5 transition-all" placeholder="Type analytical query..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
               <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatLoading} className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all">
                 <Send size={22} />
               </button>
             </div>
          </div>
        </section>
      </div>

      <footer className="p-6 bg-white border-t border-slate-100 grid grid-cols-[1fr,64px] gap-4 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-30">
          <div className="relative group/sos">
            <motion.div 
               animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
               className={`absolute inset-x-0 inset-y-0 rounded-3xl pointer-events-none ${activeCategory === EmergencyCategory.FIRE ? 'bg-orange-600' : 'bg-red-600'}`}
            />
            <a 
              href={`tel:${SERVICE_NUMBERS[activeCategory]?.number || '112'}`} 
              className={`btn-emergency h-16 w-full relative z-10 transition-all duration-500 scale-100 ${activeCategory === EmergencyCategory.FIRE ? 'bg-orange-600' : ''}`}
            >
              <PhoneCall size={20} strokeWidth={2.5} />
              DIAL_{SERVICE_NUMBERS[activeCategory]?.label || 'EMERGENCY_LINK'}
            </a>
          </div>
          <button onClick={() => navigate('/hospitals')} className="w-full h-16 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center text-slate-900 transition-all active:scale-95 border border-slate-200">
            <MapPin size={24} strokeWidth={2.5} />
          </button>
      </footer>
    </div>

      {/* Emergency Contacts Modal */}
      <AnimatePresence>
        {showContactsModal && (
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
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">NETWORK_HANDSHAKE_READY</p>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-display leading-tight">SELECT_CHANNEL</h2>
                  </div>
                  <button 
                    onClick={() => setShowContactsModal(false)}
                    className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={24} />
                  </button>
               </div>
               
               <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                 {/* Official Services Section */}
                 <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Official_Service_Channels</p>
                   {Object.entries(SERVICE_NUMBERS).map(([cat, info]) => {
                     const isMatch = cat === activeCategory;
                     const Icon = info.icon;
                     return (
                       <a
                         key={cat}
                         href={`tel:${info.number}`}
                         className={`flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all group active:scale-[0.98] ${isMatch ? 'bg-red-600 border-red-500 text-white shadow-2xl shadow-red-600/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-950 hover:text-white'}`}
                       >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${isMatch ? 'bg-white text-red-600' : 'bg-white text-slate-400 group-hover:bg-red-600 group-hover:text-white'}`}>
                           <Icon size={24} strokeWidth={2.5} />
                         </div>
                         <div className="flex flex-col">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isMatch ? 'text-white/60' : 'text-slate-400 group-hover:text-white/40'}`}>{info.label}</p>
                            <span className="font-black text-2xl tracking-tighter font-display uppercase leading-none">{info.number}</span>
                         </div>
                         {isMatch && (
                           <div className="ml-auto bg-white/20 px-3 py-1.5 rounded-xl">
                              <span className="text-[8px] font-black uppercase tracking-widest leading-none">Detected</span>
                           </div>
                         )}
                       </a>
                     );
                   })}
                 </div>

                 <div className="h-px bg-slate-100 mx-4 my-2" />

                 {/* Personal Contacts Section */}
                 <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Personal_Fallback_Network</p>
                   {emergencyContacts.map((contact, i) => (
                   <a
                     key={i}
                     href={`tel:${contact}`}
                     className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-slate-950 hover:text-white transition-all group active:scale-[0.98]"
                   >
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                       <PhoneCall size={24} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 group-hover:text-white/40">Priority_Link_{i + 1}</p>
                        <span className="font-black text-2xl tracking-tighter font-display uppercase leading-none">{contact}</span>
                     </div>
                     <div className="ml-auto w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-white/20 transition-colors">
                        <ChevronRight className="opacity-40" size={18} />
                     </div>
                   </a>
                 ))}
               </div>
             </div>

             <button 
                 onClick={() => setShowContactsModal(false)}
                 className="w-full mt-8 py-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-slate-900 transition-colors"
               >
                 ABORT_SATELLITE_LINK
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
