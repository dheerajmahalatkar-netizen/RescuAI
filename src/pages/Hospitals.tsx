import { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, Star, Building2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Hospital {
  id: string;
  name: string;
  distance: string;
  time: string;
  rating: number;
  address: string;
  phone: string;
  emergency: boolean;
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated nearby hospitals lookup
    // In a production app, use Google Places API
    const mockHospitals: Hospital[] = [
      {
        id: '1',
        name: 'City General Hospital',
        distance: '1.2 km',
        time: '5 mins',
        rating: 4.8,
        address: '123 Medical Dr, Central City',
        phone: '555-0123',
        emergency: true
      },
      {
        id: '2',
        name: 'St. Mary Trauma Center',
        distance: '2.5 km',
        time: '8 mins',
        rating: 4.5,
        address: '456 Health Way, North Side',
        phone: '555-0456',
        emergency: true
      },
      {
        id: '3',
        name: 'Community Wellness Clinic',
        distance: '3.1 km',
        time: '12 mins',
        rating: 4.2,
        address: '789 Care Ln, West Hills',
        phone: '555-0789',
        emergency: false
      }
    ];

    setTimeout(() => {
      setHospitals(mockHospitals);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Locating nearest hospitals...</div>;

  return (
    <div className="p-6 pb-32">
       <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900">Near You</h1>
        <p className="text-gray-500 font-medium text-sm">Hospitals and Trauma Centers</p>
      </header>

      {/* Map Placeholder */}
      <div className="w-full h-48 bg-gray-100 rounded-3xl mb-8 relative overflow-hidden border border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="text-red-600 mx-auto mb-2 opacity-50" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Map View Available in App</p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {hospitals.map((hosp) => (
          <motion.div
            key={hosp.id}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 leading-tight">{hosp.name}</h3>
                  {hosp.emergency && (
                    <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-red-100">
                      ER 24/7
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                   <span className="flex items-center gap-1"><MapPin size={12} /> {hosp.distance}</span>
                   <span className="flex items-center gap-1"><Clock size={12} /> {hosp.time}</span>
                   <span className="flex items-center gap-1 text-yellow-600"><Star size={12} fill="currentColor" /> {hosp.rating}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Building2 size={24} />
              </div>
            </div>

            <div className="flex gap-2">
               <a 
                 href={`tel:${hosp.phone}`}
                 className="flex-1 bg-gray-50 text-gray-600 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
               >
                 <Phone size={14} /> Call
               </a>
               <button 
                 className="flex-1 bg-black text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/5"
               >
                 <Navigation size={14} /> Navigate
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-blue-50 rounded-3x border border-blue-100 border-[1.5px] rounded-3xl">
         <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2">Hospital Ranking</p>
         <p className="text-sm text-blue-700 leading-tight">These hospitals are ranked by travel time and trauma specialty level.</p>
      </div>
    </div>
  );
}
