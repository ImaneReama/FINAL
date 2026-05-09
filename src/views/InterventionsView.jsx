import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, DollarSign, Star, Eye, MessageCircle, X, AlertTriangle, Phone, Car, MapPin, FileText, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function InterventionsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'mecanicien';
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchInterventions = async () => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch('/api/interventions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInterventions(data.map(item => ({
          ...item,
          client_id: item.demande?.client_id,
          name: item.demande?.client?.name || 'Client',
          issue: item.demande?.category || 'Panne',
          displayStatus: item.status === 'en cours' ? 'En intervention' : (item.status === 'terminée' ? 'Terminée' : item.status),
          date: new Date(item.created_at).toLocaleDateString(),
          price: item.final_price || item.price,
          vehicle: item.demande?.vehicle || 'Véhicule',
          description: item.demande?.description,
          address: item.demande?.address || 'Adresse non spécifiée',
          phone: item.demande?.client?.phone
        })));
      }
    } catch (err) {
      console.error("Error fetching interventions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
    const interval = setInterval(fetchInterventions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (client) => {
    const clientId = client.client_id || client.id;
    if (!clientId) return;
    navigate(`/messages?contactId=${clientId}&name=${encodeURIComponent(client.name)}`);
  };

  const handleFinish = async (id) => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/interventions/${id}/finish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Intervention terminée !");
        fetchInterventions();
      }
    } catch (err) { console.error(err); }
  };

  const handleRequestReview = async (id) => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/interventions/${id}/request-review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Demande d'avis envoyée au client !");
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenDetail = (item) => {
    setSelectedIntervention(item);
    setShowDetailModal(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <BackButton />
      <Sidebar role={role} />
      
      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-2">Tableau de bord</p>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white">Mes Interventions</h1>
          </header>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : interventions.length === 0 ? (
            <div className="rounded-[3rem] bg-slate-900/50 p-20 text-center border border-slate-800 backdrop-blur-xl">
              <CalendarCheck className="mx-auto h-20 w-20 text-slate-700 mb-6 opacity-20" />
              <h2 className="text-2xl font-black text-slate-400">Aucune intervention active</h2>
              <p className="text-slate-500 mt-2">Acceptez une demande pour commencer.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {interventions.map((item) => (
                <article key={item.id} className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 border border-white/5 hover:border-[#F4D06F]/30 transition-all shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'en cours' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      item.status === 'terminée' ? 'bg-[#F4D06F]/10 text-[#F4D06F] border border-[#F4D06F]/20' : 
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.displayStatus}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{item.date}</span>
                  </div>

                  <div className="flex items-center gap-5 mb-8">
                    <div className="h-16 w-16 rounded-3xl bg-[#F4D06F] flex items-center justify-center text-black text-2xl font-black shadow-xl group-hover:scale-110 transition-transform">
                      {item.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-[#F4D06F] transition-colors">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-3 w-3 text-[#F4D06F] fill-[#F4D06F]" />
                        <span className="text-sm font-black">4.8/5</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {item.status === 'en cours' && (
                      <>
                        <button 
                          onClick={() => handleFinish(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#F4D06F] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#e0be53] transition shadow-lg shadow-[#F4D06F]/10"
                        >
                          <CalendarCheck className="h-4 w-4" /> Terminer
                        </button>
                        <button 
                          onClick={() => handleSendMessage(item)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-200 hover:border-[#F4D06F] hover:text-[#F4D06F] transition"
                        >
                          <MessageCircle className="h-4 w-4" /> Message
                        </button>
                      </>
                    )}
                    {item.status === 'terminée' && (
                      <button 
                        onClick={() => handleRequestReview(item.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#F4D06F] hover:text-black transition border border-white/5"
                      >
                        <Star className="h-4 w-4" /> Demander un avis
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenDetail(item)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-200 hover:text-white transition"
                    >
                      <Eye className="h-4 w-4" /> Détails
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showDetailModal && selectedIntervention && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl"
            >
              <div className="h-32 bg-gradient-to-r from-[#F4D06F]/20 to-[#F4D06F]/5"></div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute right-6 top-6 h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 flex items-center justify-center transition"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="px-8 pb-8">
                <div className="relative -mt-12 mb-6 flex justify-center">
                  <div className="h-24 w-24 rounded-3xl bg-[#F4D06F] border-4 border-slate-900 flex items-center justify-center text-black text-3xl font-black shadow-2xl">
                    {selectedIntervention.name[0]}
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white">{selectedIntervention.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#F4D06F] mt-1">{selectedIntervention.address || 'Localisation inconnue'}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Type de panne</span>
                    </div>
                    <p className="text-sm font-bold text-white">{selectedIntervention.issue}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <Car className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Véhicule</span>
                    </div>
                    <p className="text-sm font-bold text-white">{selectedIntervention.vehicle}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 sm:col-span-2">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Adresse exacte</span>
                    </div>
                    <p className="text-sm font-bold text-white">{selectedIntervention.address}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Prix convenu</span>
                    </div>
                    <p className="text-xl font-black text-[#F4D06F]">{selectedIntervention.price} MAD</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => window.open(`tel:${selectedIntervention.phone}`)} className="flex-1 py-4 rounded-2xl bg-[#F4D06F] text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" /> Appeler
                  </button>
                  <button onClick={() => handleSendMessage(selectedIntervention)} className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Message
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
