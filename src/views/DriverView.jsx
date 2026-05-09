import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { AlertTriangle, MapPin, MessageCircle, ChevronRight, Camera, X, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { motion, AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';


const userMarkerIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-yellow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const mechanicIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);
  return null;
}

const mockMechanics = [
  { id: 1, name: 'Youssef', lat: 31.631, lng: -7.992, specialty: 'Batterie', status: 'available', price: 120, rating: 4.9 },
  { id: 2, name: 'Laila', lat: 31.640, lng: -7.994, specialty: 'Pneus', status: 'busy', price: 95, rating: 4.7 },
  { id: 3, name: 'Karim', lat: 31.624, lng: -7.978, specialty: 'Diagnostic', status: 'available', price: 130, rating: 4.8 },
];

export default function DriverView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'driver';

  const breakdownOptions = useMemo(() => [
    { key: 'pneuCreve', label: t('pneuCreve') },
    { key: 'batterieDechargee', label: t('batterieDechargee') },
    { key: 'panneMoteur', label: t('panneMoteur') },
    { key: 'panneEssence', label: t('panneEssence') },
    { key: 'surchauffeMoteur', label: t('surchauffeMoteur') },
    { key: 'problemeFreins', label: t('problemeFreins') },
    { key: 'boiteVitesses', label: t('boiteVitesses') },
    { key: 'problemeElectrique', label: t('problemeElectrique') },
    { key: 'accident', label: t('accident') },
    { key: 'clesEnfermees', label: t('clesEnfermees') },
    { key: 'problemeDemarrage', label: t('problemeDemarrage') },
    { key: 'fuiteHuile', label: t('fuiteHuile') },
    { key: 'fuiteLiquide', label: t('fuiteLiquide') },
    { key: 'autre', label: t('autre') },
  ], [t]);

  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState([31.6295, -7.9811]);
  const [modalOpen, setModalOpen] = useState(false);
  const [breakdown, setBreakdown] = useState('');
  const [address, setAddress] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const filteredBreakdownOptions = useMemo(() => 
    breakdownOptions.filter(option =>
      option.label.toLowerCase().includes(breakdownSearch.toLowerCase())
    ), [breakdownOptions, breakdownSearch]);

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, {
            headers: { 'User-Agent': 'WqaftApp/1.0' }
          });
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (e) {
          console.error("Geocoding failed");
        }
      });
    }
  };

  const fetchActiveRequest = async () => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/demandes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Get latest pending request
        const pending = data.find(r => r.status === 'pending');
        if (pending) {
          setActiveRequest(pending);
          const createdAt = new Date(pending.created_at).getTime();
          const expiresAt = createdAt + (5 * 60 * 1000);
          const now = Date.now();
          const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(diff);
        } else {
          setActiveRequest(null);
          setTimeLeft(null);
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    refreshLocation();
    fetchActiveRequest();
    const intv = setInterval(fetchActiveRequest, 30000); // Check every 30s
    return () => clearInterval(intv);
  }, []);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             clearInterval(timer);
             setActiveRequest(null);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!breakdown) {
      setError("Veuillez sélectionner un type de panne");
      return;
    }
    setError('');
    setStatus(t('sendingRequest'));
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');

    try {
      const response = await fetch('/api/demandes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: breakdown,
          description: description,
          lat: position[0],
          lng: position[1],
          address: address,
          location_details: locationDetails,
          photo: photoBase64
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Erreur lors de l'envoi");
        setStatus('');
      } else {
        setStatus("Votre demande de dépannage a été envoyée avec succès");
        setTimeout(() => {
          setModalOpen(false);
          fetchActiveRequest(); // This will trigger the timer overlay
        }, 1500);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      setStatus('');
    }
  };

  return (
    <div className="relative h-screen w-full bg-app text-app overflow-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />
      
      <main className="h-full w-full">
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
          <MapController position={position} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={userMarkerIcon}>
            <Popup>{t('youAreHere')}</Popup>
          </Marker>
          {mockMechanics.map((mechanic) => (
            <Marker key={mechanic.id} position={[mechanic.lat, mechanic.lng]} icon={mechanicIcon}>
              <Popup>
                <div className="space-y-1 text-slate-950">
                  <p className="font-bold">{mechanic.name}</p>
                  <p>{mechanic.specialty}</p>
                  <p>Note {mechanic.rating} ★</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Bottom Control Center */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-6">
          <AnimatePresence mode="wait">
            {activeRequest && timeLeft > 0 ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-slate-950/90 backdrop-blur-2xl border-2 border-[#F4D06F] p-8 rounded-[3rem] shadow-2xl shadow-[#F4D06F]/20 flex flex-col items-center gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#F4D06F] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">Alerte en cours</span>
                  </div>
                  <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => navigate('/proposals')}
                    className="flex-1 h-14 bg-[#F4D06F] text-black text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#F4D06F]/10 hover:scale-105 active:scale-95 transition-all"
                  >
                    Voir les offres
                  </button>
                  <button 
                    onClick={() => setModalOpen(true)}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition"
                  >
                    <Clock className="w-6 h-6 text-white" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="idle"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                onClick={() => {
                  setModalOpen(true);
                  refreshLocation();
                }}
                className="w-full h-24 bg-red-600 rounded-[3rem] flex items-center justify-between px-10 group active:scale-95 transition-all shadow-2xl shadow-red-600/40 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col items-start">
                  <span className="text-white text-2xl font-black tracking-tight">{t('iAmBrokenDown') || 'Je suis en panne'}</span>
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Alerte immédiate 5km</span>
                </div>
                <div className="relative z-10 w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-xl">
                  <AlertTriangle className="text-red-600 w-6 h-6" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Breakdown Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-[2.5rem] bg-app p-8 shadow-2xl border border-app"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">{t('assistExpress')}</p>
                  <h3 className="mt-1 text-3xl font-black text-white">{t('problemDetails')}</h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-muted hover:text-white transition">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('typeBreakdown')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={breakdownSearch}
                        onChange={(e) => {
                          setBreakdownSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Ex: Pneu crevé"
                        className="w-full rounded-2xl border border-app bg-white/5 px-5 py-4 text-app outline-none focus:border-[#F4D06F] transition"
                      />
                      {showDropdown && (
                        <div className="absolute z-[60] mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black">
                          {filteredBreakdownOptions.map((option) => (
                            <div
                              key={option.key}
                              onClick={() => {
                                setBreakdown(option.label);
                                setBreakdownSearch(option.label);
                                setShowDropdown(false);
                              }}
                              className="cursor-pointer px-5 py-3 text-sm text-slate-300 hover:bg-[#F4D06F] hover:text-black transition"
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('yourPosition')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F4D06F]" />
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, Ville..." className="w-full rounded-2xl border border-app bg-white/5 px-12 py-4 text-app outline-none focus:border-[#F4D06F] transition" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Précisions Localisation</label>
                    <textarea 
                      value={locationDetails} 
                      onChange={(e) => setLocationDetails(e.target.value)} 
                      rows={2} 
                      placeholder="Près de quel magasin ? Devant quel café ?" 
                      className="w-full rounded-2xl border border-app bg-white/5 px-5 py-4 text-app outline-none focus:border-[#F4D06F] transition resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{t('descPhotos')}</label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t('breakdownDescription')} className="w-full rounded-2xl border border-app bg-white/5 px-5 py-4 text-app outline-none focus:border-[#F4D06F] transition resize-none" />
                    <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 px-5 py-4 transition hover:border-[#F4D06F] group">
                      <Camera className="h-6 w-6 text-slate-600 group-hover:text-[#F4D06F] transition" />
                      <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">{t('addPhoto')}</span>
                      <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                      {photoName && <p className="mt-2 text-[10px] text-[#F4D06F] font-bold">✓ {photoName}</p>}
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <button type="button" onClick={handleSend} className="w-full rounded-2xl bg-[#F4D06F] px-6 py-5 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#F4D06F]/20 transition hover:bg-[#e0be53] active:scale-95">
                    {t('launchAlert')}
                  </button>
                  <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                    {t('nearbyMechanicsAlert')}
                  </p>
                </div>
                
                {status && <div className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-500">{status}</div>}
                {error && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-500">{error}</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
