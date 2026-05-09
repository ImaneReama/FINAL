import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Users, Settings, FileText, Heart, ShieldCheck, Menu, X, ArrowLeft, LogOut, Sparkles, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { motion, AnimatePresence } from 'motion/react';

const itemsByRole = (t) => ({
  automobiliste: [
    { path: '/driver', label: t('home'), icon: Home },
    { path: '/proposals', label: t('proposals'), icon: Sparkles },
    { path: '/contacts', label: t('contacts'), icon: Users },
    { path: '/messages', label: t('messages'), icon: MessageCircle },
    { path: '/profile', label: t('profile'), icon: User },
    { path: '/settings', label: t('settings'), icon: Settings },
  ],
  mecanicien: [
    { path: '/mechanic', label: t('home'), icon: Home },
    { path: '/requests', label: t('requests'), icon: FileText },
    { path: '/interventions', label: t('interventions'), icon: Heart },
    { path: '/messages', label: t('messages'), icon: MessageCircle },
    { path: '/profile', label: t('profile'), icon: User },
    { path: '/settings', label: t('settings'), icon: Settings },
  ],
});

export default function Sidebar({ role = 'automobiliste' }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useApp();
  const currentRole = user?.role || role || 'automobiliste';
  const items = itemsByRole(t)[currentRole] || itemsByRole(t).automobiliste;

  const [unreadCount, setUnreadCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [interventionsCount, setInterventionsCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
        if (!token) return;

        // Messages
        const resMsg = await fetch('/api/messages/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resMsg.ok) {
          const data = await resMsg.json();
          setUnreadCount(data.count);
        }

        // Demandes & Interventions
        if (currentRole === 'mecanicien') {
          const resReq = await fetch('/api/demandes/count', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resReq.ok) {
            const data = await resReq.json();
            setRequestsCount(data.count);
          }

          const resInt = await fetch('/api/interventions/count', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resInt.ok) {
            const data = await resInt.json();
            setInterventionsCount(data.count);
          }
        }

        // Propositions
        if (currentRole === 'automobiliste') {
          const resProp = await fetch('/api/offers/count', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resProp.ok) {
            const data = await resProp.json();
            setProposalsCount(data.count);
          }
        }
      } catch (err) {
        console.error("Erreur notifications:", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [currentRole, location.pathname]);

  const totalNotifications = unreadCount + requestsCount + proposalsCount + interventionsCount;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Dynamic Trigger Button with Global Badge */}
      <div className="fixed left-8 top-8 z-[100]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900/40 text-white shadow-2xl backdrop-blur-2xl border border-white/5 transition-all hover:bg-[#F4D06F] hover:text-black group"
        >
          <Menu className="h-6 w-6 transition-transform group-hover:rotate-12" />
          
          <AnimatePresence>
            {totalNotifications > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg border-2 border-slate-900"
              >
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Modern Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Hyper-Beautiful Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-[120] h-full w-[22rem] bg-slate-950/80 p-10 shadow-[50px_0_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl border-r border-white/5 flex flex-col"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-[#F4D06F] flex items-center justify-center text-3xl font-black text-black shadow-[0_10px_40px_-10px_rgba(244,208,111,0.5)]">W</div>
                  <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950"></div>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-white">WQAFT</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{t('roadAssistance') || 'ASSISTANCE ROUTIÈRE'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + idx * 0.03 }}
                  >
                    <Link
                      to={item.path}
                      className={`group relative flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-black transition-all ${
                        active 
                          ? 'bg-[#F4D06F] text-black shadow-lg shadow-[#F4D06F]/20' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-black' : 'text-[#F4D06F]'}`} />
                      <span className="uppercase tracking-[0.15em] text-[10px]">{item.label}</span>
                      
                      {/* Badges spécifiques */}
                      {item.path === '/messages' && unreadCount > 0 && (
                        <div className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg">
                          {unreadCount}
                        </div>
                      )}
                      {item.path === '/requests' && requestsCount > 0 && (
                        <div className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F4D06F] px-1.5 text-[10px] font-black text-black shadow-lg">
                          {requestsCount}
                        </div>
                      )}
                      {item.path === '/proposals' && proposalsCount > 0 && (
                        <div className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F4D06F] px-1.5 text-[10px] font-black text-black shadow-lg">
                          {proposalsCount}
                        </div>
                      )}

                      {item.path === '/interventions' && interventionsCount > 0 && (
                        <div className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F4D06F] px-1.5 text-[10px] font-black text-black shadow-lg">
                          {interventionsCount}
                        </div>
                      )}

                      {active && !item.path.includes('/messages') && !item.path.includes('/requests') && !item.path.includes('/proposals') && !item.path.includes('/interventions') && <ChevronRight className="ml-auto h-4 w-4" />}
                    </Link>
                  </motion.div>
                );
              })}
              
            </nav>

            {/* Premium Footer Section */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
              {/* User Profile Card */}
              <Link to="/profile" className="relative group block">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F4D06F]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-lg"></div>
                <div className="relative flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/5 backdrop-blur-xl transition-all group-hover:border-[#F4D06F]/20">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <div className="text-[#F4D06F] font-black text-sm">{user?.name?.[0] || 'U'}</div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">{user?.name || 'Utilisateur'}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {currentRole === 'mecanicien' ? t('mecanicien') : t('automobiliste')}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-[#F4D06F] transition-all">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </Link>

              {/* Enhanced Logout Button (Persistent at bottom) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-500/20 transition-all hover:bg-red-600"
              >
                <LogOut className="h-4 w-4" /> {t('logout') || 'Déconnexion'}
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
