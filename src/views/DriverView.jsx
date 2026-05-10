import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { AlertTriangle, MapPin, Camera, X, Clock, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { motion, AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';
import { useDemandes, useTimer } from '../hooks/useDemandes';

const userMarkerIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-yellow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [map, position]);
  return null;
}

// Timer qui s'affiche correctement
const ActiveRequestTimer = ({ createdAt, onExpire }) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, 300000 - (now - created)); // 5 minutes en millisecondes
      setRemaining(diff);
      
      if (diff <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (remaining === null || remaining <= 0) return null;
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return (
    <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default function DriverView() {
  const { user } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const role = user?.role || 'driver';

  const { demandes: myRequests, refresh: fetchActiveRequest } = useDemandes('client');
  
  // Vérifier si une demande active existe et n'est pas expirée
  const activeRequest = useMemo(() => {
    const now = Date.now();
    return myRequests.find((r) => {
      const isOpen = r.status === 'open';
      const createdAt = new Date(r.created_at).getTime();
      const isNotExpired = (now - createdAt) < 5 * 60 * 1000;
      return isOpen && isNotExpired;
    });
  }, [myRequests]);

  // Rafraîchir toutes les 2 secondes pour voir les offres
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveRequest();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchActiveRequest]);

  // Rediriger vers /proposals si des offres sont reçues
  useEffect(() => {
    if (activeRequest?.offers && activeRequest.offers.length > 0) {
      navigate('/proposals');
    }
  }, [activeRequest?.offers, navigate]);

  const breakdownOptions = useMemo(
    () => [
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
    ],
    [t]
  );

  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState([31.6295, -7.9811]);
  const [modalOpen, setModalOpen] = useState(false);
  const [breakdown, setBreakdown] = useState('');
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const filteredBreakdownOptions = useMemo(
    () => breakdownOptions.filter((option) =>
      option.label.toLowerCase().includes(breakdownSearch.toLowerCase())
    ),
    [breakdownOptions, breakdownSearch]
  );

  const refreshLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
              { headers: { 'User-Agent': 'WqaftApp/1.0' } }
            );
            const data = await res.json();
            if (data?.display_name) setAddress(data.display_name);
          } catch (e) {
            console.error('Geocoding failed');
          } finally {
            setLocationLoading(false);
          }
        },
        () => setLocationLoading(false)
      );
    } else {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!breakdown) {
      setError('Veuillez sélectionner un type de panne');
      return;
    }
    if (activeRequest) {
      setError('Vous avez déjà une demande active.');
      return;
    }
    setError('');
    setStatus('Envoi en cours...');
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
          description,
          lat: position[0],
          lng: position[1],
          address,
          location_details: locationDetails,
          photo: photoBase64,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Erreur lors de l'envoi");
        setStatus('');
      } else {
        setStatus('Demande envoyée !');
        setTimeout(() => {
          setModalOpen(false);
          fetchActiveRequest();
          resetModal();
        }, 1000);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setStatus('');
    }
  };

  const resetModal = () => {
    setBreakdown('');
    setBreakdownSearch('');
    setDescription('');
    setLocationDetails('');
    setPhotoBase64(null);
    setPhotoPreview(null);
    setPhotoName('');
    setError('');
    setStatus('');
    setModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden transition-colors duration-300">
      <BackButton />
      <Sidebar role={role} />

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            <MapController position={position} />
            <Marker position={position} icon={userMarkerIcon}>
              <Popup>Votre position</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
          <AnimatePresence mode="wait">
            {activeRequest ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-slate-950/90 backdrop-blur-2xl border-2 border-[#F4D06F] p-8 rounded-[3rem] shadow-2xl shadow-[#F4D06F]/20 flex flex-col items-center gap-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#F4D06F] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">
                      Alerte en cours
                    </span>
                  </div>
                  <ActiveRequestTimer 
                    createdAt={activeRequest.created_at}
                    onExpire={() => {
                      fetchActiveRequest();
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-4">
                    {activeRequest.offers?.length || 0} offre(s) reçue(s)
                  </p>
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
                className="w-full h-16 bg-red-600 rounded-full flex items-center justify-between px-6 group active:scale-95 transition-all shadow-xl shadow-red-600/40 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col items-start">
                  <span className="text-white text-lg font-black tracking-tight">
                    {t('iAmBrokenDown') || 'Je suis en panne'}
                  </span>
                  <span className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Alerte immédiate
                  </span>
                </div>
                <div className="relative z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform shadow-md">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal - inchangé */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-app p-6 shadow-2xl border border-app my-4"
            >
              {/* Contenu du modal identique à avant */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#F4D06F]">
                    {t('assistExpress')}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    {t('problemDetails')}
                  </h3>
                </div>
                <button onClick={resetModal} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Reste du modal... */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      {t('typeBreakdown')}
                    </label>
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
                        className="w-full rounded-xl border border-app bg-white/5 px-4 py-3 text-sm text-app outline-none focus:border-[#F4D06F] transition"
                      />
                      {showDropdown && filteredBreakdownOptions.length > 0 && (
                        <div className="absolute z-[60] mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black">
                          {filteredBreakdownOptions.map((option) => (
                            <div
                              key={option.key}
                              onClick={() => {
                                setBreakdown(option.label);
                                setBreakdownSearch(option.label);
                                setShowDropdown(false);
                              }}
                              className="cursor-pointer px-4 py-2.5 text-sm text-slate-300 hover:bg-[#F4D06F] hover:text-black transition"
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      {t('yourPosition')}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F4D06F]" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={locationLoading ? 'Localisation...' : 'Rue, Ville...'}
                        className="w-full rounded-xl border border-app bg-white/5 pl-9 pr-10 py-3 text-sm text-app outline-none focus:border-[#F4D06F] transition"
                        readOnly={locationLoading}
                      />
                      <button
                        type="button"
                        onClick={refreshLocation}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#F4D06F] transition"
                      >
                        <RefreshCw className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Précisions Localisation
                    </label>
                    <textarea
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      rows={2}
                      placeholder="Près de quel magasin ? Devant quel café ?"
                      className="w-full rounded-xl border border-app bg-white/5 px-4 py-3 text-sm text-app outline-none focus:border-[#F4D06F] transition resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    {t('descPhotos')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder={t('breakdownDescription')}
                      className="w-full rounded-xl border border-app bg-white/5 px-4 py-3 text-sm text-app outline-none focus:border-[#F4D06F] transition resize-none"
                    />
                    <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 px-4 py-3 transition hover:border-[#F4D06F] group overflow-hidden min-h-[100px]">
                      {photoPreview ? (
                        <>
                          <img src={photoPreview} alt="Aperçu" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                          <div className="relative z-10 flex flex-col items-center">
                            <Camera className="h-5 w-5 text-white drop-shadow" />
                            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white drop-shadow">Changer</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5 text-slate-600 group-hover:text-[#F4D06F] transition" />
                          <span className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
                            {t('addPhoto')}
                          </span>
                          {photoName && <p className="mt-1 text-[9px] text-[#F4D06F] font-bold truncate w-full text-center">✓ {photoName}</p>}
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="pt-2 flex flex-col gap-3">
                  <button type="button" onClick={handleSend} disabled={!!status} className="w-full rounded-xl bg-[#F4D06F] px-6 py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#F4D06F]/20 transition hover:bg-[#e0be53] active:scale-95 disabled:opacity-60">
                    {t('launchAlert')}
                  </button>
                  <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
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