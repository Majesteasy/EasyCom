import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText, Wrench, TrendingUp,
  Shield, Settings, LogOut, BookOpen, Calculator, GraduationCap, Bot
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients',       icon: Users,           label: 'Clients' },
  { to: '/interventions', icon: Wrench,          label: 'Interventions' },
  { to: '/facturation',   icon: FileText,        label: 'Facturation' },
  { to: '/pipeline',      icon: TrendingUp,      label: 'Pipeline' },
  { to: '/comptabilite',  icon: BookOpen,        label: 'Comptabilité' },
  { to: '/fiscalite',     icon: Calculator,      label: 'Fiscalité GE' },
  { to: '/formation',     icon: GraduationCap,   label: 'Formation' },
  { to: '/agents',        icon: Bot,             label: 'Agents IA' },
  { to: '/coffre',        icon: Shield,          label: 'Coffre sécurisé' },
  { to: '/parametres',    icon: Settings,        label: 'Paramètres' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm">DJ</div>
          <div>
            <p className="font-bold text-sm">DJA.MAINT</p>
            <p className="text-xs text-gray-400">Facility Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
