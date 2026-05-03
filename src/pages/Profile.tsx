import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Phone, Users, Shield, Heart, Plus, Trash2, LogOut } from 'lucide-react';
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
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

  if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

  return (
    <div className="p-6 max-w-md mx-auto pb-32">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Profile</h1>
          <p className="text-gray-500 font-medium text-sm">Vital info for emergencies</p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="space-y-8">
        {/* Basic Info */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-red-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Basic Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 font-semibold outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
            <div className="relative opacity-50">
               <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                type="tel"
                disabled
                value={profile.phoneNumber}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pl-12 font-semibold"
              />
            </div>
          </div>
        </section>

        {/* Emergency Contacts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-red-600" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Emergency Contacts</h2>
            </div>
            <button 
              onClick={addContact}
              className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {profile.emergencyContacts.map((contact, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+91..."
                  value={contact}
                  onChange={(e) => updateContact(idx, e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 font-semibold outline-none focus:ring-2 focus:ring-red-600/20"
                />
                <button 
                  onClick={() => removeContact(idx)}
                  className="p-4 text-gray-400 bg-gray-50 rounded-2xl hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Medical Info */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} className="text-red-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Medical Records</h2>
          </div>
          <div className="space-y-4">
            <div>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 font-semibold outline-none appearance-none"
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <textarea
                placeholder="Medical conditions, allergies, medications..."
                rows={4}
                value={profile.medicalConditions}
                onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 font-semibold outline-none focus:ring-2 focus:ring-red-600/20 resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-black text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Shield size={20} />
          {saving ? 'Saving...' : 'Secure & Save Profile'}
        </motion.button>
      </div>
    </div>
  );
}
