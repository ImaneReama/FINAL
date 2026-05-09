import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, DollarSign, CheckCircle, XCircle, Clock, ShieldCheck, MessageCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';

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
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#F4D06F]/10 border-[#F4D06F]/30 text-[#F4D06F]'} transition-all duration-300`}>
      <div className="relative">
        <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
        {timeLeft < 60 && <div className="absolute inset-0 bg-red-500 blur-lg opacity-20" />}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Temps restant</span>
        <span className="text-lg font-black tabular-nums">{mins}:{secs < 10 ? '0' : ''}{secs}</span>
      </div>
    </div>
  );
};

export default function ProposalsView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'automobiliste';
  
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedId, setAcceptedId] = useState(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        const res = await fetch('/api/offers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProposals(data);
        }
      } catch (err) {
        console.error("Erreur chargement propositions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
    const interval = setInterval(fetchProposals, 5000); // Polling 5s
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (proposal) => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/offers/${proposal.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAcceptedId(proposal.id);
        setTimeout(() => {
          const mechId = proposal.mecanicien_id;
          const mechName = proposal.name || 'Mécanicien';
          navigate(`/messages?contactId=${mechId}&name=${encodeURIComponent(mechName)}`);
        }, 1500);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'acceptation");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const handleRefuse = async (id) => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/offers/${id}/refuse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProposals(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-2">{t('proposals') || 'Propositions'}</p>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">{t('availableMechanics') || 'Mécaniciens disponibles'}</h1>
              </div>
              {proposals.length > 0 && proposals[0].demande && (
                <RequestTimer createdAt={proposals[0].demande.created_at} onExpire={() => navigate('/driver')} />
              )}
            </div>
          </header>

          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <div className="h-12 w-12 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-black uppercase tracking-widest text-[#F4D06F]">Recherche d'offres...</p>
                </div>
              ) : proposals.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-20 bg-slate-900/50 rounded-[3rem] border border-white/5 backdrop-blur-xl">
                  <Clock className="h-16 w-16 text-slate-700 mx-auto mb-6 opacity-20" />
                  <h3 className="text-xl font-black text-slate-400">Aucune proposition pour le moment</h3>
                  <p className="text-slate-500 mt-2">Dès qu'un mécanicien répond, son offre apparaîtra ici.</p>
                </motion.div>
              ) : proposals.map((proposal) => (
                <motion.div
                  layout
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative overflow-hidden rounded-[2.5rem] bg-slate-900 border transition-all duration-500 ${
                    acceptedId === proposal.id ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'border-white/5'
                  }`}
                >
                  {/* ... rest of the card UI ... */}
                  <div className="p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-3xl bg-[#F4D06F] flex items-center justify-center text-black text-3xl font-black shadow-xl">
                          {proposal.name?.[0] || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-black">{proposal.name}</h3>
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-[#F4D06F] fill-[#F4D06F]" />
                              <span className="text-white">4.9</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                              <MapPin className="h-4 w-4" />
                              <span>Proche</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Prix proposé</div>
                        <div className="text-4xl font-black text-[#F4D06F] tabular-nums">
                          {proposal.final_price || proposal.price} <span className="text-lg">MAD</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-4">
                      <button
                        onClick={() => handleAccept(proposal)}
                        disabled={acceptedId !== null}
                        className={`flex-1 min-w-[200px] h-16 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${
                          acceptedId === proposal.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[#F4D06F] text-black hover:bg-[#e0be53] shadow-lg shadow-[#F4D06F]/10'
                        }`}
                      >
                        {acceptedId === proposal.id ? (
                          <><CheckCircle className="h-5 w-5" /> Accepté !</>
                        ) : (
                          <><CheckCircle className="h-5 w-5" /> Accepter</>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleRefuse(proposal.id)}
                        disabled={acceptedId !== null}
                        className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all group"
                      >
                        <XCircle className="h-6 w-6 group-hover:scale-110 transition" />
                      </button>

                      <button
                        onClick={() => navigate(`/messages?contactId=${proposal.mecanicien_id}&name=${encodeURIComponent(proposal.name)}`)}
                        className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500 transition-all"
                      >
                        <MessageCircle className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
