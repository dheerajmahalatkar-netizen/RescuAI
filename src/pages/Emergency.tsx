import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Mic, 
  Camera, 
  PhoneCall, 
  MapPin, 
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useSpeech } from '../hooks/useSpeech';
import { FIRST_AID_STEPS } from '../lib/firstAidData';
import { EmergencyCategory, SeverityLevel } from '../types';
import { classifyEmergency } from '../services/geminiService';

export default function Emergency() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { speak, startListening, isListening, transcript } = useSpeech();
  
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<SeverityLevel>(SeverityLevel.HIGH);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const steps = FIRST_AID_STEPS[type || 'other'] || FIRST_AID_STEPS.other;

  // 1. Capture Location and Create Record
  useEffect(() => {
    const initEmergency = async () => {
      try {
        // Try to get location
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(loc);
            
            // Create initial record
            const docRef = await addDoc(collection(db, 'emergencies'), {
              userId: auth.currentUser?.uid,
              type: type || EmergencyCategory.OTHER,
              severity: SeverityLevel.HIGH, // Default
              location: loc,
              timestamp: serverTimestamp(),
              status: 'active',
              assistanceSteps: [0]
            });
            setEmergencyId(docRef.id);
            setLoading(false);

            // Send SMS alerts to emergency contacts (Mocking backend call)
            sendAlerts(loc, type || 'Emergency');
          },
          (err) => {
            console.error("Location error", err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Init error", err);
        setLoading(false);
      }
    };

    initEmergency();
  }, [type]);

  // 2. Narration for each step
  useEffect(() => {
    if (!loading && steps[step]) {
      speak(steps[step].narration);
    }
  }, [step, loading]);

  const sendAlerts = async (loc: any, emType: string) => {
    // In a real app, we'd fetch contacts from the user profile and call our /api/alert
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
      const contacts = userDoc.data()?.emergencyContacts || [];
      
      const message = `RESCUAI SOS: ${emType} reported at https://www.google.com/maps?q=${loc.lat},${loc.lng}. Timestamp: ${new Date().toLocaleString()}`;
      
      for (const phone of contacts) {
        await fetch('/api/alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phone, message })
        });
      }
    } catch (err) {
      console.warn("Could not send automated alerts", err);
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/');
    }
  };

  const handleRepeat = () => {
    speak(steps[step].narration);
  };

  const handleVoiceInput = () => {
    startListening();
    setIsCapturing(true);
  };

  useEffect(() => {
    if (transcript && isCapturing) {
      setNotes(prev => prev + ' ' + transcript);
      setIsCapturing(false);
      // AI Triage
      classifyEmergency(transcript).then(res => {
        setSeverity(res.severity);
      });
    }
  }, [transcript]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-red-200 rounded-full animate-ping absolute"></div>
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center relative shadow-xl">
            <AlertTriangle className="text-white" size={40} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-red-900 tracking-tighter uppercase mb-2">Activating SOS</h2>
        <p className="text-red-700 font-medium text-center">Capturing location and notifying emergency contacts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Emergency Header */}
      <div className="bg-red-600 p-6 text-white pt-10 pb-8 flex justify-between items-start shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1 block">Active Emergency</span>
          <h1 className="text-3xl font-black tracking-tight capitalize">{type}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${
              severity === SeverityLevel.CRITICAL ? 'bg-black text-white' : 'bg-white/20'
            }`}>
              {severity} SEVERITY
            </span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <XCircle size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 flex">
        {steps.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 transition-all duration-500 ${idx <= step ? 'bg-red-600' : 'bg-transparent'}`}
          />
        ))}
      </div>

      {/* Guidance Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            {/* Action Icon/Visual */}
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 mx-auto border-4 border-gray-100">
               <motion.div
                 animate={{ scale: [1, 1.05, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
               >
                 <Play className="text-red-600 fill-red-600" size={48} />
               </motion.div>
            </div>
            
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4">Step {step + 1} of {steps.length}</h3>
            <p className="text-2xl font-semibold text-gray-900 leading-tight">
              {steps[step].text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Auxiliary Inputs */}
      <div className="px-6 mb-8 flex gap-4">
        <button 
          onClick={handleVoiceInput}
          className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border ${
            isListening ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-600'
          }`}
        >
          <Mic size={24} className={isListening ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isListening ? 'Listening...' : 'Voice Note'}
          </span>
        </button>
        <button 
          onClick={() => alert("Image upload triggered")}
          className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600"
        >
          <Camera size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Photo</span>
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={handleRepeat}
            className="w-20 h-20 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 shadow-sm active:scale-95 transition-transform"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={handleNext}
            className="flex-1 h-20 bg-black text-white rounded-full flex items-center justify-between px-8 font-black text-xl tracking-tighter shadow-xl active:scale-95 transition-transform"
          >
            <span>{step === steps.length - 1 ? 'FINISH' : 'NEXT STEP'}</span>
            <ChevronRight size={32} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
           <a href="tel:112" className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-xs">
             <PhoneCall size={16} />
             Call Emergency (112)
           </a>
           <div className="h-4 w-px bg-gray-200"></div>
           <button 
             onClick={() => navigate('/hospitals')}
             className="flex items-center gap-2 text-gray-600 font-bold uppercase tracking-widest text-xs"
           >
             <MapPin size={16} />
             Hospitals
           </button>
        </div>
      </div>
    </div>
  );
}
