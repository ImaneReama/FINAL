import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import 'leaflet/dist/leaflet.css';
import { RefreshCcw, BarChart3, Star, MapPin } from 'lucide-react';

const mechanicIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const mockDrivers = [
  { id: 1, name: 'Sofia', lat: 31.636, lng: -7.989, issue: 'Panne batterie', distance: '1.2 km' },
  { id: 2, name: 'Yassine', lat: 31.632, lng: -7.976, issue: 'Pneu crevé', distance: '900 m' },
  { id: 3, name: 'Nora', lat: 31.628, lng: -7.983, issue: 'Problème moteur', distance: '1.8 km' },
];

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);
  return null;
}

export default function MechanicView() {
  const [position] = useState([31.6295, -7.9811]);
  const [available, setAvailable] = useState(true);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const { user } = useAuth();
  const role = user?.role || 'mecanicien';
  const isMec = ['mecanicien', 'mechanic', 'pro'].includes(role.toLowerCase());

  const availabilityLabel = available ? 'Disponible' : 'Indisponible';

  // Zoom wrapper for mechanics (60%)
  const containerStyle = isMec ? {
    transform: 'scale(0.6)',
    transformOrigin: 'top left',
    width: '166.66%',
    height: '166.66%',
    position: 'absolute',
    top: 0,
    left: 0
  } : {};

  const revenueData = {
    'Par jour': '450 DH',
    'Par semaine': '1 740 DH',
    'Par mois': '6 850 DH',
    'Par an': '82 400 DH',
  };

  const [revenueFilter, setRevenueFilter] = useState('Par semaine');

  const stats = [
    { 
      title: 'Chiffre d’affaires', 
      value: revenueData[revenueFilter], 
      description: revenueFilter, 
      icon: BarChart3,
      isFilterable: true 
    },
    { title: 'Évaluations', value: '4.8 ★', description: '128 avis', icon: Star },
    { title: 'Zones demandées', value: 'Guéliz, Médina, Hivernage', description: 'Top 3 quartiers', icon: MapPin },
  ];

  useEffect(() => {
    const token = localStorage.getItem('wqaft_token') || localStorage.getItem('token');
    if (!token) {
      setRequestsCount(0);
      setLoadingRequests(false);
      return;
    }

    fetch('/api/demandes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequestsCount(data.length);
        }
      })
      .catch(() => {
        setRequestsCount(0);
      })
      .finally(() => setLoadingRequests(false));
  }, []);

  return (
    <div className="h-screen w-full bg-slate-950 text-white overflow-hidden font-sans relative">
      <div style={containerStyle}>
        <div className="flex h-full w-full">
          <Sidebar role={role} />
          
          <main className="flex-1 flex flex-col relative h-full">
            {/* SECTION 1.1 - 85% CARTE INTERACTIVE */}
            <section className="h-[85%] relative w-full overflow-hidden">
              {/* Map Container */}
              <div className="absolute inset-0 z-0">
                <MapContainer center={position} zoom={13} scrollWheelZoom className="h-full w-full">
                  <MapController position={position} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={position} icon={mechanicIcon}>
                    <Popup>Votre position</Popup>
                  </Marker>
                  {mockDrivers.map((driver) => (
                    <Marker key={driver.id} position={[driver.lat, driver.lng]} icon={driverIcon}>
                      <Popup>
                        <div className="space-y-1 text-slate-950">
                          <p className="font-bold">{driver.name}</p>
                          <p>{driver.issue}</p>
                          <p>{driver.distance}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Floating UI Overlays */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4">
                <div className="flex items-center justify-between gap-4 bg-slate-950/40 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                  <div className="flex items-center gap-4 pl-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#F4D06F] flex items-center justify-center text-black shadow-lg shadow-[#F4D06F]/20">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tighter">Proximité</h1>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {loadingRequests ? 'Chargement...' : `${requestsCount} demandes en attente`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pr-2">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                      <div className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{availabilityLabel}</span>
                      <label className="relative inline-flex cursor-pointer items-center ml-2">
                        <input type="checkbox" checked={available} onChange={() => setAvailable(!available)} className="peer sr-only" />
                        <div className="h-5 w-10 rounded-full bg-slate-700 peer-checked:bg-[#F4D06F]" />
                        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                      </label>
                    </div>

                    <button 
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#F4D06F] hover:text-black border border-white/5 shadow-xl"
                    >
                      <RefreshCcw className="h-3 w-3" /> Actualiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtle bottom gradient for map depth */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
            </section>

            {/* SECTION 1.1 - 15% STATISTIQUES / PERFORMANCES RAPIDES */}
            <section className="h-[15%] w-full bg-slate-950 border-t border-white/5 flex items-center px-8 lg:px-12 z-20">
              <div className="w-full grid grid-cols-3 gap-8 items-center">
                {stats.map((stat, idx) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={stat.title} className="flex items-center gap-6 group relative">
                      <div className="h-14 w-14 rounded-[1.5rem] bg-white/5 border border-white/5 flex items-center justify-center text-[#F4D06F] transition-all group-hover:scale-110 group-hover:bg-[#F4D06F]/10 group-hover:border-[#F4D06F]/20">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.title}</span>
                          {stat.isFilterable && (
                            <select 
                              value={revenueFilter}
                              onChange={(e) => setRevenueFilter(e.target.value)}
                              className="bg-transparent border-none text-[8px] font-bold text-[#F4D06F] uppercase tracking-widest focus:ring-0 cursor-pointer outline-none hover:text-white transition"
                            >
                              <option value="Par jour" className="bg-slate-900">Jour</option>
                              <option value="Par semaine" className="bg-slate-900">Semaine</option>
                              <option value="Par mois" className="bg-slate-900">Mois</option>
                              <option value="Par an" className="bg-slate-900">Année</option>
                            </select>
                          )}
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-black text-white">{stat.value}</span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{stat.description}</span>
                        </div>
                      </div>
                      {idx < stats.length - 1 && (
                        <div className="ml-auto h-12 w-px bg-white/5 hidden lg:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
