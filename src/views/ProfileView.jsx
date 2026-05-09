import React, { useState, useMemo, useEffect } from 'react';
import { User, Mail, Phone, ShieldCheck, Settings2, Edit3, Trash2, PlusCircle, Camera, Car, Save, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { carData, carBrands } from '../utils/carData.js';
import SearchableDropdown from '../components/SearchableDropdown.jsx';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileView() {
  const { user, login } = useAuth();
  const { t } = useApp();
  const [currentUser, setCurrentUser] = useState(user || {
    name: 'Utilisateur',
    email: '',
    phone: '',
    role: 'automobiliste',
  });
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const role = user?.role || 'automobiliste';
  const isAutomobiliste = role === 'automobiliste';

  // Ensure vehicle_info is an array
  const initialVehicles = Array.isArray(user?.vehicle_info) 
    ? user.vehicle_info 
    : (user?.vehicle_info ? [user.vehicle_info] : []);

  const [form, setForm] = useState({
    vehicles: initialVehicles,
    specialty: user?.specialty || '',
    garage_name: user?.garage_name || ''
  });

  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: '',
    license_plate: ''
  });

  // Sync form with user data when it changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      const vinfo = Array.isArray(user.vehicle_info) 
        ? user.vehicle_info 
        : (user.vehicle_info ? [user.vehicle_info] : []);
      setForm(prev => ({
        ...prev,
        vehicles: vinfo,
        specialty: user.specialties || user.specialty || '',
        garage_name: user.mecanicien_type || user.garage_name || ''
      }));
    }
  }, [user]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = currentYear; i >= 1970; i--) arr.push(i.toString());
    return arr;
  }, []);

  const models = useMemo(() => {
    return newVehicle.brand ? (carData[newVehicle.brand] || []) : [];
  }, [newVehicle.brand]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/profile', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          const vehicles = Array.isArray(data.user.vehicle_info) 
            ? data.user.vehicle_info 
            : (data.user.vehicle_info ? [data.user.vehicle_info] : []);
          setForm(prev => ({
            ...prev,
            vehicles,
            specialty: data.user.specialties || '',
            garage_name: data.user.mecanicien_type || ''
          }));
          login(data.user);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name: currentUser.name,
        phone: currentUser.phone,
        city: currentUser.city,
        address: currentUser.address,
        vehicle_info: isAutomobiliste ? form.vehicles : null,
        specialty: !isAutomobiliste ? form.specialty : null,
        garage_name: !isAutomobiliste ? form.garage_name : null
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user || data;
        login(updatedUser);
        setCurrentUser(updatedUser);
        setEditing(false);
        setAdding(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || 'Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = () => {
    const updatedVehicles = [...form.vehicles, { ...newVehicle }];
    setForm(prev => ({
      ...prev,
      vehicles: updatedVehicles
    }));
    setNewVehicle({ brand: '', model: '', year: '', license_plate: '' });
    setAdding(false);
    // Explicitly set editing to true so the "Enregistrer" button shows up
    setEditing(true);
  };

  const handleRemoveVehicle = (index) => {
    setForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        alert('Votre compte a été supprimé avec succès.');
        window.location.href = '/login';
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || 'Erreur lors de la suppression du compte.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur serveur lors de la suppression.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete') || 'Voulez-vous vraiment supprimer vos informations de véhicule ?')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile/reset', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user || data);
        setCurrentUser(data.user || data);
        setForm({
          brand: '',
          model: '',
          year: '',
          license_plate: '',
          specialty: '',
          garage_name: ''
        });
        alert(t('deleteSuccess') || 'Informations supprimées.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app text-app overflow-x-hidden">
      <BackButton />
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-20">
        <div className="mx-auto max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[3rem] bg-card p-10 border border-app backdrop-blur-xl shadow-2xl"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-[#F4D06F] text-black text-4xl font-black shadow-xl shadow-[#F4D06F]/20 overflow-hidden">
                    {currentUser.photo ? (
                      <img src={currentUser.photo} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      currentUser.name?.split(' ').map(n => n[0]).join('') || 'U'
                    )}
                  </div>
                  <input type="file" id="photo-input" style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      setIsLoading(true);
                      try {
                        const res = await fetch('/api/user/photo', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('wqaft_token') || localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({ photoBase64: reader.result })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setCurrentUser(prev => ({ ...prev, photo: data.photo }));
                          login({ ...currentUser, photo: data.photo });
                        }
                      } catch (err) { console.error(err); }
                      finally { setIsLoading(false); }
                    };
                    reader.readAsDataURL(file);
                  }} />
                  <button onClick={() => document.getElementById('photo-input').click()} className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-[#F4D06F] transition">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <h1 className="text-4xl font-black">{currentUser.name}</h1>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.3em] text-[#F4D06F]">
                    {role === 'mecanicien' ? t('mecanicien') : t('automobiliste')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#F4D06F] px-6 py-4 text-sm font-black uppercase text-black transition hover:bg-[#e0be53] shadow-lg shadow-[#F4D06F]/10">
                  <PlusCircle className="h-5 w-5" /> Ajouter des informations
                </button>
                <button onClick={() => {
                  if (editing) handleSave();
                  else setEditing(true);
                }} className={`inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase transition border ${editing ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 text-slate-300 hover:border-[#F4D06F] hover:text-[#F4D06F]'}`}>
                  {isLoading ? '...' : (editing ? 'Enregistrer' : t('editProfile'))}
                </button>
                {editing && (
                  <button onClick={() => setEditing(false)} className="rounded-2xl border border-red-500/50 px-6 py-4 text-sm font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition">
                    {t('cancel')}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* Personal Info */}
              <div className="space-y-6 rounded-[2.5rem] bg-slate-950/20 p-8 border border-app">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F4D06F]/10 flex items-center justify-center text-[#F4D06F]">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-muted">{t('personalAccount')}</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Nom complet', value: currentUser.name, field: 'name' },
                    { label: 'Email', value: currentUser.email, field: 'email' },
                    { label: t('phone'), value: currentUser.phone, field: 'phone' },
                    { label: t('city'), value: currentUser.city || '', field: 'city' },
                    { label: 'Adresse précise', value: currentUser.address || '', field: 'address' }
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.5rem] bg-slate-900/10 p-5 border border-app/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{item.label}</p>
                      {editing ? (
                        <input 
                          value={item.value} 
                          placeholder={item.label}
                          onChange={(e) => setCurrentUser(prev => ({ ...prev, [item.field]: e.target.value }))} 
                          className="w-full bg-transparent text-lg font-bold outline-none focus:text-[#F4D06F]" 
                        />
                      ) : (
                        <p className="text-lg font-bold">{item.value || '---'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle / Professional Info */}
              <div className="space-y-6 rounded-[2.5rem] bg-slate-950/20 p-8 border border-app">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F4D06F]/10 flex items-center justify-center text-[#F4D06F]">
                    {isAutomobiliste ? <Car className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-muted">
                    {isAutomobiliste ? t('vehicleInfo') : t('expertise')}
                  </p>
                </div>
                <div className="space-y-6">
                  {isAutomobiliste ? (
                    form.vehicles.length > 0 ? (
                      form.vehicles.map((v, idx) => (
                        <div key={idx} className="relative space-y-4 rounded-3xl bg-white/5 p-6 border border-app/10">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#F4D06F]">Véhicule {idx + 1}</p>
                            {editing && (
                              <button onClick={() => handleRemoveVehicle(idx)} className="text-red-500 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted mb-1">{t('brand')}</p>
                              <p className="text-lg font-bold">{v.brand}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted mb-1">{t('model')}</p>
                              <p className="text-lg font-bold">{v.model}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted mb-1">{t('year')}</p>
                              <p className="text-lg font-bold">{v.year}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted mb-1">{t('licensePlate')}</p>
                              <p className="text-lg font-bold">{v.license_plate}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-10 text-slate-500 italic">Aucun véhicule enregistré.</p>
                    )
                  ) : (
                    <>
                      <div className="rounded-[1.5rem] bg-slate-900/10 p-5 border border-app/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{t('specialtyLabel')}</p>
                        {editing ? (
                           <input 
                            value={form.specialty} 
                            onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))} 
                            className="w-full bg-transparent text-lg font-bold outline-none focus:text-[#F4D06F]" 
                          />
                        ) : (
                          <p className="text-lg font-bold">{form.specialty || '---'}</p>
                        )}
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-900/10 p-5 border border-app/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{t('garage')}</p>
                        {editing ? (
                           <input 
                            value={form.garage_name} 
                            onChange={(e) => setForm(prev => ({ ...prev, garage_name: e.target.value }))} 
                            className="w-full bg-transparent text-lg font-bold outline-none focus:text-[#F4D06F]" 
                          />
                        ) : (
                          <p className="text-lg font-bold">{form.garage_name || '---'}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {!editing && (
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-app px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:border-red-500/30 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" /> {t('deleteData') || 'Supprimer les données'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Adding Information Modal */}
      <AnimatePresence>
        {adding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl rounded-[3rem] bg-slate-950 p-10 shadow-2xl border border-app relative overflow-hidden"
            >
              <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[#F4D06F]/5 blur-[100px]"></div>
              
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4D06F]">Configuration</p>
                  <h3 className="mt-2 text-3xl font-black text-white">
                    {isAutomobiliste ? 'Ajouter un véhicule' : 'Ajouter une spécialité'}
                  </h3>
                </div>
                <button onClick={() => setAdding(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white transition border border-app">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {isAutomobiliste ? (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{t('brand')}</label>
                      <SearchableDropdown 
                        options={carBrands} 
                        value={newVehicle.brand} 
                        onChange={(val) => setNewVehicle(prev => ({ ...prev, brand: val, model: '' }))} 
                        placeholder="Ex: Toyota"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{t('model')}</label>
                      <SearchableDropdown 
                        options={models} 
                        value={newVehicle.model} 
                        onChange={(val) => setNewVehicle(prev => ({ ...prev, model: val }))} 
                        placeholder="Ex: Corolla"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{t('year')}</label>
                      <select 
                        value={newVehicle.year} 
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))} 
                        className="w-full rounded-2xl border border-app bg-white/5 px-6 py-4 text-white outline-none focus:border-[#F4D06F] transition appearance-none"
                      >
                        <option value="" className="bg-slate-950 text-slate-500">Choisir l'année</option>
                        {years.map(y => <option key={y} value={y} className="bg-slate-950">{y}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{t('licensePlate')}</label>
                      <input 
                        placeholder="Ex: 12345-A-6" 
                        value={newVehicle.license_plate} 
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, license_plate: e.target.value }))} 
                        className="w-full rounded-2xl border border-app bg-white/5 px-6 py-4 text-white outline-none focus:border-[#F4D06F] transition" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Spécialité / Expertise</label>
                    <input 
                      placeholder="Ex: Électricité Automobile, Diagnostic..." 
                      value={form.specialty} 
                      onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))} 
                      className="w-full rounded-2xl border border-app bg-white/5 px-6 py-4 text-white outline-none focus:border-[#F4D06F] transition" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Nom du Garage / Établissement</label>
                    <input 
                      placeholder="Ex: Garage El Fassi" 
                      value={form.garage_name} 
                      onChange={(e) => setForm(prev => ({ ...prev, garage_name: e.target.value }))} 
                      className="w-full rounded-2xl border border-app bg-white/5 px-6 py-4 text-white outline-none focus:border-[#F4D06F] transition" 
                    />
                  </div>
                </div>
              )}

              <div className="mt-12 flex gap-4">
                <button onClick={() => setAdding(false)} className="flex-1 rounded-2xl border border-app px-8 py-5 text-[11px] font-black uppercase tracking-widest text-muted hover:text-white transition">
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (isAutomobiliste) handleAddVehicle();
                    else {
                      handleSave();
                      setAdding(false);
                    }
                  }} 
                  disabled={isLoading} 
                  className="flex-1 rounded-2xl bg-[#F4D06F] px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black hover:bg-[#e0be53] transition shadow-2xl shadow-[#F4D06F]/20"
                >
                  {isAutomobiliste ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-[2.5rem] bg-slate-950 p-8 border border-red-500/20 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black">Êtes-vous sûr ?</h3>
              <p className="mt-4 text-slate-400">Cette action supprimera définitivement votre compte et toutes vos données. Cette opération est irréversible.</p>
              
              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-red-500 py-4 font-black uppercase tracking-widest text-white hover:bg-red-600 transition"
                >
                  {isLoading ? 'Suppression...' : 'Oui, supprimer mon compte'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full rounded-2xl border border-app py-4 font-black uppercase tracking-widest text-muted hover:text-white transition"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
