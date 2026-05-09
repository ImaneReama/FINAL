import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, MessageCircle, Users, Settings, FileText, Heart, ShieldCheck, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';

const itemsByRole = {
  automobiliste: [
    { path: '/driver', labelKey: 'home', icon: Home },
    { path: '/contacts', labelKey: 'contacts', icon: Users },
    { path: '/messages', labelKey: 'messages', icon: MessageCircle },
    { path: '/profile', labelKey: 'profile', icon: ShieldCheck },
    { path: '/settings', labelKey: 'settings', icon: Settings },
  ],
  mecanicien: [
    { path: '/mechanic', labelKey: 'home', icon: Home },
    { path: '/requests', labelKey: 'requests', icon: FileText },
    { path: '/interventions', labelKey: 'interventions', icon: Heart },
    { path: '/messages', labelKey: 'messages', icon: MessageCircle },
    { path: '/profile', labelKey: 'profile', icon: ShieldCheck },
    { path: '/settings', labelKey: 'settings', icon: Settings },
  ],
};

export default function Layout({ role = 'automobiliste', title = '', children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useApp();
  const items = itemsByRole[role] || itemsByRole.automobiliste;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar role={role} />
      <div className="flex-1 lg:pl-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 hover:border-[#F4D06F]">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#F4D06F]">WQAFT</p>
            <h1 className="text-lg font-bold">{title || 'Tableau de bord'}</h1>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-[#F4D06F]/10" />
        </header>

        {open && (
          <div className="fixed inset-0 z-40 bg-slate-950/90 p-6 text-white lg:hidden">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#F4D06F]">Menu</p>
                <h2 className="text-2xl font-bold">Navigation</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 hover:border-[#F4D06F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-3">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-3xl px-4 py-4 text-sm font-semibold transition ${active ? 'bg-[#F4D06F]/10 text-[#F4D06F]' : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800'}`}
                  >
                    <Icon className="h-5 w-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
            <button onClick={handleLogout} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-red-600 px-4 py-4 text-sm font-black uppercase text-white transition hover:bg-red-500">
              <LogOut className="h-4 w-4" /> {t('logout')}
            </button>
          </div>
        )}

        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
