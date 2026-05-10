import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, CheckCircle, XCircle, Clock, ShieldCheck, MessageCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';

export default function ProposalsView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'automobiliste';

  const [activeRequest, setActiveRequest] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedId, setAcceptedId] = useState(null);
  const [refusedIds, setRefusedIds] = useState([]);
  const [remainingTime, setRemainingTime] = useState(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      // Récupérer les demandes du client
      const res = await fetch('/api/demandes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const now = Date.now();
      
      // Trouver la demande active non expirée
      const active = data.find(r => {
        const isOpen = r.status === 'open';
        const createdAt = new Date(r.created_at).getTime();
        const isNotExpired = (now - createdAt) < 5 * 60 * 1000;
        return isOpen && isNotExpired;
      });
      
      if (active) {
        setActiveRequest(active);
        // Récupérer les offres pour cette demande
        const offersRes = await fetch('/api/offers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (offersRes.ok) {
          const offersData = await offersRes.json();
          // Filtrer les offres pour cette demande
          const demandOffers = offersData.filter(o => o.demande_id === active.id);
          setProposals(demandOffers);
        } else {
          setProposals([]);
        }
      } else {
        setActiveRequest(null);
        setProposals([]);
      }
      setError('');
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer pour les 5 minutes
  useEffect(() => {
    if (activeRequest?.created_at) {
      const interval = setInterval(() => {
        const created = new Date(activeRequest.created_at).getTime();
        const now = Date.now();
        const remaining = Math.max(0, 300000 - (now - created));
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          setActiveRequest(null);
          setProposals([]);
          navigate('/driver');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeRequest, navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRespond = useCallback(async (proposal, action) => {
    if (!activeRequest) {
      setError("Aucune demande active");
      return;
    }
    
    setError('');
    
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      
      console.log(`Sending ${action} for offer ${proposal.id} on demande ${activeRequest.id}`);
      
      const res = await fetch(`/api/demandes/${activeRequest.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offer_id: proposal.id, action }),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (action === 'accept') {
          setAcceptedId(proposal.id);
          setTimeout(() => {
            navigate(`/messages?contactId=${proposal.mecanicien_id}&name=${encodeURIComponent(proposal.mechanic?.name || 'Mécanicien')}`);
          }, 1500);
        } else {
          setRefusedIds((prev) => [...prev, proposal.id]);
          // Rafraîchir les données pour mettre à jour l'interface
          setTimeout(() => fetchData(), 1000);
        }
      } else {
        console.error("Error response:", data);
        setError(data.error || "Action impossible");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Erreur de connexion au serveur");
    }
  }, [activeRequest, fetchData, navigate]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
        <BackButton />
        <Sidebar role={role} />
        <main className="flex-1 p-6 lg:p-20 flex items-center justify-center">
          <div className="h-12 w-12 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!activeRequest) {
    return (
      <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
        <BackButton />
        <Sidebar role={role} />
        <main className="flex-1 p-6 lg:p-20">
          <div className="mx-auto max-w-5xl text-center">
            <Clock className="h-20 w-20 text-slate-700 mx-auto mb-6 opacity-20" />
            <h2 className="text-3xl font-black text-slate-400">Aucune demande active</h2>
            <p className="text-slate-500 mt-2">Vous n'avez pas de demande de dépannage en cours.</p>
            <button onClick={() => navigate('/driver')} className="mt-8 px-8 py-4 rounded-2xl bg-[#F4D06F] text-black font-black uppercase text-xs tracking-widest hover:bg-[#e0be53] transition">
              Retour à la carte
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
        <BackButton />
        <Sidebar role={role} />
        <main className="flex-1 p-6 lg:p-20">
          <div className="mx-auto max-w-5xl text-center">
            <Clock className="h-20 w-20 text-slate-700 mx-auto mb-6 opacity-20" />
            <h2 className="text-3xl font-black text-slate-400">Aucune offre reçue</h2>
            <p className="text-slate-500 mt-2">Les offres des mécaniciens apparaîtront ici.</p>
            {remainingTime !== null && remainingTime > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4D06F]/10 border border-[#F4D06F]/30 text-[#F4D06F]">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-black">Temps restant: {formatTime(remainingTime)}</span>
              </div>
            )}
            <button onClick={() => navigate('/driver')} className="mt-8 px-8 py-4 rounded-2xl bg-[#F4D06F] text-black font-black uppercase text-xs tracking-widest hover:bg-[#e0be53] transition">
              Retour à la carte
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-2">
                  {t('proposals') || 'Propositions'}
                </p>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
                  {t('availableMechanics') || 'Mécaniciens disponibles'}
                </h1>
              </div>
              {remainingTime !== null && remainingTime > 0 && (
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border bg-[#F4D06F]/10 border-[#F4D06F]/30 text-[#F4D06F]">
                  <Clock className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Temps restant</span>
                    <span className="text-lg font-black tabular-nums">{formatTime(remainingTime)}</span>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold text-center">
                {error}
              </div>
            )}
          </header>

          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {proposals.map((proposal) => {
                const isAccepted = acceptedId === proposal.id;
                const isRefused = refusedIds.includes(proposal.id);

                return (
                  <motion.div
                    layout
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isRefused ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative overflow-hidden rounded-[2.5rem] bg-slate-900 border transition-all duration-500 ${
                      isAccepted
                        ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20'
                        : isRefused
                        ? 'border-red-500/20'
                        : 'border-white/5'
                    }`}
                  >
                    <div className="p-8 lg:p-10">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                          <div className="h-20 w-20 rounded-3xl bg-[#F4D06F] flex items-center justify-center text-black text-3xl font-black shadow-xl">
                            {proposal.mechanic?.name?.[0] || 'M'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-2xl font-black">
                                {proposal.mechanic?.name || 'Mécanicien'}
                              </h3>
                              <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-[#F4D06F] fill-[#F4D06F]" />
                                <span className="text-white">{proposal.mechanic?.rating || '4.9'}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1.5 text-emerald-500">
                                <MapPin className="h-4 w-4" />
                                <span>À proximité</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
                            Prix proposé
                          </div>
                          <div className="text-4xl font-black text-[#F4D06F] tabular-nums">
                            {proposal.price}{' '}
                            <span className="text-lg">MAD</span>
                          </div>
                        </div>
                      </div>

                      {proposal.message && (
                        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className="text-sm text-slate-400 italic">"{proposal.message}"</p>
                        </div>
                      )}

                      <div className="mt-10 flex flex-wrap gap-4">
                        <button
                          onClick={() => handleRespond(proposal, 'accept')}
                          disabled={acceptedId !== null || isRefused}
                          className={`flex-1 min-w-[200px] h-16 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${
                            isAccepted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#F4D06F] text-black hover:bg-[#e0be53] shadow-lg shadow-[#F4D06F]/10'
                          } disabled:opacity-50`}
                        >
                          {isAccepted ? (
                            <><CheckCircle className="h-5 w-5" /> Accepté !</>
                          ) : (
                            <><CheckCircle className="h-5 w-5" /> Accepter</>
                          )}
                        </button>

                        <button
                          onClick={() => handleRespond(proposal, 'refuse')}
                          disabled={acceptedId !== null || isRefused}
                          className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all group disabled:opacity-40"
                        >
                          <XCircle className="h-6 w-6 group-hover:scale-110 transition" />
                        </button>

                        <button
                          onClick={() => navigate(`/messages?contactId=${proposal.mecanicien_id}&name=${encodeURIComponent(proposal.mechanic?.name || 'Mécanicien')}`)}
                          className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500 transition-all"
                        >
                          <MessageCircle className="h-6 w-6" />
                        </button>
                      </div>

                      {isRefused && (
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-center">
                          Proposition refusée
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}