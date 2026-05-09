import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, CheckCircle, XCircle, Clock, Calendar, MessageCircle, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';

const mockHistory = [
  { id: 101, name: 'Garage Atlas', price: 200, date: '05 Mai 2026', status: 'accepted', specialty: 'Moteur' },
  { id: 102, name: 'Ahmed Auto', price: 150, date: '02 Mai 2026', status: 'refused', specialty: 'Pneus' },
  { id: 103, name: 'Marrakech Dépannage', price: 350, date: '28 Avril 2026', status: 'accepted', specialty: 'Remorquage' },
];

export default function ProposalsHistoryView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'automobiliste';

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-3">Archives</p>
            <h1 className="text-4xl font-black">Historique des Propositions</h1>
          </header>

          <div className="space-y-6">
            {mockHistory.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl transition-all hover:bg-white/10"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl ${item.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                      {item.status === 'accepted' ? <CheckCircle /> : <XCircle />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{item.name}</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.specialty}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{item.status === 'accepted' ? 'Terminé' : 'Refusé'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-3xl font-black">{item.price} <span className="text-sm text-[#F4D06F]">MAD</span></p>
                    </div>
                    <button 
                      onClick={() => navigate(`/mechanic/${item.id}`)}
                      className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/20 transition"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
