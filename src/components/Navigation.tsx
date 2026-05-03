import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, MapPin, Activity, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Navigation() {
  const location = useLocation();
  // Don't show navigation on the emergency guidance page to keep focus
  if (location.pathname.startsWith('/emergency/')) return null;

  const items = [
    { icon: Activity, label: 'HUB', path: '/' },
    { icon: MapPin, label: 'RADAR', path: '/hospitals' },
    { icon: ShieldCheck, label: 'IDENTITY', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/5 px-6 py-4 flex justify-around items-center z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center gap-1.5 transition-all duration-300",
              isActive ? "text-red-500 scale-110" : "text-white/30 hover:text-white/60"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] font-mono leading-none">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute -top-6 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
