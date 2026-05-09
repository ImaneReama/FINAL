import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Phone, MessageCircle, ShieldCheck, Clock, Wrench, Award, ChevronRight, User } from 'lucide-react';
import { motion } from 'motion/react';
import BackButton from '../components/BackButton';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MechanicDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanic = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/user/profile/${id}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const u = data.user;
          setMechanic({
            id: u.id,
            name: u.name,
            specialty: u.specialties || u.specialty || 'Mécanicien Professionnel',
            rating: u.rating || 4.5,
            reviews: 12,
            location: u.address || u.city || 'Marrakech',
            phone: u.phone,
            experience: 'Expérimenté',
            bio: u.bio || 'Mécanicien qualifié disponible pour toute intervention.',
            skills: (u.specialties || '').split(',').map(s => s.trim()).filter(s => s),
            verified: true,
            photo: u.photo
          });
        }
      } catch (err) {
        console.error("Error fetching mechanic:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMechanic();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-8 w-8 border-4 border-[#F4D06F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Profil non trouvé</h2>
          <button onClick={() => navigate('/contacts')} className="rounded-2xl bg-[#F4D06F] px-8 py-4 text-black font-black uppercase">
            Retour aux contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <BackButton />
      <Sidebar role={user?.role || 'automobiliste'} />
      
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[3rem] bg-slate-900/50 p-10 border border-white/5 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-[#F4D06F] text-black text-5xl font-black shadow-2xl shadow-[#F4D06F]/20">
                    {mechanic.photo ? (
                      <img src={mechanic.photo} alt={mechanic.name} className="h-full w-full rounded-[2.5rem] object-cover" />
                    ) : (
                      mechanic.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  {mechanic.verified && (
                    <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-4 border-slate-900">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-black">{mechanic.name}</h1>
                  <p className="mt-1 text-lg font-bold text-[#F4D06F]">{mechanic.specialty}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-black">{mechanic.rating}</span>
                    </div>
                    <span className="text-sm text-slate-400">{mechanic.reviews} avis vérifiés</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('contactId', mechanic.id);
                    params.set('name', mechanic.name);
                    params.set('phone', mechanic.phone);
                    navigate(`/messages?${params.toString()}`);
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4D06F] text-black shadow-lg shadow-[#F4D06F]/10 hover:scale-105 transition"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
                <a 
                  href={`tel:${mechanic.phone}`}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
                >
                  <Phone className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-4">À propos</h2>
                  <p className="text-lg leading-relaxed text-slate-300">{mechanic.bio}</p>
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                    <Clock className="h-6 w-6 text-[#F4D06F] mb-3" />
                    <p className="text-xs uppercase text-slate-500">Expérience</p>
                    <p className="text-xl font-bold">{mechanic.experience}</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                    <MapPin className="h-6 w-6 text-[#F4D06F] mb-3" />
                    <p className="text-xs uppercase text-slate-500">Localisation</p>
                    <p className="text-xl font-bold">{mechanic.location}</p>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#F4D06F] mb-4">Compétences</h2>
                  <div className="flex flex-wrap gap-2">
                    {mechanic.skills.map(skill => (
                      <span key={skill} className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold border border-white/5">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl bg-[#F4D06F]/5 p-8 border border-[#F4D06F]/20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-[#F4D06F] flex items-center justify-center text-black">
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black">Engagement Qualité</h3>
                  </div>
                  <ul className="space-y-4">
                    {['Intervention express', 'Pièces d\'origine', 'Garantie 6 mois', 'Paiement sécurisé'].map(text => (
                      <li key={text} className="flex items-center gap-3 text-slate-300">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold">{text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
