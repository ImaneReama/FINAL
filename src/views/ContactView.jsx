import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, MapPin, Star, ShieldCheck, Clock, Wrench, Car, Filter, X, ChevronRight, Zap } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { motion, AnimatePresence } from 'motion/react';

import { allContacts } from '../utils/contactsData.js';

export default function ContactView() {
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'automobiliste';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  const filteredContacts = allContacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Tous' || c.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Tous', 'Garage', 'Spécialiste', 'Dépannage', 'Indépendant'];

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />
      
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <header className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-3"
              >
                {t('mechanicsRecommended') || 'Professionnels Recommandés'}
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black tracking-tight"
              >
                {t('contacts')} <span className="text-[#F4D06F]">Marrakech</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg text-muted"
              >
                Trouvez les meilleurs mécaniciens et services de dépannage à proximité pour une assistance immédiate.
              </motion.p>
            </div>

            <div className="flex items-center gap-2 rounded-[2rem] bg-card p-2 border border-app backdrop-blur-xl">
              <Zap className="ml-4 h-5 w-5 text-[#F4D06F]" />
              <span className="mr-4 text-sm font-black uppercase tracking-widest">{allContacts.length} Contacts</span>
            </div>
          </header>

          {/* Search and Filter Bar */}
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted group-focus-within:text-[#F4D06F] transition-colors" />
              <input
                type="text"
                placeholder={t('searchByName') || "Rechercher un garage, une spécialité..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[2rem] bg-card py-6 pl-16 pr-8 text-lg font-medium outline-none border border-app focus:border-[#F4D06F] transition-all shadow-2xl"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-2xl px-8 py-5 text-sm font-black uppercase tracking-widest transition-all ${
                    category === cat 
                      ? 'bg-[#F4D06F] text-black shadow-xl shadow-[#F4D06F]/20' 
                      : 'bg-card text-muted hover:text-white border border-app'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts Grid */}
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredContacts.map((contact, idx) => (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative"
                >
                  {contact.emergency && (
                    <div className="absolute -top-3 -right-3 z-10 flex h-10 items-center gap-2 rounded-full bg-red-500 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl animate-pulse">
                      <Clock className="h-4 w-4" /> 24/7 Urgence
                    </div>
                  )}
                  
                  <div className="h-full rounded-[3rem] bg-card p-8 border border-app backdrop-blur-xl transition-all duration-500 hover:border-[#F4D06F]/40 hover:translate-y-[-8px] hover:shadow-[0_20px_50px_-20px_rgba(244,208,111,0.2)]">
                    <div className="mb-8 flex items-start justify-between">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-white/5 text-[#F4D06F] group-hover:scale-110 transition-transform duration-500`}>
                        {contact.category === 'Dépannage' ? <Zap className="h-8 w-8" /> : <Wrench className="h-8 w-8" />}
                      </div>
                      <div className="flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-[#F4D06F]">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-black">{contact.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight group-hover:text-[#F4D06F] transition-colors">{contact.name}</h3>
                    <p className="mt-3 text-sm font-bold text-muted uppercase tracking-wider line-clamp-2 min-h-[40px]">
                      {contact.specialty}
                    </p>

                    <div className="mt-8 space-y-4 border-t border-app pt-8">
                      <div className="flex items-start gap-4">
                        <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#F4D06F]" />
                        <p className="text-sm font-medium text-muted leading-relaxed">
                          {contact.address}
                        </p>
                      </div>
                      
                      <a 
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-4 group/btn"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4D06F]/10 text-[#F4D06F] group-hover/btn:bg-[#F4D06F] group-hover/btn:text-black transition-all">
                          <Phone className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-black tracking-tighter group-hover/btn:text-[#F4D06F] transition-colors">
                          {contact.phone}
                        </span>
                      </a>
                    </div>

                    <div className="mt-10 flex gap-3">
                      <button 
                        onClick={() => navigate(`/mechanic/${contact.id}`)}
                        className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white/5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-app hover:bg-white/10 transition-all border border-white/5"
                      >
                        {t('details') || 'Détail'}
                      </button>
                      <button 
                        onClick={() => navigate(`/messages?contactId=${contact.id}`)}
                        className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-[#F4D06F] py-5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-[#e0be53] transition-all shadow-lg shadow-[#F4D06F]/10"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredContacts.length === 0 && (
            <div className="mt-20 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-card border border-app">
                <Search className="h-10 w-10 text-muted" />
              </div>
              <h3 className="text-2xl font-black">Aucun mécanicien trouvé</h3>
              <p className="mt-2 text-muted">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
