import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  MessageSquare, 
  Phone, 
  Clock, 
  Car, 
  Eye, 
  X,
  Camera,
  AlertTriangle,
  DollarSign,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';

const RequestTimer = ({ createdAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculate = () => {
      const created = new Date(createdAt).getTime();
      const expires = created + (5 * 60 * 1000);
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) onExpire?.();
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (timeLeft === null) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#F4D06F]/10 border-[#F4D06F]/30 text-[#F4D06F]'} text-[10px] font-black tabular-nums`}>
      <Clock className={`w-3 h-3 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
      {mins}:{secs < 10 ? '0' : ''}{secs}
    </div>
  );
};

export default function RequestsView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'mecanicien';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProposal, setPriceProposal] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const [myOffers, setMyOffers] = useState({});

  const fetchRequests = async () => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    try {
      const [resDem, resInt] = await Promise.all([
        fetch('/api/demandes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/interventions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (resDem.ok) {
        const data = await resDem.json();
        setRequests(data);
      }
      
      if (resInt.ok) {
        const data = await resInt.json();
        const offersMap = {};
        data.forEach(item => {
          if (item.demande_id) {
            // Keep the most recent or active offer
            const existing = offersMap[item.demande_id];
            if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
              offersMap[item.demande_id] = item;
            }
          }
        });
        setMyOffers(offersMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const openChat = (id, name) => navigate(`/messages?contactId=${id}&name=${encodeURIComponent(name)}`);

  const handleProposePrice = async () => {
    if (!selectedRequest || !priceProposal) return;
    setIsSubmittingProposal(true);
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          demande_id: selectedRequest.id,
          price: parseFloat(priceProposal)
        })
      });
      if (res.ok) {
        alert("Proposition envoyée avec succès !");
        setShowPriceModal(false);
        setSelectedRequest(null);
        setPriceProposal('');
        fetchRequests(); // Refresh list to show the price
      } else {
        alert("Erreur lors de l'envoi de la proposition.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-hidden">
      <BackButton />
      <Sidebar role={role} />
      
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-2">{t('dashboard') || 'Tableau de bord'}</p>
            <h1 className="text-4xl font-black text-white">{t('activeRequests') || 'Demandes actives'}</h1>
          </div>
          <div className="grid gap-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                <div className="h-12 w-12 rounded-full border-4 border-[#F4D06F]/20 border-t-[#F4D06F] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Recherche de pannes à proximité...</p>
              </div>
            ) : (
              requests.map((req) => {
                const myOffer = myOffers[req.id];
                const isRefused = myOffer?.status === 'refused';
                const isPending = myOffer?.status === 'en_attente';
                
                // Persistence rule for refused offers: hide after 2 mins from refusal
                if (isRefused) {
                  const refusalTime = new Date(myOffer.updated_at || myOffer.created_at).getTime();
                  if (Date.now() - refusalTime > 2 * 60 * 1000) return null;
                }

                return (
                  <div key={req.id} className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-[#F4D06F]/20 group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#F4D06F] flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-[#F4D06F]/10 group-hover:scale-105 transition">
                          {req.client?.name?.[0] || 'D'}
                        </div>
                        <div>
                          <p className="font-black text-white text-xl">{req.client?.name || 'Automobiliste'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <RequestTimer createdAt={req.created_at} onExpire={fetchRequests} />
                            <span className="mx-2 opacity-30">•</span>
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{req.distance || 'Proche'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-[#F4D06F]/10 text-[#F4D06F] text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest border border-[#F4D06F]/20">
                          {req.category}
                        </span>
                        {isPending && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 animate-pulse">En attente de réponse</span>
                        )}
                        {isRefused && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Proposition refusée</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-[2rem] p-6 mb-8 space-y-4 border border-white/5">
                      <div className="flex items-start gap-4 text-sm text-slate-300 font-bold">
                        <div className="p-2 bg-white/5 rounded-lg shrink-0">
                          <MapPin className="w-4 h-4 text-[#F4D06F]" />
                        </div>
                        <span className="mt-1 leading-relaxed">{req.address || "Localisation non précisée"}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed italic px-2">
                        "{req.description || "Aucun détail supplémentaire fourni par l'automobiliste."}"
                      </p>
                    </div>
        
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="bg-white/5 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 border border-white/5 transition-all"
                      >
                        <Eye className="w-5 h-5" /> 
                        Détails
                      </button>
                      <a 
                        href={`tel:${req.client?.phone}`} 
                        className="bg-emerald-500 text-white p-5 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest gap-3 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
                      >
                        <Phone className="w-5 h-5" />
                        Appeler
                      </a>
                      <button 
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowPriceModal(true);
                        }}
                        className={`p-5 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest gap-3 transition-all shadow-lg ${
                          isPending
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-default' 
                            : isRefused
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-[#F4D06F] text-black hover:bg-[#e0be53] shadow-[#F4D06F]/10'
                        }`}
                        disabled={isPending}
                      >
                        <DollarSign className="w-5 h-5" />
                        {isPending ? `Proposé: ${myOffer.final_price || myOffer.price} MAD` : isRefused ? 'Proposer nouveau prix' : 'Proposer prix'}
                      </button>
                    </div>
        
                    <button 
                      onClick={() => openChat(req.client_id, req.client?.name)} 
                      className="w-full mt-4 bg-slate-800/50 text-slate-300 p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-slate-800 hover:text-white border border-white/5 transition-all"
                    >
                      <MessageSquare className="w-5 h-5" /> 
                      Envoyer un message
                    </button>
                  </div>
                );
              }
            ))}
            {!loading && requests.length === 0 && (
              <div className="bg-slate-900/20 rounded-[3rem] p-24 text-center border-2 border-dashed border-white/5">
                <AlertTriangle className="h-12 w-12 text-slate-700 mx-auto mb-6 opacity-20" />
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Aucune demande active à proximité</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#F4D06F] hover:bg-[#F4D06F] hover:text-black transition">Réactualiser</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Prix */}
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-[3rem] bg-slate-950 p-10 shadow-2xl border border-[#F4D06F]/20"
            >
              <h3 className="text-3xl font-black text-white mb-2">Proposer un prix</h3>
              <p className="text-slate-400 text-sm mb-8">Indiquez votre tarif estimé pour cette intervention.</p>
              
              <div className="relative mb-8">
                <input 
                  type="number" 
                  value={priceProposal}
                  onChange={(e) => setPriceProposal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-3xl font-black text-[#F4D06F] outline-none focus:border-[#F4D06F] transition"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">MAD</span>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowPriceModal(false);
                    setPriceProposal('');
                  }}
                  className="flex-1 py-5 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition"
                >
                  Annuler
                </button>
                <button 
                  disabled={isSubmittingProposal || !priceProposal}
                  onClick={handleProposePrice}
                  className="flex-1 py-5 rounded-2xl bg-[#F4D06F] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#e0be53] transition disabled:opacity-50"
                >
                  {isSubmittingProposal ? 'Envoi...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Détails Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-[2.5rem] bg-white overflow-hidden shadow-2xl"
            >
              <div className="relative h-64 bg-slate-950 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F4D06F] mb-1">Détails du problème</p>
                    <h3 className="text-3xl font-black text-white">{selectedRequest.category}</h3>
                  </div>
                  <div className="bg-[#F4D06F]/10 p-4 rounded-2xl text-[#F4D06F] border border-[#F4D06F]/20">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-blue-500 shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Véhicule</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRequest.vehicle || "Non spécifié"}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-emerald-500 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedRequest.description || "Aucune description"}</p>
                    </div>
                  </div>

                  {selectedRequest.location_details && (
                    <div className="flex gap-4">
                      <div className="p-3 bg-slate-100 rounded-2xl text-amber-500 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Précisions Localisation</p>
                        <p className="text-sm font-bold text-slate-700">{selectedRequest.location_details}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{selectedRequest.description || "L'automobiliste n'a pas fourni de description supplémentaire."}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => {
                      setShowPriceModal(true);
                    }}
                    className="flex-1 bg-[#F4D06F] text-black p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <DollarSign className="w-5 h-5" /> Proposer prix
                  </button>
                  <button 
                    onClick={() => openChat(selectedRequest.client_id, selectedRequest.client?.name)}
                    className="flex-1 bg-white/5 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-white/10"
                  >
                    <MessageSquare className="w-5 h-5" /> Message
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
