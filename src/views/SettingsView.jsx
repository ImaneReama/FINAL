import React, { useEffect, useState } from 'react';
import { Globe, Moon, Sun, Ruler, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { motion } from 'motion/react';

const languages = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Allemand', 'Italien', 'Portugais', 'Chinois', 'Japonais'];
const distances = ['Kilomètres (km)', 'Miles (mi)'];

export default function SettingsView() {
  const { user } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = useApp();
  const [distance, setDistance] = useState(distances[0]);
  const role = user?.role || 'automobiliste';

  useEffect(() => {
    const savedDistance = localStorage.getItem('wqaft_distance');
    if (savedDistance) setDistance(savedDistance);
  }, []);

  useEffect(() => {
    localStorage.setItem('wqaft_distance', distance);
  }, [distance]);

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#F4D06F]">{t('configuration') || 'Configuration'}</p>
            <h1 className="mt-2 text-4xl font-black">{t('settings')}</h1>
            <p className="mt-2 text-muted">Personnalisez votre application pour une expérience optimale.</p>
          </header>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Appearance Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] bg-card p-8 border border-app backdrop-blur-xl shadow-2xl"
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#F4D06F]/10 flex items-center justify-center text-[#F4D06F]">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <h2 className="text-xl font-bold">{t('appearance') || 'Apparence'}</h2>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`relative flex items-center justify-between rounded-2xl p-5 border transition-all ${
                    theme === 'light' 
                      ? 'border-[#F4D06F] bg-[#F4D06F]/5' 
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-[#F4D06F] text-black' : 'bg-slate-800 text-slate-400'}`}>
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{t('themeLight')}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Luminosité maximale</p>
                    </div>
                  </div>
                  {theme === 'light' && <Check className="h-5 w-5 text-[#F4D06F]" />}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`relative flex items-center justify-between rounded-2xl p-5 border transition-all ${
                    theme === 'dark' 
                      ? 'border-[#F4D06F] bg-[#F4D06F]/5' 
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#F4D06F] text-black' : 'bg-slate-800 text-slate-400'}`}>
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{t('themeDark')}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Confort visuel nocturne</p>
                    </div>
                  </div>
                  {theme === 'dark' && <Check className="h-5 w-5 text-[#F4D06F]" />}
                </button>
              </div>
            </motion.div>

            {/* Language & Units Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              <div className="rounded-[2.5rem] bg-slate-900/40 p-8 border border-slate-800/50 backdrop-blur-xl shadow-2xl">
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F4D06F]/10 flex items-center justify-center text-[#F4D06F]">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">{t('language')}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`rounded-2xl py-4 font-bold border transition-all ${
                        language === lang 
                          ? 'border-[#F4D06F] bg-[#F4D06F] text-black shadow-lg shadow-[#F4D06F]/10' 
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.5rem] bg-slate-900/40 p-8 border border-slate-800/50 backdrop-blur-xl shadow-2xl">
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F4D06F]/10 flex items-center justify-center text-[#F4D06F]">
                    <Ruler className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">{t('distanceUnit')}</h2>
                </div>
                <select 
                  value={distance} 
                  onChange={(e) => setDistance(e.target.value)} 
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4 text-white outline-none focus:border-[#F4D06F] transition appearance-none"
                >
                  {distances.map((unit) => <option key={unit} value={unit} className="bg-slate-950">{unit}</option>)}
                </select>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
