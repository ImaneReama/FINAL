import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, MessageSquare, User, Settings, Phone, Globe, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navigation({ user, onLogout, theme, onThemeChange, language, onLanguageChange }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('wqaft_user');
    localStorage.removeItem('wqaft_user');
    sessionStorage.removeItem('wqaft_token');
    localStorage.removeItem('wqaft_token');
    onLogout?.();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Phone, label: 'Contacts', path: '/contacts' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Mon Profil', path: '/profile' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <div className="fixed top-0 left-0 z-40 p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-[#F4D06F] text-black hover:bg-[#e0be53] transition"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Menu */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '0%' : '-100%' }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 z-30 w-64 h-screen bg-slate-900 border-r border-slate-700 p-6 shadow-2xl"
      >
        {/* User Info */}
        <div className="mt-16 mb-8">
          <p className="text-white font-bold text-lg">{user?.name || 'Utilisateur'}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <p className="text-[#F4D06F] text-xs mt-2 uppercase font-semibold">
            {user?.role === 'mecanicien' ? 'Mécanicien' : 'Automobiliste'}
          </p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-slate-800 transition"
            >
              <item.icon className="h-5 w-5 text-[#F4D06F]" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-slate-700 pt-4 space-y-4">
          {/* Language Selector */}
          <div>
            <label className="flex items-center gap-2 text-white text-sm mb-2">
              <Globe className="h-4 w-4 text-[#F4D06F]" />
              Langue
            </label>
            <select
              value={language || 'fr'}
              onChange={(e) => {
                onLanguageChange?.(e.target.value);
                localStorage.setItem('language', e.target.value);
              }}
              className="w-full rounded-lg bg-slate-800 text-white px-3 py-2 text-sm border border-slate-700 focus:border-[#F4D06F]"
            >
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              onThemeChange?.(newTheme);
              localStorage.setItem('theme', newTheme);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-5 w-5 text-[#F4D06F]" />
                <span>Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-[#F4D06F]" />
                <span>Mode Sombre</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/30 text-red-200 hover:bg-red-900/50 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
