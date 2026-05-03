import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Droplets,
  Search,
  ArrowLeft,
  Filter,
  MessageSquare,
  AlertCircle,
  Heart,
  Calendar,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Donor {
  id: string;
  name: string;
  bloodGroup: string;
  lat: number;
  lng: number;
  distance: string;
  phone: string;
  lastDonated: string;
  isVerified: boolean;
  status: 'available' | 'donated_recently' | 'unavailable';
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function BloodDonors() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        generateMockDonors(loc);
      },
      (err) => {
        console.error("Location access denied", err);
        setLoading(false);
      }
    );
  }, []);

  const generateMockDonors = (loc: [number, number]) => {
    const names = ['Rahul S.', 'Priya M.', 'Amit K.', 'Sneha P.', 'Vikram R.', 'Anjali D.'];
    const mockDonors: Donor[] = names.map((name, i) => {
      const group = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
      return {
        id: `donor-${i}`,
        name,
        bloodGroup: group,
        lat: loc[0] + (Math.random() - 0.5) * 0.03,
        lng: loc[1] + (Math.random() - 0.5) * 0.03,
        distance: `${(Math.random() * 4 + 0.2).toFixed(1)} km`,
        phone: `+91 ${Math.floor(9000000000 + Math.random() * 1000000000)}`,
        lastDonated: i % 3 === 0 ? '6 months ago' : '1 year ago',
        isVerified: i % 2 === 0,
        status: Math.random() > 0.2 ? 'available' : 'donated_recently'
      };
    });
    
    setDonors(mockDonors);
    setLoading(false);
  };

  const filteredDonors = donors.filter(d => 
    (selectedGroup === 'all' || d.bloodGroup === selectedGroup) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 pt-10 sticky top-0 z-50">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">Blood Radar</h1>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
              <Droplets size={12} fill="currentColor" />
              Potential Life Savers
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search donor or group..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-4 font-semibold text-sm focus:ring-2 focus:ring-red-600 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                selectedGroup === 'all' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              All Groups
            </button>
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  selectedGroup === bg 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-32">
        {/* Map View */}
        <div className="h-[250px] w-full relative z-0 border-b border-gray-200">
          {userLocation ? (
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
              <ChangeView center={userLocation} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredDonors.map((d) => (
                <Marker key={d.id} position={[d.lat, d.lng]}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold">{d.name} ({d.bloodGroup})</p>
                      <p className="text-xs text-gray-500">{d.distance} away</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Locating Donors...</p>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-[1000] text-[10px] font-black uppercase tracking-widest">
             <Heart size={12} fill="white" />
             Emergency Requests Open
          </div>
        </div>

        {/* List View */}
        <div className="p-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-4 px-2 flex justify-between items-center">
            <span>Nearby Donors</span>
            <Filter size={14} />
          </h2>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredDonors.map((d) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={d.id}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-red-50 text-red-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border border-red-100 shadow-inner">
                      {d.bloodGroup}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 relative">
                      <div className="absolute -top-1 -right-1">
                        {d.isVerified && <div className="bg-blue-500 rounded-full p-0.5 border-2 border-white"><Shield size={10} className="text-white" fill="white" /></div>}
                      </div>
                      <span className="text-xl font-bold text-gray-400">{d.name.charAt(0)}</span>
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{d.name}</h3>
                        <span className={`w-2 h-2 rounded-full ${d.status === 'available' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      
                      <div className="flex flex-wrap gap-y-1 gap-x-3 mb-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                          <MapPin size={10} />
                          {d.distance}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                          <Calendar size={10} />
                          {d.lastDonated}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a 
                          href={`tel:${d.phone}`}
                          className="flex-1 bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          <Phone size={12} />
                          Call Now
                        </a>
                        <button className="flex-1 bg-gray-50 text-gray-900 rounded-xl py-3 border border-gray-100 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform">
                          <MessageSquare size={12} />
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredDonors.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No donors found in this area.</p>
                <button 
                  onClick={() => setSelectedGroup('all')}
                  className="mt-4 text-red-600 font-black text-[10px] uppercase tracking-widest"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register as Donor CTA */}
      <div className="fixed bottom-2 left-6 right-6 z-[1001]">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-red-600 text-white p-5 rounded-3xl shadow-2xl shadow-red-200 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart size={20} fill="white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Volunteer Today</p>
              <p className="font-bold">Register as a Donor</p>
            </div>
          </div>
          <ArrowLeft className="rotate-180 opacity-40 group-hover:opacity-100 transition-opacity" size={20} />
        </motion.button>
      </div>
    </div>
  );
}
