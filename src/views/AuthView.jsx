import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, Eye, EyeOff, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext.jsx';
import BackButton from '../components/BackButton';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+212[5-9]\d{8}$/;

export default function AuthView({ onLogin }) {
  const navigate = useNavigate();
  const { t } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputType = useMemo(() => {
    if (emailRegex.test(identifier)) return 'email';
    if (phoneRegex.test(identifier)) return 'phone';
    return 'text';
  }, [identifier]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Email, téléphone ou mot de passe incorrect.');
      } else {
        const normalizedRole = data.user?.role?.toLowerCase() === 'mecanicien' ? 'mecanicien' : 'automobiliste';
        const destination = normalizedRole === 'mecanicien' ? '/mechanic' : '/driver';

        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('wqaft_token', data.token);
          sessionStorage.setItem('wqaft_token', data.token);
        }
        if (data.user) {
          const storedUser = { ...data.user, role: normalizedRole };
          localStorage.setItem('role', normalizedRole);
          localStorage.setItem('wqaft_user', JSON.stringify(storedUser));
          sessionStorage.setItem('wqaft_user', JSON.stringify(storedUser));
        }

        onLogin({ ...data.user, role: normalizedRole }, data.token);
        navigate(destination);
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BackButton />
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex min-h-screen flex-col justify-center gap-6 bg-[#F4D06F] px-8 py-12 text-slate-950"
        >
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#F4D06F] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
              <span className="absolute right-0 top-0 h-24 w-24 rounded-full bg-black/10 blur-2xl"></span>
              <span className="absolute left-0 top-8 h-16 w-16 rounded-full bg-white/50 blur-2xl"></span>
              <h1 className="text-6xl font-black uppercase tracking-[0.42em]">WQAFT</h1>
              <h2 className="mt-4 text-3xl font-bold uppercase tracking-[0.25em]">Assistance routière</h2>
            </div>
            <div className="space-y-4 max-w-xl">
              <p className="text-lg italic opacity-90">La solution ultime pour vos pannes sur la route.</p>
              <p className="text-sm leading-7 text-slate-900/95">
                Notre réseau d'experts intervient en un temps record pour vous garantir une sécurité totale et une expérience sans stress lors de vos déplacements partout au Maroc.
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-950">
              <div className="h-1 w-20 rounded-full bg-slate-950"></div>
              <span className="uppercase tracking-[0.3em] text-sm font-semibold">Marrakech</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex min-h-screen flex-col justify-center bg-slate-950 px-8 py-12 text-white"
        >
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.35em] text-[#F4D06F]">{t('login')}</p>
              <h3 className="text-3xl font-bold">{t('welcome')}</h3>
              <p className="text-sm text-slate-400">Identifiez-vous pour accéder à votre espace chauffeur ou mécanicien.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold">{t('emailOrPhone')}</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus-within:border-[#F4D06F]">
                  {inputType === 'email' ? <Mail className="h-5 w-5 text-[#F4D06F]" /> : inputType === 'phone' ? <Phone className="h-5 w-5 text-[#F4D06F]" /> : <MapPin className="h-5 w-5 text-[#F4D06F]" />}
                  <input
                    className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    type="text"
                    placeholder={t('emailOrPhone')}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500">Ex: contact@wqaft.ma ou +212612345678</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{t('password')}</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 focus-within:border-[#F4D06F]">
                  <Lock className="h-5 w-5 text-[#F4D06F]" />
                  <input
                    className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 transition hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button type="button" onClick={() => navigate('/register')} className="text-sm text-[#F4D06F] hover:text-white">
                  {t('register')}
                </button>
                <button type="button" onClick={() => setError('Veuillez contacter le support pour réinitialiser votre mot de passe.')} className="text-sm text-[#F4D06F] hover:text-white">
                  {t('forgotPassword')}
                </button>
              </div>

              {error && <div className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>}

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4D06F] px-5 py-4 text-sm font-black uppercase text-black transition shadow-lg shadow-[#F4D06F]/20 hover:-translate-y-0.5 hover:shadow-[#F4D06F]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Connexion...' : t('login')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
