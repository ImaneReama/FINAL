import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, User, Phone, MapPin, 
  MessageCircle, Search, Star, 
  ShieldCheck, ArrowRight, Heart,
  X, Mail, Map, Clock, Settings,
  LogOut, Filter, ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';

export default function ContactView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useApp();
  const role = user?.role || 'automobiliste';
  const isMec = ['mecanicien', 'mechanic', 'pro'].includes(role.toLowerCase());

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        const res = await fetch('/api/mechanics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialties?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessage = (contact) => {
    navigate(`/messages?contactId=${contact.id}&name=${encodeURIComponent(contact.name)}`);
  };

  // Zoom wrapper for mechanics (60%)
  const containerStyle = isMec ? {
    transform: 'scale(0.6)',
    transformOrigin: 'top left',
    width: '166.66%',
    height: '166.66%',
  } : {};

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div style={containerStyle}>
        <div className="flex h-full w-full">
          <Sidebar role={role} />
          
          <main className="flex-1 p-6 lg:p-20">
            <div className="mx-auto max-w-7xl">
              <header className="mb-20">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                  <div className="max-w-2xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
                      <div className="h-px w-12 bg-[#F4D06F]/50" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4D06F]">{t('contacts') || 'Contacts'}</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-8">
                      {t('nearbyMechanics') || 'Pros à proximité'}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 text-lg font-medium leading-relaxed">
                      Trouvez les meilleurs dépanneurs de votre zone et contactez-les instantanément.
                    </motion.p>
                  </div>

                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative group w-full lg:w-[400px]">
                    <div className="absolute inset-0 bg-[#F4D06F]/5 rounded-[2.5rem] blur-2xl group-hover:bg-[#F4D06F]/10 transition-all"></div>
                    <div className="relative flex items-center bg-slate-900/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-4 transition-all focus-within:border-[#F4D06F]/30 focus-within:bg-slate-900/60">
                      <Search className="h-6 w-6 text-slate-500 ml-4" />
                      <input 
                        type="text" 
                        placeholder={t('searchByName') || 'Chercher un expert...'} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 w-full px-6 py-4 text-white font-bold placeholder:text-slate-600"
                      />
                      <button className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#F4D06F] hover:text-black transition-all">
                        <Filter className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </header>

              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-16 w-16 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="rounded-[4rem] bg-slate-900/50 p-32 text-center border border-white/5 backdrop-blur-xl">
                  <Users className="mx-auto h-24 w-24 text-slate-800 mb-10 opacity-20" />
                  <h2 className="text-3xl font-black text-slate-500 uppercase tracking-widest">{t('noMechanicsFound') || 'Aucun pro trouvé'}</h2>
                  <button onClick={() => setSearchTerm('')} className="mt-10 px-10 py-5 rounded-3xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-[#F4D06F] hover:text-black transition">Réinitialiser</button>
                </div>
              ) : (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredContacts.map((contact, idx) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-[#F4D06F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.5rem] blur-3xl"></div>
                      
                      <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 border border-white/5 p-10 transition-all hover:border-[#F4D06F]/30 hover:-translate-y-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">En ligne</span>
                          </div>
                          <button className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-[#F4D06F] transition-colors">
                            <Heart className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex flex-col items-center text-center mb-10">
                          <div className="relative mb-8">
                            <div className="h-32 w-32 rounded-[3.5rem] bg-slate-800 p-1 border-2 border-white/10 group-hover:border-[#F4D06F]/50 transition-all overflow-hidden">
                              {contact.photo ? (
                                <img src={contact.photo} alt={contact.name} className="h-full w-full object-cover rounded-[3rem]" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-600 bg-slate-900 rounded-[3rem]">
                                  <User className="h-14 w-14" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-[#F4D06F] border-4 border-slate-900 flex items-center justify-center text-black shadow-xl">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                          </div>

                          <h3 className="text-2xl font-black text-white group-hover:text-[#F4D06F] transition-colors mb-2 line-clamp-1">{contact.name}</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">{contact.specialties || 'Expert'}</p>
                          
                          <div className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 border border-white/5 w-full">
                            <div className="flex-1 flex flex-col items-center border-r border-white/5">
                              <div className="flex items-center gap-1.5 text-[#F4D06F]">
                                <Star className="h-3.5 w-3.5 fill-[#F4D06F]" />
                                <span className="text-sm font-black text-white">{contact.rating || '4.8'}</span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rating</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                              <div className="flex items-center gap-1.5 text-blue-400">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-sm font-black text-white">1.2 km</span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Distance</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleMessage(contact)}
                            className="flex-1 py-5 rounded-3xl bg-[#F4D06F] text-black font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:scale-[1.02] transition shadow-lg shadow-[#F4D06F]/20"
                          >
                            <MessageCircle className="h-4 w-4" /> Message
                          </button>
                          <button 
                            onClick={() => setSelectedContact(contact)}
                            className="flex-1 py-5 rounded-3xl border border-white/10 bg-white/5 text-white font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition"
                          >
                            <User className="h-4 w-4" /> Profil
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedContact(null)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="relative w-full max-w-2xl overflow-hidden rounded-[5rem] border border-white/10 bg-slate-900 shadow-[0_100px_200px_-20px_rgba(0,0,0,0.8)]">
              <div className="h-64 bg-gradient-to-br from-[#F4D06F]/40 via-[#F4D06F]/5 to-transparent"></div>
              <button onClick={() => setSelectedContact(null)} className="absolute right-10 top-10 h-16 w-16 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition border border-white/10 backdrop-blur-md group">
                <X className="h-8 w-8 group-hover:rotate-90 transition-transform" />
              </button>
              
              <div className="px-16 pb-16">
                <div className="relative -mt-32 mb-10 flex justify-center">
                  <div className="h-56 w-56 rounded-[4.5rem] bg-slate-800 border-[10px] border-slate-900 flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-105">
                    {selectedContact.photo ? (
                      <img src={selectedContact.photo} alt={selectedContact.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-24 w-24 text-slate-600" />
                    )}
                  </div>
                </div>

                <div className="text-center mb-12">
                  <h3 className="text-5xl font-black text-white tracking-tighter mb-4">{selectedContact.name}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#F4D06F]">{selectedContact.mecanicien_type || 'MÉCANICIEN EXPERT'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="rounded-[2.5rem] bg-white/5 border border-white/5 p-8 hover:bg-white/[0.08] transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Spécialités</p>
                    <p className="text-lg font-black text-white">{selectedContact.specialties || 'Diagnostic & Réparation'}</p>
                  </div>
                  <div className="rounded-[2.5rem] bg-white/5 border border-white/5 p-8 hover:bg-white/[0.08] transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Expérience</p>
                    <p className="text-lg font-black text-white">8 ans d'expertise</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <button onClick={() => window.open(`tel:${selectedContact.phone}`)} className="flex-1 h-24 rounded-[2.5rem] bg-[#F4D06F] text-black font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] transition shadow-2xl shadow-[#F4D06F]/20">
                    <Phone className="h-6 w-6" /> {t('call') || 'Appeler'}
                  </button>
                  <button onClick={() => handleMessage(selectedContact)} className="flex-1 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-white/10 transition">
                    <MessageCircle className="h-6 w-6" /> Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
