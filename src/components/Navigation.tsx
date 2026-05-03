import { NavLink } from 'react-router-dom';
import { Home, User, MapPin, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navigation() {
  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MapPin, label: 'Hospitals', path: '/hospitals' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center z-50">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-red-600" : "text-gray-400 hover:text-gray-600"
            )
          }
        >
          <item.icon size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
