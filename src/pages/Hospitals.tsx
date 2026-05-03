import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Phone, Star, Building2, Clock, ShieldCheck, Activity, ChevronRight, Stethoscope, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getNearbyHospitals } from '../services/geminiService';

// Fix Leaflet marker icons in React
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

interface Hospital {
  id: string;
  name: string;
  distance: string;
  rating: number;
  address: string;
  phone: string;
  emergency: boolean;
  position: [number, number];
  rankingReason?: string;
}

export default function Hospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(userLoc);
        
        try {
          const results = await getNearbyHospitals(userLoc[0], userLoc[1]);
          const mapped: Hospital[] = results.map((h, idx) => ({
            id: String(idx),
            name: h.name,
            distance: h.distance,
            rating: h.rating || 0,
            address: h.address,
            phone: h.phone || '112',
            emergency: h.emergency,
            position: [h.lat, h.lng],
            rankingReason: h.rankingReason
          }));
          setHospitals(mapped);
        } catch (err) {
          console.error("Failed to fetch real hospitals", err);
        } finally {
          setLoading(false);
        }
      },
      () => {
        const fallback: [number, number] = [12.9716, 77.5946];
        setUserLocation(fallback);
        setLoading(false);
      }
    );
  }, []);

  const handleNavigate = (hosp: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hosp.position[0]},${hosp.position[1]}`;
    window.open(url, '_blank');
  };

  if (loading || !userLocation) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 gap-6">
        <div className="relative">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="w-32 h-32 bg-red-600 rounded-full absolute -inset-4"
           />
           <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl relative">
              <Activity size={40} className="text-red-600 animate-pulse" />
           </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black tracking-tighter text-white uppercase font-display mb-1">SCANNING_SURROUNDINGS</p>
          <p className="text-white/40 font-mono text-[9px] font-black uppercase tracking-[0.4em]">Dispatching Hospital AI Triage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-medical-bg)] flex flex-col pb-32">
      <header className="bg-slate-900 px-6 pt-16 pb-12 text-white shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-red-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">NETWORK_RADAR_ACTIVE</p>
            <h1 className="text-4xl font-black tracking-tighter uppercase font-display leading-none">Nearby Units</h1>
            <p className="text-white/40 text-[10px] font-medium mt-2 leading-relaxed max-w-xs uppercase tracking-widest">Real-time clinical facility ranking</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <Compass size={24} className="text-red-500 animate-[spin_4s_linear_infinite]" />
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8 max-w-lg mx-auto w-full -mt-8 relative z-20">
        {/* Live Map Terminal */}
        <section className="tech-card overflow-hidden bg-white ring-8 ring-slate-900/5">
           <div className="h-4 w-full bg-slate-900 flex items-center px-4 justify-between">
              <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                 <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              </div>
              <span className="text-[8px] font-mono text-white/40 font-black">GPS_SIGNAL: ACQUIRED</span>
           </div>
           <div className="w-full h-80 relative z-0">
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {hospitals.map(hosp => (
                <Marker key={hosp.id} position={hosp.position}>
                  <Popup>
                    <div className="p-2 font-sans">
                      <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{hosp.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-snug">{hosp.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <Marker position={userLocation}>
                 <Popup><p className="font-black text-red-600 text-[10px]">INCIDENT_LOCATION</p></Popup>
              </Marker>
            </MapContainer>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Facility Inventory</h2>
             <span className="font-mono text-[9px] text-slate-300">N_{hospitals.length}_NODES_DETECTED</span>
          </div>

          <div className="space-y-4">
            {hospitals.map((hosp, idx) => (
              <motion.div
                key={hosp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="tech-card bg-white p-6 group hover:shadow-2xl transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[11px] font-black font-mono">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <h3 className="font-black text-slate-900 text-xl leading-none tracking-tighter uppercase font-display">{hosp.name}</h3>
                    </div>
                    
                    {hosp.rankingReason && (
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 mb-4">
                         <ShieldCheck size={12} className="text-emerald-600" />
                         <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{hosp.rankingReason}</span>
                       </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                       <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                          <MapPin size={12} className="text-red-500" />
                          {hosp.distance}
                       </div>
                       <div className="flex items-center gap-1.5 text-[9px] text-yellow-600 font-black uppercase tracking-widest">
                          <Star size={12} fill="currentColor" />
                          {hosp.rating}
                       </div>
                       {hosp.emergency && (
                        <div className="flex items-center gap-1.5 text-[9px] text-red-600 font-black uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          <Clock size={12} />
                          ER_ACTIVE_24/7
                        </div>
                       )}
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <Building2 size={28} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <a 
                     href={`tel:${hosp.phone}`}
                     className="bg-slate-50 hover:bg-slate-100 text-slate-900 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-100"
                   >
                     <Phone size={14} className="text-red-600" /> ESTABLISH_CALL
                   </a>
                   <button 
                     onClick={() => handleNavigate(hosp)}
                     className="bg-slate-900 hover:bg-red-600 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                   >
                     <Navigation size={14} /> LIVE_NAV_LINK
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {hospitals.length > 0 && (
          <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -translate-y-16 translate-x-16 group-hover:bg-red-600/20 transition-all" />
             <div className="relative z-10">
                <p className="text-[10px] font-black text-red-500 font-mono uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                   <Activity size={12} />
                   Ranking_Algo_Note
                </p>
                <div className="space-y-4">
                   <p className="text-sm text-white/70 font-medium leading-relaxed italic border-l-2 border-red-600 pl-6">
                     "Spatial entities are prioritized using a weighted matrix of real-time transit distance, trauma specialization level, and peer-verified clinical ratings."
                   </p>
                   <div className="flex justify-between items-center text-[8px] font-mono text-white/30 font-black border-t border-white/5 pt-4">
                      <span>ALGO_VER: 4.2.1</span>
                      <span>SECURE_ENCRYPTION_BY_RESCU_NET</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Navigation Helper */}
      <footer className="fixed bottom-10 left-6 right-6 z-[100]">
         <div className="bg-white/80 backdrop-blur-2xl rounded-full p-2 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-around">
            <button 
              onClick={() => navigate('/')}
              className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
               <Activity size={24} />
            </button>
            <button 
              className="w-12 h-12 flex items-center justify-center text-red-600"
            >
               <MapPin size={24} />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
               <ShieldCheck size={24} />
            </button>
         </div>
      </footer>
    </div>
  );
}
