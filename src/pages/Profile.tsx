import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Users, Shield, Heart, Plus, Trash2, LogOut, Globe, Activity, Stethoscope, ChevronRight, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    phoneNumber: auth.currentUser?.phoneNumber || '',
    emergencyContacts: [''],
    bloodGroup: '',
    medicalConditions: '',
    language: 'English',
    gender: 'Male',
    age: undefined,
    height: '',
    onMedication: false,
    medicationDetails: '',
    underDiagnosis: false,
    diagnosisDetails: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const LANGUAGES = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Assamese'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', auth.currentUser?.uid || '');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser?.uid || ''), {
        ...profile,
        lastUpdated: new Date().toISOString(),
      });
      // Better feedback could be added here
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    setProfile(p => ({ ...p, emergencyContacts: [...p.emergencyContacts, ''] }));
  };

  const updateContact = (idx: number, val: string) => {
    const newContacts = [...profile.emergencyContacts];
    newContacts[idx] = val;
    setProfile(p => ({ ...p, emergencyContacts: newContacts }));
  };

  const removeContact = (idx: number) => {
    setProfile(p => ({
      ...p,
      emergencyContacts: p.emergencyContacts.filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-medical-bg)] min-h-screen">
         <div className="w-16 h-16 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4" />
         <p className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing_Profile_Data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-medical-bg)] flex flex-col pb-32">
      <header className="bg-slate-900 px-6 pt-16 pb-12 text-white shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">IDENTITY_MODULE_07</p>
            <h1 className="text-4xl font-black tracking-tighter uppercase font-display leading-none">Clinical Profile</h1>
            <p className="text-white/40 text-[10px] font-medium mt-2 leading-relaxed max-w-xs uppercase tracking-widest">Vital telemetry for emergency responders</p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-4 bg-white/5 text-white/50 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-white/5"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-10 max-w-lg mx-auto w-full -mt-8 relative z-20">
        {/* Personal Details Card */}
        <section className="tech-card bg-white p-8 space-y-6">
           <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-red-600" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personal Attributes</h2>
           </div>
           
           <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono tracking-widest">Full_Legal_Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono tracking-widest">Verified_Phone</label>
                <div className="relative">
                   <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input
                    type="tel"
                    disabled
                    value={profile.phoneNumber}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 pl-12 font-bold text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
           </div>
        </section>

        {/* Biometrics Card */}
        <section className="tech-card bg-white p-8">
           <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-red-600" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Clinical Biometrics</h2>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="Male">MALE</option>
                  <option value="Female">FEMALE</option>
                  <option value="Other">OTHER</option>
                  <option value="Prefer not to say">PNT_SAY</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono">Age_Yrs</label>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                  placeholder="00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono">Height_Metric</label>
                <input
                  type="text"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                  placeholder="175cm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono">Blood_Group</label>
                <select
                  value={profile.bloodGroup}
                  onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-slate-100"
                >
                  <option value="">SELECT</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
           </div>
        </section>

        {/* Medical Status Card */}
        <section className="tech-card bg-white p-8 space-y-8">
           <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-red-600" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Critical Medical Status</h2>
           </div>

           <div className="space-y-6">
              <div className={`p-6 rounded-[2rem] border transition-all ${profile.onMedication ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 font-mono">Active_Medication</span>
                  <button 
                    onClick={() => setProfile({ ...profile, onMedication: !profile.onMedication })}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${profile.onMedication ? 'bg-red-600' : 'bg-slate-200'}`}
                  >
                    <motion.div 
                      animate={{ x: profile.onMedication ? 26 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                    />
                  </button>
                </div>
                <AnimatePresence>
                  {profile.onMedication && (
                    <motion.textarea
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      placeholder="List chemical compounds and dosages..."
                      value={profile.medicationDetails}
                      onChange={(e) => setProfile({ ...profile, medicationDetails: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-xs font-bold font-mono outline-none focus:ring-4 focus:ring-red-600/5 resize-none"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className={`p-6 rounded-[2rem] border transition-all ${profile.underDiagnosis ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 font-mono">Ongoing_Diagnosis</span>
                  <button 
                    onClick={() => setProfile({ ...profile, underDiagnosis: !profile.underDiagnosis })}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${profile.underDiagnosis ? 'bg-amber-600' : 'bg-slate-200'}`}
                  >
                    <motion.div 
                      animate={{ x: profile.underDiagnosis ? 26 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                    />
                  </button>
                </div>
                <AnimatePresence>
                  {profile.underDiagnosis && (
                    <motion.textarea
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      placeholder="Describe current diagnostic paths..."
                      value={profile.diagnosisDetails}
                      onChange={(e) => setProfile({ ...profile, diagnosisDetails: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-xs font-bold font-mono outline-none focus:ring-4 focus:ring-amber-600/5 resize-none"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Heart size={14} className="text-red-600" />
                    <label className="text-[9px] font-black uppercase text-slate-400 font-mono">Known_Allergies_Chronic_Paths</label>
                 </div>
                 <textarea
                  placeholder="Insert critical health history..."
                  rows={4}
                  value={profile.medicalConditions}
                  onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 font-bold text-xs outline-none focus:ring-4 focus:ring-slate-900/5 transition-all resize-none italic"
                />
              </div>
           </div>
        </section>

        {/* Contacts Card */}
        <section className="tech-card bg-white p-8">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-red-600" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Protocols</h2>
              </div>
              <button 
                onClick={addContact}
                className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
              >
                <Plus size={18} />
              </button>
           </div>
           
           <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {profile.emergencyContacts.map((contact, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-3"
                  >
                    <div className="relative flex-1">
                       <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input
                        type="tel"
                        placeholder="+91_NODE_ENDPOINT"
                        value={contact}
                        onChange={(e) => updateContact(idx, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 font-bold text-sm outline-none focus:ring-4 focus:ring-slate-900/5"
                      />
                    </div>
                    <button 
                      onClick={() => removeContact(idx)}
                      className="p-4 text-slate-300 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </section>

        {/* Localization */}
        <section className="tech-card bg-white p-8">
           <div className="flex items-center gap-2 mb-6">
              <Globe size={16} className="text-red-600" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Localization Terminal</h2>
           </div>
           <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 px-1 font-mono">Preferred_Relay_Lang</label>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none appearance-none cursor-pointer hover:bg-slate-100 font-display tracking-tight text-lg"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
           </div>
        </section>

        {/* Action Button */}
        <div className="fixed bottom-10 left-6 right-6">
           <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-18 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(15,23,42,0.4)] flex items-center justify-center gap-4 disabled:opacity-50 transition-all font-display tracking-tight border border-white/10"
          >
            {saving ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={24} />}
            {saving ? 'UPDATING_RECORD' : 'SECURE_SAVE_PROTOCOL'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
