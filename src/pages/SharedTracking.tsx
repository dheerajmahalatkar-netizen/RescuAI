import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AlertCircle, Clock, MapPin, ShieldAlert } from 'lucide-react';
import { EmergencyRecord } from '../types';
import L from 'leaflet';

// Leaflet Icon fix
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

// Helper to recenter map
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function SharedTracking() {
  const { id } = useParams<{ id: string }>();
  const [emergency, setEmergency] = useState<EmergencyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'emergencies', id), 
      (docSnap) => {
        if (docSnap.exists()) {
          setEmergency({ id: docSnap.id, ...docSnap.data() } as EmergencyRecord);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Tracking error", err);
        setError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShieldAlert size={48} className="text-red-600 animate-pulse mx-auto mb-4" />
        <p className="text-gray-500 font-medium tracking-tight">Initializing Live Tracker...</p>
      </div>
    </div>
  );

  if (error || !emergency) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Emergency Link Expired</h2>
        <p className="text-gray-500 mt-2">This tracking link is no longer active or the ID is incorrect.</p>
      </div>
    </div>
  );

  const position: [number, number] = [emergency.location.latitude, emergency.location.longitude];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-red-600 p-6 text-white pt-10 pb-8 flex justify-between items-center shrink-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1 block animate-pulse">Live Tracking Active</span>
          <h1 className="text-2xl font-black tracking-tighter uppercase">SOS Alert: {emergency.type}</h1>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/30">
          {emergency.status}
        </div>
      </div>

      {/* Live Map */}
      <div className="flex-1 relative z-0">
        <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={position} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-red-600">Person in Distress</p>
                <p className="text-[10px] text-gray-500">
                  Last updated: {emergency.timestamp?.seconds ? new Date(emergency.timestamp.seconds * 1000).toLocaleTimeString() : 'Refreshing...'}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Info Card */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shrink-0">
                    <ShieldAlert size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-0.5">Emergency Triage</p>
                   <p className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                     Category: {emergency.type} / {emergency.severity || 'Critical'} Danger
                   </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <MapPin size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Speed</span>
                    </div>
                    <p className="font-bold text-gray-900">Stationary</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Elapsed</span>
                    </div>
                    <p className="font-bold text-gray-900">Active</p>
                </div>
            </div>

            <a 
              href={`https://www.google.com/maps?q=${position[0]},${position[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-6 py-4 bg-black text-white rounded-2xl font-bold text-center block shadow-xl shadow-black/10 active:scale-95 transition-transform"
            >
              Open in Google Maps
            </a>
        </div>
      </div>
    </div>
  );
}
