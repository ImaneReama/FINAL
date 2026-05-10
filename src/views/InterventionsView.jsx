import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, DollarSign, Star, Eye, MessageCircle, X, AlertTriangle, Phone, Car, MapPin, FileText, Clock, User as UserIcon, ShieldCheck, XCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function InterventionsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'mecanicien';
  const isMec = ['mecanicien', 'mechanic', 'pro'].includes(role.toLowerCase());
  
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // For lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Feedback for "Demander un avis" button
  const [reviewSentIds, setReviewSentIds] = useState([]);
  const [reviewSending, setReviewSending] = useState(null);

  const fetchInterventions = async () => {
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch('/api/interventions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(item => 
          item.status === 'accepted' || 
          item.status === 'completed' || 
          item.status === 'en cours' ||
          item.status === 'cancelled' ||
          (item.status === 'rejected' && item.was_accepted === true)
        );

        const parseVehicle = (v) => {
          if (!v) return {};
          if (typeof v === 'object') return v;
          try { return JSON.parse(v); } catch { return {}; }
        };

        setInterventions(filtered.map(item => {
          const clientData = item.client || item.demande?.client || {};
          const vehicleRaw = clientData.vehicle || clientData.vehicle_info || item.demande?.vehicle || null;
          const vehicleInfo = parseVehicle(vehicleRaw);
          // Photo de la panne depuis la demande
          const breakdownPhoto = item.demande?.image_url || item.demande?.photo || item.photo || null;

          return {
            ...item,
            client_id: item.client_id || item.receiver_id || item.demande?.client_id,
            name: clientData.name || item.demande?.client?.name || 'Client',
            photo: clientData.photo || item.demande?.client?.photo || null,
            phone: clientData.phone || item.demande?.client?.phone || null,
            issue: item.demande?.category || item.description || 'Panne',
            displayStatus: item.status === 'en cours' ? 'En intervention' : 
                           item.status === 'accepted' ? 'Acceptée' :
                           item.status === 'completed' ? 'Terminée' : 
                           item.status === 'cancelled' ? 'Annulée' :
                           item.status === 'rejected' ? 'Annulée' : item.status,
            date: new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
            time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: item.budget || item.price || item.final_price || '—',
            description: item.demande?.description || item.content || null,
            address: item.demande?.address || clientData.address || 'Adresse non spécifiée',
            vehicleInfo,
            breakdownPhoto,
          };
        }));
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
    if (!window.confirm("Marquer cette intervention comme terminée ?")) return;
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/interventions/${id}/finish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchInterventions();
    } catch (err) { console.error(err); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette intervention ?")) return;
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch(`/api/offers/${id}/refuse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchInterventions();
    } catch (err) { console.error(err); }
  };

  const handleOpenDetail = (item) => {
    setSelectedIntervention(item);
    setShowDetailModal(true);
  };

  // "Demander un avis" — envoie un message au client
  const handleAskReview = async (item) => {
    const clientId = item.client_id;
    if (!clientId || reviewSentIds.includes(item.id)) return;
    setReviewSending(item.id);
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const message = `Bonjour ${item.name} 👋 Merci de m'avoir fait confiance pour votre dépannage (${item.issue}). Votre avis m'aide à améliorer mon service et à aider d'autres automobilistes. Pourriez-vous prendre un moment pour laisser un avis ? Merci beaucoup ! 🙏`;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: clientId, message }),
      });
      if (res.ok) {
        setReviewSentIds(prev => [...prev, item.id]);
        // Also navigate to the chat after a short delay
        setTimeout(() => {
          navigate(`/messages?contactId=${clientId}&name=${encodeURIComponent(item.name)}`);
        }, 800);
      }
    } catch (err) {
      console.error('Failed to send review request:', err);
    } finally {
      setReviewSending(null);
    }
  };

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
              <header className="mb-16">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-2">Tableau de bord</p>
                <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-white">Mes Interventions</h1>
              </header>

              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-12 w-12 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : interventions.length === 0 ? (
                <div className="rounded-[4rem] bg-slate-900/50 p-24 text-center border border-white/5 backdrop-blur-xl">
                  <CalendarCheck className="mx-auto h-24 w-24 text-slate-700 mb-8 opacity-20" />
                  <h2 className="text-3xl font-black text-slate-400">Aucune intervention active</h2>
                  <p className="text-slate-500 mt-3 text-lg">Acceptez une demande pour commencer.</p>
                </div>
              ) : (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {interventions.map((item) => (
                    <motion.article 
                      layout
                      key={item.id} 
                      className="group relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 hover:border-[#F4D06F]/30 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
                    >
                      {/* Badge Statut */}
                      <div className="absolute top-8 right-8 z-10">
                        <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border
                          ${item.status === 'en cours' || item.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            item.status === 'completed' ? 'bg-[#F4D06F]/10 text-[#F4D06F] border-[#F4D06F]/20' : 
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {item.displayStatus}
                        </div>
                      </div>

                      {/* Photo de la panne (thumbnail) */}
                      {item.breakdownPhoto && (
                        <button
                          onClick={() => setLightboxPhoto(item.breakdownPhoto)}
                          className="w-full h-36 overflow-hidden relative block"
                        >
                          <img
                            src={item.breakdownPhoto}
                            alt="Photo panne"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white text-[9px] font-black uppercase tracking-widest">
                            <ImageIcon className="w-3.5 h-3.5" /> Photo de la panne
                          </div>
                        </button>
                      )}

                      <div className="p-10">
                        {/* Header Fiche: Photo & Nom */}
                        <div className="flex items-center gap-6 mb-8">
                          <div className="relative group/photo">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-800 border-2 border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                              {item.photo ? (
                                <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <UserIcon className="h-10 w-10 text-slate-600" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#F4D06F] mb-0.5">{item.date}</p>
                            <p className="text-[9px] font-bold text-slate-500 mb-1">{item.time}</p>
                            <h3 className="text-xl font-black text-white group-hover:text-[#F4D06F] transition-colors line-clamp-1">{item.name}</h3>
                          </div>
                        </div>

                        {/* Content: Type de panne & Prix */}
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-4 w-4 text-orange-400" />
                              <span className="text-sm font-bold text-slate-400">Panne</span>
                            </div>
                            <span className="text-sm font-black text-white">{item.issue}</span>
                          </div>
                          <div className="flex items-center justify-between p-5 rounded-2xl bg-[#F4D06F]/5 border border-[#F4D06F]/10">
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-[#F4D06F]" />
                              <span className="text-sm font-bold text-[#F4D06F]">Budget</span>
                            </div>
                            <span className="text-2xl font-black text-[#F4D06F]">{item.price} MAD</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleOpenDetail(item)}
                            className="col-span-2 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" /> Détails de l'intervention
                          </button>
                          
                          {(item.status === 'en cours' || item.status === 'accepted') && (
                            <>
                              <button 
                                onClick={() => handleFinish(item.id)}
                                className="py-5 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" /> Terminé
                              </button>
                              <button 
                                onClick={() => handleCancel(item.id)}
                                className="py-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                              >
                                <XCircle className="h-4 w-4" /> Annuler
                              </button>
                            </>
                          )}

                          {/* Demander un avis — visible après complétion */}
                          {item.status === 'completed' && (
                            <button
                              onClick={() => handleAskReview(item)}
                              disabled={reviewSentIds.includes(item.id) || reviewSending === item.id}
                              className={`col-span-2 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2
                                ${reviewSentIds.includes(item.id)
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                  : 'bg-[#F4D06F]/10 border border-[#F4D06F]/20 text-[#F4D06F] hover:bg-[#F4D06F] hover:text-black'
                                }`}
                            >
                              {reviewSentIds.includes(item.id) ? (
                                <><CheckCircle className="h-4 w-4" /> Demande envoyée !</>
                              ) : reviewSending === item.id ? (
                                <><div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Envoi...</>
                              ) : (
                                <><Star className="h-4 w-4" /> Demander un avis</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDetailModal && selectedIntervention && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[4rem] border border-white/10 bg-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] my-4"
            >
              {/* Top photo or gradient */}
              {selectedIntervention.breakdownPhoto ? (
                <button
                  onClick={() => setLightboxPhoto(selectedIntervention.breakdownPhoto)}
                  className="w-full h-56 overflow-hidden relative block"
                >
                  <img
                    src={selectedIntervention.breakdownPhoto}
                    alt="Photo de la panne"
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
                  <div className="absolute bottom-4 left-8 flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest">
                    <ImageIcon className="w-3.5 h-3.5" /> Photo de la panne · Cliquer pour agrandir
                  </div>
                </button>
              ) : (
                <div className="h-48 bg-gradient-to-br from-[#F4D06F]/30 via-[#F4D06F]/5 to-transparent" />
              )}

              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute right-8 top-8 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition border border-white/10 backdrop-blur-md"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="px-12 pb-12">
                <div className="relative -mt-20 mb-8 flex justify-center">
                  <div className="h-40 w-48 rounded-[3rem] bg-slate-800 border-[6px] border-slate-900 flex items-center justify-center overflow-hidden shadow-2xl">
                    {selectedIntervention.photo ? (
                      <img src={selectedIntervention.photo} alt={selectedIntervention.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-20 w-20 text-slate-600" />
                    )}
                  </div>
                </div>

                <div className="text-center mb-10">
                  <h3 className="text-4xl font-black text-white mb-2">{selectedIntervention.name}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">{selectedIntervention.displayStatus}</p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Client info section */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Informations Client</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  </div>
                  
                  <div className="rounded-[2rem] bg-white/5 border border-white/5 p-6 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-4 text-[#F4D06F] mb-3">
                      <Phone className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Contact Direct</span>
                    </div>
                    <p className="text-lg font-black text-white">{selectedIntervention.phone || 'Non renseigné'}</p>
                  </div>

                  <div className="rounded-[2rem] bg-white/5 border border-white/5 p-6 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-4 text-emerald-400 mb-3">
                      <MapPin className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Lieu exact</span>
                    </div>
                    <p className="text-sm font-bold text-white line-clamp-2">{selectedIntervention.address}</p>
                  </div>

                  {/* Véhicule */}
                  <div className="col-span-2 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Détails du véhicule</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-white/5 border border-white/5 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Car className="h-6 w-6 text-blue-400" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Marque & Modèle</p>
                        <p className="font-black text-white">
                          {selectedIntervention.vehicleInfo?.brand || 'N/A'} {selectedIntervention.vehicleInfo?.model || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-white/5 border border-white/5 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Immatriculation</p>
                        <p className="font-black text-white">{selectedIntervention.vehicleInfo?.licensePlate || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Détails intervention */}
                  <div className="col-span-2 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Détails Intervention</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  </div>

                  <div className="rounded-[2.5rem] bg-white/5 border border-white/5 p-8 sm:col-span-2">
                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Date</p>
                        <p className="text-sm font-black text-white">{selectedIntervention.date}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Heure</p>
                        <p className="text-lg font-black text-[#F4D06F]">{selectedIntervention.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Prix Convenu</p>
                        <p className="text-xl font-black text-[#F4D06F]">{selectedIntervention.price} MAD</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Type de panne</p>
                        <p className="font-black text-white">{selectedIntervention.issue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Statut</p>
                        <p className="text-sm font-black text-emerald-500 uppercase">{selectedIntervention.displayStatus}</p>
                      </div>
                    </div>
                    {selectedIntervention.description && (
                      <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Notes de la demande</p>
                        <p className="text-sm text-slate-400 leading-relaxed italic">"{selectedIntervention.description}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-12 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.open(`tel:${selectedIntervention.phone}`)}
                      className="flex-1 h-20 rounded-3xl bg-[#F4D06F] text-black font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition shadow-2xl shadow-[#F4D06F]/20"
                    >
                      <Phone className="h-5 w-5" /> Appeler le client
                    </button>
                    <button 
                      onClick={() => handleSendMessage(selectedIntervention)}
                      className="flex-1 h-20 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition"
                    >
                      <MessageCircle className="h-5 w-5" /> Envoyer un message
                    </button>
                  </div>

                  {/* Demander un avis — dans le modal aussi */}
                  {selectedIntervention.status === 'completed' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleAskReview(selectedIntervention);
                      }}
                      disabled={reviewSentIds.includes(selectedIntervention.id) || reviewSending === selectedIntervention.id}
                      className={`w-full h-16 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition
                        ${reviewSentIds.includes(selectedIntervention.id)
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                          : 'bg-[#F4D06F]/10 border border-[#F4D06F]/30 text-[#F4D06F] hover:bg-[#F4D06F] hover:text-black'
                        }`}
                    >
                      {reviewSentIds.includes(selectedIntervention.id) ? (
                        <><CheckCircle className="h-5 w-5" /> Demande d'avis envoyée !</>
                      ) : (
                        <><Star className="h-5 w-5" /> Demander un avis</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Lightbox photo ─────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
              onClick={() => setLightboxPhoto(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxPhoto}
              alt="Photo panne agrandie"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}