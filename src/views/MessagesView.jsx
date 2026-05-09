import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { Search, MessageCircle, Send, Paperclip, Star, Trash2, Pin, Phone, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'motion/react';
import { allContacts } from '../utils/contactsData.js';

const conversations = [
  { id: 1001, name: 'Support WQAFT', last: 'Comment pouvons-nous vous aider ?', time: '09:12', pinned: true, blocked: false, timestamp: new Date(2026, 4, 8, 9, 12).getTime() },
  { id: 1002, name: 'Sofia (Assistance)', last: 'Votre dossier est en cours', time: '08:45', pinned: false, blocked: false, timestamp: new Date(2026, 4, 8, 8, 45).getTime() },
];

const thread = [
  { id: 1, fromMe: false, text: 'Bonjour, je suis sur place et je peux vous aider.', time: '09:10', timestamp: Date.now() - 600000 },
  { id: 2, fromMe: true, text: 'Merci, pourriez-vous estimer le tarif ?', time: '09:11', timestamp: Date.now() - 540000 },
  { id: 3, fromMe: false, text: 'Je propose 180 DH pour le remplacement de batterie.', time: '09:12', timestamp: Date.now() - 480000 },
];

export default function MessagesView() {
  const { user } = useAuth();
  const { t } = useApp();
  const role = user?.role || 'automobiliste';
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contactIdParam = searchParams.get('contactId');
  const nameParam = searchParams.get('name');
  const phoneParam = searchParams.get('phone');
  const [selectedId, setSelectedId] = useState(contactIdParam || null);
  const [message, setMessage] = useState('');
  const [threadState, setThreadState] = useState([]);
  const [conversationsState, setConversations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [file, setFile] = useState(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 1. Charger la liste des conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        const res = await fetch('/api/messages/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const apiData = await res.json();
          
          // Fusionner avec les contacts récents stockés localement (ceux visités via "Message")
          const recentLocal = JSON.parse(localStorage.getItem('wqaft_recent_contacts') || '[]');
          
          setConversations(prev => {
            const merged = [...apiData];
            recentLocal.forEach(recent => {
              if (!merged.find(c => String(c.id) === String(recent.id))) {
                merged.push(recent);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Erreur chargement conversations:", err);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Rafraîchir toutes les 10s
    return () => clearInterval(interval);
  }, []);

  // 2. Charger le thread quand on sélectionne un contact
  useEffect(() => {
    const fetchThread = async () => {
      if (!selectedId) return;
      try {
        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        const res = await fetch(`/api/messages/${selectedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setThreadState(data.map(m => ({
            id: m.id,
            fromMe: String(m.sender_id || m.user_id) === String(user.id),
            text: m.message || m.content || '',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.created_at).getTime(),
            type: m.message_type || 'text'
          })));
          
          // Marquer comme lu
          fetch(`/api/messages/read-all/${selectedId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      }
    };

    fetchThread();
    const interval = setInterval(fetchThread, 5000); // Rafraîchir toutes les 5s
    return () => clearInterval(interval);
  }, [selectedId]);

  // Synchroniser selectedId avec l'URL quand le paramètre change
  useEffect(() => {
    if (contactIdParam) {
      setSelectedId(contactIdParam);
    }
  }, [contactIdParam]);

  useEffect(() => {
    const fetchUnknownContact = async (id, fallbackName, fallbackPhone) => {
      try {
        setIsLoadingContact(true);
        setContactError('');

        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        const res = await fetch(`/api/user/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error(`Erreur API: ${res.status}`);

        const data = await res.json();
        const contact = data.user;
        
        if (!contact) throw new Error("Contact introuvable dans la réponse");

        // Sauvegarder dans les contacts récents pour la persistance locale
        const recent = JSON.parse(localStorage.getItem('wqaft_recent_contacts') || '[]');
        if (!recent.find(c => String(c.id) === String(id))) {
          recent.push({
            id: id,
            name: contact.name,
            phone: contact.phone || '',
            last: 'Nouvelle discussion',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now()
          });
          localStorage.setItem('wqaft_recent_contacts', JSON.stringify(recent));
        }

        // Mettre à jour la conversation avec les vraies données de l'API
        setConversations(prev => prev.map(c => 
          String(c.id) === String(id) 
            ? { ...c, name: contact.name, phone: contact.phone || c.phone, photo: contact.photo }
            : c
        ));
      } catch (err) {
        console.error("Erreur fetchUnknownContact:", err);
      } finally {
        setIsLoadingContact(false);
      }
    };

    if (contactIdParam) {
      const id = contactIdParam;
      const existing = conversationsState.find(c => String(c.id) === String(id));
      
      if (!existing) {
        const tempConv = {
          id: id,
          name: nameParam || 'Nouveau contact',
          last: 'Nouvelle discussion',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pinned: false,
          blocked: false,
          timestamp: Date.now(),
          phone: phoneParam || ''
        };

        setConversations(prev => {
          if (prev.find(c => String(c.id) === String(id))) return prev;
          return [tempConv, ...prev];
        });

        // Ajouter au localStorage pour persistance immédiate sans message
        const recent = JSON.parse(localStorage.getItem('wqaft_recent_contacts') || '[]');
        if (!recent.find(c => String(c.id) === String(id))) {
          recent.push(tempConv);
          localStorage.setItem('wqaft_recent_contacts', JSON.stringify(recent));
        }

        fetchUnknownContact(id, nameParam, phoneParam);
      }
    }
  }, [contactIdParam, nameParam, phoneParam, conversationsState.length]);

  const sortedConversations = useMemo(() => {
    return [...conversationsState].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [conversationsState]);

  const filtered = useMemo(() => sortedConversations.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [search, sortedConversations]);
  const selected = selectedId ? conversationsState.find((item) => String(item.id) === String(selectedId)) : null;

  const handleEditMessage = (id, text) => {
    setEditingId(id);
    setEditValue(text);
  };

  const handleSaveEdit = (id) => {
    setThreadState(prev => prev.map(m => m.id === id ? { ...m, text: editValue, edited: true } : m));
    setEditingId(null);
    setEditValue('');
  };

  const handleDeleteMessage = (id) => {
    setThreadState(prev => prev.map(m => m.id === id ? { ...m, text: 'Message supprimé', deleted: true } : m));
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-hidden">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[360px_1fr] h-[calc(100vh-80px)]">
          {/* Conversation List */}
          <div className="rounded-[2.5rem] bg-slate-900/40 p-6 border border-slate-800/50 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="mb-6 flex items-center justify-between gap-4 px-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">{t('messages')}</p>
                <h1 className="text-3xl font-black">{t('conversations')}</h1>
              </div>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('searchPlaceholder')} 
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-11 py-4 outline-none text-slate-200 focus:border-[#F4D06F] transition" 
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {filtered.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => setSelectedId(item.id)} 
                  className={`w-full rounded-[1.5rem] p-4 text-left transition-all duration-300 border ${
                    item.id === selectedId 
                    ? 'bg-[#F4D06F]/10 border-[#F4D06F]/30 ring-1 ring-[#F4D06F]/30' 
                    : 'bg-slate-900/50 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#F4D06F] text-black flex items-center justify-center font-black text-lg overflow-hidden border border-white/5 shadow-lg">
                      {item.photo ? (
                        <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        item.name[0]
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-base font-black truncate ${item.id === selectedId ? 'text-[#F4D06F]' : 'text-white'}`}>{item.name}</p>
                        <p className="shrink-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.time}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-400 truncate mt-0.5">{item.last}</p>
                        {item.pinned && <Pin className="h-3 w-3 text-[#F4D06F] shrink-0" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Discussion Area */}
          <section className="rounded-[2.5rem] bg-slate-900/40 p-8 border border-slate-800/50 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-800/50 pb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-14 w-14 rounded-2xl bg-[#F4D06F] text-black flex items-center justify-center font-black text-xl cursor-pointer hover:scale-105 transition overflow-hidden border border-white/10 shadow-xl"
                      onClick={() => navigate(`/mechanic/${selected.id}`)}
                    >
                      {selected.photo ? (
                        <img src={selected.photo} alt={selected.name} className="h-full w-full object-cover" />
                      ) : (
                        selected.name[0]
                      )}
                    </div>
                    <div 
                      className="cursor-pointer group select-none"
                      onClick={() => navigate(`/mechanic/${selected.id}`)}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F] group-hover:translate-x-1 transition-transform">{t('discussion')}</p>
                      <h1 className="text-3xl font-black group-hover:text-[#F4D06F] transition-all flex items-center gap-2">
                        {selected.name}
                        <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, blocked: !c.blocked } : c))} 
                      className={`h-12 px-4 flex items-center justify-center rounded-2xl transition border font-bold text-xs uppercase tracking-widest ${selected.blocked ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-red-500'}`}
                    >
                      {selected.blocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                    <button onClick={() => window.open(`tel:${selected.phone || '0600000000'}`)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-slate-400 hover:text-green-400 transition border border-slate-800">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button onClick={() => setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, pinned: !c.pinned } : c))} className={`h-12 w-12 flex items-center justify-center rounded-2xl transition border ${selected.pinned ? 'bg-[#F4D06F]/10 border-[#F4D06F] text-[#F4D06F]' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-[#F4D06F]'}`}>
                      <Pin className="h-5 w-5" />
                    </button>
                    {role === 'automobiliste' && (
                      <button 
                        onClick={() => setShowReviewModal(true)}
                        className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-white transition shadow-lg shadow-emerald-500/10"
                      >
                        <Star className="h-4 w-4 fill-current" /> Laisser un avis
                      </button>
                    )}
                    <button onClick={() => setShowDeleteConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-slate-400 hover:text-red-400 transition border border-slate-800">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
                  {threadState.map((msg) => {
                    const isEditable = msg.fromMe && (Date.now() - (msg.timestamp || 0)) < 900000 && !msg.deleted;
                    return (
                      <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} group/msg`}>
                        <div className={`relative max-w-[80%] rounded-[1.5rem] p-5 shadow-sm ${
                          msg.fromMe 
                          ? 'bg-[#F4D06F] text-black font-medium rounded-tr-none' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        } ${msg.deleted ? 'opacity-50 italic' : ''}`}>
                          {editingId === msg.id ? (
                            <div className="space-y-3">
                              <textarea 
                                value={editValue} 
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-black/10 rounded-xl p-2 outline-none text-black font-bold resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingId(null)} className="text-[10px] uppercase font-black">Annuler</button>
                                <button onClick={() => handleSaveEdit(msg.id)} className="text-[10px] uppercase font-black bg-black text-[#F4D06F] px-3 py-1 rounded-lg">Enregistrer</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          )}
                          
                          {msg.type === 'request_review' && !msg.fromMe && role === 'automobiliste' && (
                            <button 
                              onClick={() => setShowReviewModal(true)}
                              className="mt-4 w-full py-3 rounded-xl bg-black text-[#F4D06F] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <Star className="h-4 w-4 fill-current" /> Laisser mon avis
                            </button>
                          )}

                          {msg.fromMe && !msg.deleted && !editingId && (
                            <div className="absolute -left-20 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                              {isEditable && (
                                <button onClick={() => handleEditMessage(msg.id, msg.text)} className="p-2 bg-slate-800 rounded-full hover:text-[#F4D06F]">
                                  <Star className="h-4 w-4" /> {/* Use Star as Edit for simplicity or find another icon */}
                                </button>
                              )}
                              <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 bg-slate-800 rounded-full hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                          {msg.time} {msg.edited && '• modifié'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {selected.blocked ? (
                    <div className="rounded-[2rem] bg-red-500/10 border border-red-500/30 p-6 text-center text-red-200 text-sm font-bold">
                      Vous avez bloqué ce contact. Veuillez le débloquer pour envoyer un message.
                    </div>
                  ) : (
                    <form
                      className="flex items-center gap-3 rounded-[2rem] border border-slate-800 bg-slate-950 p-3 shadow-xl"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!message.trim() && !file) return;

                        const content = message.trim();
                        const currentMessage = message; // Sauvegarde en cas d'échec
                        setMessage(''); // Effacer pour UX fluide

                        try {
                          const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
                          const res = await fetch('/api/messages', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                              receiver_id: selectedId,
                              message: content
                            })
                          });

                          if (res.ok) {
                            const newMsg = await res.json();
                            setThreadState(prev => [
                              ...prev,
                              {
                                id: newMsg.id,
                                fromMe: true,
                                text: content,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                timestamp: Date.now()
                              }
                            ]);
                          } else {
                            const errData = await res.json();
                            console.error("Erreur API envoi:", errData.error);
                            alert("Erreur lors de l'envoi du message: " + errData.error);
                            setMessage(currentMessage); // Restaurer le texte
                          }
                        } catch (err) {
                          console.error("Erreur réseau envoi:", err);
                          alert("Erreur réseau lors de l'envoi du message.");
                          setMessage(currentMessage);
                        }
                      }}
                    >
                      <input type="file" id="file-input" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                      <button type="button" onClick={() => document.getElementById('file-input').click()} className="h-12 w-12 flex items-center justify-center rounded-[1.5rem] bg-slate-900 text-slate-400 hover:bg-slate-800 transition border border-slate-800">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <input 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder={t('writeMessage')} 
                        className="flex-1 bg-transparent px-2 outline-none text-white placeholder:text-slate-600" 
                      />
                      <button type="submit" disabled={!message.trim()} className="h-12 px-6 flex items-center gap-2 rounded-[1.5rem] bg-[#F4D06F] text-black font-black uppercase text-xs tracking-widest hover:bg-[#e0be53] transition shadow-lg shadow-[#F4D06F]/10 disabled:opacity-50">
                        <Send className="h-4 w-4" /> {t('send')}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                {isLoadingContact ? (
                  <>
                    <div className="h-12 w-12 border-4 border-[#F4D06F] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-black uppercase tracking-[0.35em] text-[#F4D06F]">Chargement du contact...</p>
                  </>
                ) : contactError ? (
                  <>
                    <div className="h-12 w-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.35em] text-red-400">{contactError}</p>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-20 w-20 mb-4 opacity-10" />
                    <p className="text-sm font-black uppercase tracking-[0.35em]">{t('selectConversation') || 'Sélectionnez une conversation'}</p>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl border border-slate-800"
            >
              <h3 className="text-2xl font-black text-white">{t('confirmDelete')}</h3>
              <p className="mt-4 text-slate-500">{t('deleteConversationMsg')}</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-2xl border border-slate-800 px-6 py-4 text-sm font-black uppercase text-slate-500 hover:text-white transition">{t('cancel')}</button>
                <button onClick={() => { setConversations(prev => prev.filter(c => c.id !== selectedId)); setSelectedId(null); setShowDeleteConfirm(false); }} className="flex-1 rounded-2xl bg-red-600 px-6 py-4 text-sm font-black uppercase text-white hover:bg-red-500 transition">
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-[3rem] bg-slate-950 p-10 shadow-2xl border border-emerald-500/20 relative overflow-hidden"
            >
              <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]"></div>
              
              <div className="mb-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Star className="h-10 w-10 fill-current" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">Evaluation</p>
                <h3 className="mt-2 text-3xl font-black text-white">Votre avis compte</h3>
                <p className="mt-2 text-slate-400">Comment s'est passée votre expérience avec {selected?.name} ?</p>
              </div>

              <div className="space-y-8">
                {/* Stars Selection */}
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                        star <= reviewRating ? 'bg-[#F4D06F] text-black scale-110 shadow-lg shadow-[#F4D06F]/20' : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Commentaire (optionnel)</label>
                  <textarea 
                    placeholder="Partagez votre expérience..." 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-6 py-4 text-white outline-none focus:border-emerald-500 transition resize-none h-32" 
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setShowReviewModal(false)} 
                  className="flex-1 rounded-2xl border border-slate-800 px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition"
                >
                  Annuler
                </button>
                <button 
                  disabled={isSubmittingReview}
                  onClick={async () => {
                    setIsSubmittingReview(true);
                    try {
                      const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
                      const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                          mechanic_id: selectedId,
                          rating: reviewRating,
                          comment: reviewComment
                        })
                      });
                      
                      if (res.ok) {
                        alert("Merci pour votre avis !");
                        setShowReviewModal(false);
                        setReviewComment('');
                        setReviewRating(5);
                      } else {
                        const err = await res.json();
                        alert("Erreur: " + (err.error || "Impossible d'envoyer l'avis"));
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Erreur réseau");
                    } finally {
                      setIsSubmittingReview(false);
                    }
                  }} 
                  className="flex-1 rounded-2xl bg-emerald-500 px-8 py-5 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition shadow-2xl shadow-emerald-500/20"
                >
                  {isSubmittingReview ? 'Envoi...' : 'Publier l\'avis'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
