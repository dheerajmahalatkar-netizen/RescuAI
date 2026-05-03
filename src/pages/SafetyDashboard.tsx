import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Shield, 
  Truck, 
  Flame, 
  Navigation, 
  Search,
  ArrowLeft,
  Activity,
  AlertCircle
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

interface SafetyService {
  id: string;
  name: string;
  type: 'ambulance' | 'police' | 'fire' | 'hospital';
  lat: number;
  lng: number;
  distance: string;
  phone: string;
  address: string;
  status: 'available' | 'busy' | 'closed';
}

const EMERGENCY_NUMBERS = [
  { label: 'General Emergency', number: '112', color: 'bg-red-600' },
  { label: 'Police', number: '100', color: 'bg-blue-600' },
  { label: 'Fire Brigade', number: '101', color: 'bg-orange-600' },
  { label: 'Ambulance', number: '102', color: 'bg-emerald-600' },
  { label: 'Women Helpline', number: '1091', color: 'bg-purple-600' },
  { label: 'Disaster Management', number: '108', color: 'bg-amber-600' },
];

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function SafetyDashboard() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<'all' | 'ambulance' | 'police' | 'fire'>('all');
  const [services, setServices] = useState<SafetyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        fetchNearbyServices(loc);
      },
      (err) => {
        console.error("Location access denied", err);
        setLoading(false);
      }
    );
  }, []);

  const fetchNearbyServices = (loc: [number, number]) => {
    // In a production app, we would call a Places API (Google Maps, Foursquare, or OpenStreetMap)
    // For this demo, we'll simulate realistic nearby services based on user location
    const types: SafetyService['type'][] = ['ambulance', 'police', 'fire', 'ambulance', 'police'];
    const mockServices: SafetyService[] = types.map((type, i) => ({
      id: `${type}-${i}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Unit #${100 + i}`,
      type,
      lat: loc[0] + (Math.random() - 0.5) * 0.02,
      lng: loc[1] + (Math.random() - 0.5) * 0.02,
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
      phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      address: `Street ${i + 1}, Metro Area`,
      status: Math.random() > 0.3 ? 'available' : 'busy'
    }));
    
    setServices(mockServices);
    setLoading(false);
  };

  const filteredServices = services.filter(s => 
    (filter === 'all' || s.type === filter) &&
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">Safety Radar</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Services Nearby</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search specific units..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-4 font-semibold text-sm focus:ring-2 focus:ring-red-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'ambulance', 'police', 'fire'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  filter === t 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {t}
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
              {filteredServices.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng]}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.distance} away</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <p className="text-sm font-bold text-gray-400 animate-pulse">Detecting Location...</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 z-[1000]">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Live Services</span>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <div className="p-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-4 px-2">Global Hotlines</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {EMERGENCY_NUMBERS.map((n) => (
              <a
                key={n.number}
                href={`tel:${n.number}`}
                className={`${n.color} p-4 rounded-2xl text-white shadow-lg shadow-black/5 active:scale-95 transition-transform`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Phone size={18} className="opacity-60" />
                  <span className="text-lg font-black">{n.number}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{n.label}</p>
              </a>
            ))}
          </div>

          {/* List View */}
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-4 px-2">Detailed Directory</h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((s) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={s.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      s.type === 'police' ? 'bg-blue-50 text-blue-600' :
                      s.type === 'ambulance' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {s.type === 'police' && <Shield size={24} />}
                      {s.type === 'ambulance' && <Truck size={24} />}
                      {s.type === 'fire' && <Flame size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{s.name}</h3>
                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {s.distance}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <MapPin size={12} />
                        <span className="truncate">{s.address}</span>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={`tel:${s.phone}`}
                          className="flex-1 bg-black text-white rounded-xl py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform"
                        >
                          <Phone size={12} />
                          Call
                        </a>
                        <button className="flex-1 bg-gray-100 text-gray-900 rounded-xl py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <Navigation size={12} />
                          Route
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-bold text-sm">No services found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 z-50 flex justify-between items-center bg-opacity-95 backdrop-blur">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">All Systems Operational</span>
          </div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
            {services.length} Units Active
          </div>
      </div>
    </div>
  );
}
