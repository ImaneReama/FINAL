import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, MessageSquare, Clock, Car, X, AlertTriangle,
  DollarSign, FileText, CheckCircle, XCircle, RefreshCw, Phone, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';

// ── Timer par demande ────────────────────────────────────────
const RequestTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculate = () => {
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) onExpire?.();
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft === null) return null;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black tabular-nums
      ${timeLeft < 60
        ? 'bg-red-500/10 border-red-500/30 text-red-500'
        : 'bg-[#F4D06F]/10 border-[#F4D06F]/30 text-[#F4D06F]'}`}
    >
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
  const isMec = ['mecanicien', 'mechanic', 'pro'].includes(role.toLowerCase());

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myOffers, setMyOffers] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProposal, setPriceProposal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [detailRequest, setDetailRequest] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    try {
      const [resDem, resInt] = await Promise.all([
        fetch('/api/demandes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/interventions', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resDem.ok) {
        let data = await resDem.json();
        const now = Date.now();
        data = data.filter(req => {
          const createdAt = new Date(req.created_at).getTime();
          return (now - createdAt) < 5 * 60 * 1000;
        });
        setRequests(data);
      }

      if (resInt.ok) {
        const interventionsData = await resInt.json();
        const offersMap = {};
        interventionsData.forEach(item => {
          if (!item.demande_id) return;
          const key = String(item.demande_id);
          const existing = offersMap[key];
          if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
            offersMap[key] = { ...item, price: item.budget || item.price };
          }
        });
        setMyOffers(offersMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const openChat = (id, name) => navigate(`/messages?contactId=${id}&name=${encodeURIComponent(name)}`);
  const handleExpire = (reqId) => setRequests(prev => prev.filter(r => r.id !== reqId));

  const openPriceModal = (req) => {
    setSelectedRequest(req);
    setPriceProposal('');
    setSubmitError('');
    setShowPriceModal(true);
  };

  const handleProposePrice = async () => {
    if (!selectedRequest || !priceProposal) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ demande_id: selectedRequest.id, price: parseFloat(priceProposal) })
      });
      const json = await res.json();
      if (res.ok) {
        setShowPriceModal(false);
        setSelectedRequest(null);
        setPriceProposal('');
        fetchData();
      } else {
        setSubmitError(json.error || "Erreur lors de l'envoi.");
      }
    } catch {
      setSubmitError("Erreur réseau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUPPRIMÉ : containerStyle avec scale(0.6) - Interface normale maintenant !
  // L'interface mécanicien ressemble maintenant à celle de l'automobiliste

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div className="flex h-full w-full">
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
              ) : requests.length === 0 ? (
                <div className="bg-slate-900/20 rounded-[3rem] p-24 text-center border-2 border-dashed border-white/5">
                  <AlertTriangle className="h-12 w-12 text-slate-700 mx-auto mb-6 opacity-20" />
                  <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Aucune demande active à proximité</p>
                  <button
                    onClick={fetchData}
                    className="mt-8 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#F4D06F] hover:bg-[#F4D06F] hover:text-black transition flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" /> Réactualiser
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {requests.map((req) => {
                    const myOffer = myOffers[String(req.id)];
                    const isPending = myOffer?.status === 'pending';
                    const isAccepted = myOffer?.status === 'accepted';
                    const isRejected = myOffer?.status === 'rejected' || myOffer?.status === 'refused';
                    const canRepropose = isRejected;
                    const expiresAt = req.expires_at || (new Date(req.created_at).getTime() + 5 * 60 * 1000);
                    const breakdownPhoto = req.image_url || req.photo || null;

                    return (
                      <motion.div
                        key={req.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`bg-slate-900/40 rounded-[2.5rem] p-8 border backdrop-blur-xl shadow-2xl transition-all duration-300
                          ${isAccepted ? 'border-emerald-500/40' : isRejected ? 'border-red-500/20' : 'border-white/5 hover:border-[#F4D06F]/20'}`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-5 items-center">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-[#F4D06F] flex items-center justify-center font-black text-black text-xl shadow-lg overflow-hidden">
                              {req.client?.photo ? (
                                <img src={req.client.photo} alt={req.client.name} className="h-full w-full object-cover" />
                              ) : (
                                req.client?.name?.[0] || 'D'
                              )}
                            </div>
                            <div>
                              <p className="font-black text-white text-lg">{req.client?.name || 'Automobiliste'}</p>
                              <p className="text-xs text-slate-500 font-bold mt-0.5">{req.category}</p>
                            </div>
                          </div>
                          <RequestTimer expiresAt={expiresAt} onExpire={() => handleExpire(req.id)} />
                        </div>

                        {/* Photo aperçu rapide */}
                        {breakdownPhoto && (
                          <button
                            onClick={() => setLightboxPhoto(breakdownPhoto)}
                            className="w-full mb-4 rounded-2xl overflow-hidden border border-white/10 hover:border-[#F4D06F]/40 transition group relative"
                          >
                            <img
                              src={breakdownPhoto}
                              alt="Photo panne"
                              className="w-full h-32 object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                          </button>
                        )}

                        {/* Description courte */}
                        {req.description && (
                          <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">{req.description}</p>
                        )}

                        {/* Statut de ma proposition */}
                        {myOffer && (
                          <div className="mb-5">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black ${
                              myOffer.status === 'pending' 
                                ? 'bg-[#F4D06F]/10 border-[#F4D06F]/30 text-[#F4D06F]'
                                : myOffer.status === 'accepted'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}>
                              {myOffer.status === 'pending' && <Clock className="w-3 h-3" />}
                              {myOffer.status === 'accepted' && <CheckCircle className="w-3 h-3" />}
                              {myOffer.status === 'refused' && <XCircle className="w-3 h-3" />}
                              {myOffer.status === 'pending' && `En attente · ${myOffer.price} MAD`}
                              {myOffer.status === 'accepted' && 'Acceptée ✓'}
                              {myOffer.status === 'refused' && 'Refusée — vous pouvez reproposer'}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => openPriceModal(req)}
                            disabled={isPending || isAccepted}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                              ${isPending || isAccepted
                                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                                : canRepropose
                                  ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-black'
                                  : 'bg-[#F4D06F] text-black hover:bg-[#e0be53] shadow-lg shadow-[#F4D06F]/10'
                              }`}
                          >
                            <DollarSign className="w-4 h-4" />
                            {isPending
                              ? `En attente · ${myOffer?.price} MAD`
                              : canRepropose
                                ? 'Reproposer un prix'
                                : isAccepted
                                  ? 'Déjà acceptée'
                                  : 'Proposer un prix'}
                          </button>

                          <button
                            onClick={() => setDetailRequest(req)}
                            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-white transition"
                          >
                            <FileText className="w-4 h-4" /> Détails
                          </button>

                          <button
                            onClick={() => openChat(req.client_id, req.client?.name)}
                            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-white transition"
                          >
                            <MessageSquare className="w-4 h-4" /> Message
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Modal Proposer Prix ────────────────────────────────── */}
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-[3rem] bg-slate-950 p-10 shadow-2xl border border-[#F4D06F]/20"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-white">
                    {myOffers[String(selectedRequest?.id)]?.status === 'rejected' ? 'Nouveau prix' : 'Proposer un prix'}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {selectedRequest?.category} · {selectedRequest?.client?.name || 'Client'}
                  </p>
                </div>
                <button
                  onClick={() => { setShowPriceModal(false); setPriceProposal(''); setSubmitError(''); }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-6">
                <input
                  type="number"
                  value={priceProposal}
                  onChange={(e) => setPriceProposal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-3xl font-black text-[#F4D06F] outline-none focus:border-[#F4D06F] transition"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">MAD</span>
              </div>

              {submitError && (
                <p className="mb-4 text-center text-sm font-bold text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{submitError}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowPriceModal(false); setPriceProposal(''); setSubmitError(''); }}
                  className="flex-1 py-5 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  disabled={isSubmitting || !priceProposal}
                  onClick={handleProposePrice}
                  className="flex-1 py-5 rounded-2xl bg-[#F4D06F] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#e0be53] transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Détails ──────────────────────────────────────── */}
      <AnimatePresence>
        {detailRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl border border-white/10 my-4"
            >
              <div className="h-28 bg-gradient-to-br from-[#F4D06F]/20 via-[#F4D06F]/5 to-transparent relative">
                <button
                  onClick={() => setDetailRequest(null)}
                  className="absolute right-6 top-6 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-slate-400 hover:text-white transition border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 pb-8 -mt-14">
                <div className="flex items-end gap-5 mb-6">
                  <div className="h-24 w-24 rounded-[1.5rem] bg-slate-800 border-4 border-slate-900 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
                    {detailRequest.client?.photo ? (
                      <img src={detailRequest.client.photo} alt={detailRequest.client.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-slate-500">{(detailRequest.client?.name || 'A')[0]}</span>
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F4D06F] mb-1">Automobiliste</p>
                    <h3 className="text-2xl font-black text-white">{detailRequest.client?.name || 'Client'}</h3>
                    {detailRequest.client?.city && <p className="text-xs text-slate-400 font-bold mt-0.5">{detailRequest.client.city}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  {detailRequest.image_url && (
                    <button
                      onClick={() => setLightboxPhoto(detailRequest.image_url)}
                      className="w-full rounded-2xl overflow-hidden border border-white/10 hover:border-[#F4D06F]/40 transition group relative"
                    >
                      <img
                        src={detailRequest.image_url}
                        alt="Photo de la panne"
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3" /> Photo de la panne
                      </div>
                    </button>
                  )}

                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Type de panne</p>
                      <p className="text-sm font-black text-white">{detailRequest.category}</p>
                    </div>
                  </div>

                  {detailRequest.description && (
                    <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <FileText className="w-5 h-5 text-[#F4D06F] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{detailRequest.description}</p>
                      </div>
                    </div>
                  )}

                  {detailRequest.client?.phone && (
                    <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Téléphone</p>
                        <p className="text-sm font-black text-white">{detailRequest.client.phone}</p>
                      </div>
                    </div>
                  )}

                  {(detailRequest.address || detailRequest.client?.address) && (
                    <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Localisation</p>
                        <p className="text-sm font-bold text-white">{detailRequest.address || detailRequest.client?.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => { setDetailRequest(null); openPriceModal(detailRequest); }}
                    className="py-4 rounded-2xl bg-[#F4D06F] text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" /> Proposer
                  </button>
                  <button
                    onClick={() => { setDetailRequest(null); openChat(detailRequest.client_id, detailRequest.client?.name); }}
                    className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
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