import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Wrench, Eye, EyeOff, UploadCloud, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import SearchableDropdown from '../components/SearchableDropdown';
import BackButton from '../components/BackButton';
import { carData, carBrands } from '../utils/carData';
import { useApp } from '../contexts/AppContext.jsx';

const onboardingSteps = {
  CHOICE: 1,
  FORM: 2,
};

export default function RegisterView({ onLogin }) {
  const navigate = useNavigate();
  const { t } = useApp();
  const [step, setStep] = useState(onboardingSteps.CHOICE);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    license_plate: '',
    gearbox: 'Manuelle',
    garage_name: '',
    specialty: 'Mécanique générale',
    years_experience: '1 an',
    authorization: null,
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canContinue = !!role;
  const isAutomobiliste = role === 'automobiliste';

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const stepTitle = useMemo(() => {
    if (step === onboardingSteps.CHOICE) return t('chooseProfile');
    return isAutomobiliste ? t('vehicleInfo') : t('profInfo');
  }, [isAutomobiliste, step, t]);

  const availableModels = useMemo(() => {
    if (!form.brand) return [];
    return carData[form.brand] || [];
  }, [form.brand]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Veuillez entrer votre prénom et votre nom.');
      setIsLoading(false);
      return;
    }
    if (!form.email.trim()) {
      setError('L\'adresse email est obligatoire.');
      setIsLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setIsLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    console.log('Registering with:', {
      name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role,
    });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role,
          vehicle_info: isAutomobiliste ? [{
            brand: form.brand,
            model: form.model,
            year: form.year,
            license_plate: form.license_plate,
            gearbox: form.gearbox
          }] : null,
          specialty: !isAutomobiliste ? form.specialty : null,
          garage_name: !isAutomobiliste ? form.garage_name : null,
          address: !isAutomobiliste ? form.address : null
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Registration error data:', data);
        setError(data.error || 'Impossible de créer le compte.');
      } else {
        const normalizedRole = data.user?.role?.toLowerCase() === 'mecanicien' ? 'mecanicien' : 'automobiliste';
        const destination = normalizedRole === 'mecanicien' ? '/mechanic' : '/driver';

        localStorage.setItem('wqaft_user', JSON.stringify({ ...data.user, role: normalizedRole }));
        localStorage.setItem('wqaft_token', data.token);
        sessionStorage.setItem('wqaft_user', JSON.stringify({ ...data.user, role: normalizedRole }));
        sessionStorage.setItem('wqaft_token', data.token);

        onLogin?.({ ...data.user, role: normalizedRole }, data.token);
        navigate(destination);
      }
    } catch (err) {
      setError('Erreur serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white selection:bg-[#F4D06F] selection:text-black">
      <BackButton />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        {/* Left Side: Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 to-black p-12 shadow-2xl border border-slate-800/50"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F4D06F]/5 blur-[100px]"></div>
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#F4D06F]/5 blur-[100px]"></div>
          
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="space-y-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#F4D06F] text-black shadow-xl shadow-[#F4D06F]/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-[#F4D06F]">{t('register')}</p>
                <h1 className="text-5xl font-black leading-tight tracking-tight text-white lg:text-6xl">
                  Join the <span className="text-[#F4D06F]">WQAFT</span> Network.
                </h1>
                <p className="max-w-md text-lg leading-relaxed text-slate-400">
                  {t('registerDesc') || 'Accédez au service d\'assistance routière le plus rapide et le plus fiable de la région.'}
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2rem] bg-slate-800/30 p-8 backdrop-blur-xl border border-white/5 transition hover:bg-slate-800/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4D06F]/10 text-[#F4D06F]">
                  <Car className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{t('automobiliste')}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t('automobilisteDesc')}</p>
              </div>
              <div className="rounded-[2rem] bg-slate-800/30 p-8 backdrop-blur-xl border border-white/5 transition hover:bg-slate-800/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4D06F]/10 text-[#F4D06F]">
                  <Wrench className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{t('mecanicien')}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t('mecanicienDesc')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="relative flex flex-col rounded-[3rem] bg-white p-10 text-slate-950 shadow-2xl shadow-black/10 lg:p-14"
        >
          {step === onboardingSteps.FORM && (
            <button 
              onClick={() => setStep(onboardingSteps.CHOICE)}
              className="absolute left-8 top-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-[#F4D06F] hover:text-black"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}

          <div className="flex-1">
            {step === onboardingSteps.CHOICE ? (
              <div className="flex h-full flex-col justify-center space-y-10">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">{t('chooseProfile')}</h2>
                  <p className="mt-2 text-slate-500">Sélectionnez comment vous souhaitez utiliser WQAFT.</p>
                </div>
                
                <div className="grid gap-6">
                  {[
                    { id: 'automobiliste', title: t('automobiliste'), desc: t('automobilisteDesc'), icon: Car },
                    { id: 'mecanicien', title: t('mecanicien'), desc: t('mecanicienDesc'), icon: Wrench },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`group relative flex items-center gap-6 rounded-[2rem] border-2 p-8 text-left transition-all ${
                        role === item.id 
                          ? 'border-[#F4D06F] bg-[#F4D06F]/5' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] transition-all ${
                        role === item.id ? 'bg-[#F4D06F] text-black shadow-lg shadow-[#F4D06F]/20' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}>
                        <item.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xl font-black">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                      </div>
                      {role === item.id && (
                        <div className="absolute right-8 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4D06F] text-black">
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep(onboardingSteps.FORM)}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#F4D06F] px-8 py-5 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-[#F4D06F]/20 transition hover:bg-[#e0be53] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {t('continue') || 'Continuer'}
                </button>
              </div>
            ) : (
              <form className="space-y-8 py-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#F4D06F]"></span>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[#F4D06F]">{isAutomobiliste ? t('automobiliste') : t('mecanicien')}</p>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">{stepTitle}</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { label: t('firstName'), placeholder: 'Karim', field: 'first_name' },
                    { label: t('lastName'), placeholder: 'El Amrani', field: 'last_name' },
                    { label: t('phone'), placeholder: '06 12 34 56 78', field: 'phone' },
                    { label: t('email'), placeholder: 'karim@wqaft.ma', field: 'email' }
                  ].map((item) => (
                    <div key={item.field} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{item.label}</label>
                      <input 
                        value={form[item.field]} 
                        onChange={(e) => handleChange(item.field, e.target.value)} 
                        placeholder={item.placeholder} 
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 outline-none focus:border-[#F4D06F] focus:bg-white transition" 
                        required 
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('password')}</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={form.password} 
                        onChange={(e) => handleChange('password', e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 pr-14 outline-none focus:border-[#F4D06F] focus:bg-white transition" 
                        required 
                      />
                      <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-900" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('confirmPassword') || 'Confirmer'}</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={form.confirmPassword} 
                      onChange={(e) => handleChange('confirmPassword', e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 outline-none focus:border-[#F4D06F] focus:bg-white transition" 
                      required 
                    />
                  </div>
                </div>

                {isAutomobiliste ? (
                  <div className="space-y-6 rounded-[2.5rem] bg-slate-50 p-8 border border-slate-100">
                    <h3 className="text-xl font-black">{t('vehicleInfo')}</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <SearchableDropdown 
                        options={carBrands} 
                        value={form.brand} 
                        onChange={(val) => {
                          handleChange('brand', val);
                          handleChange('model', '');
                        }} 
                        placeholder="Choisir une marque" 
                        label={t('brand')}
                      />
                      <SearchableDropdown 
                        options={availableModels} 
                        value={form.model} 
                        onChange={(val) => handleChange('model', val)} 
                        placeholder="Choisir un modèle" 
                        label={t('model')}
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('year')}</label>
                        <select 
                          value={form.year} 
                          onChange={(e) => handleChange('year', e.target.value)} 
                          className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition appearance-none cursor-pointer"
                        >
                          {Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('licensePlate')}</label>
                        <input value={form.license_plate} onChange={(e) => handleChange('license_plate', e.target.value)} placeholder="12345-A-6" className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('gearbox')}</label>
                        <select value={form.gearbox} onChange={(e) => handleChange('gearbox', e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition appearance-none cursor-pointer">
                          <option value="Manuelle">{t('manual')}</option>
                          <option value="Automatique">{t('automatic')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-[2.5rem] bg-slate-50 p-8 border border-slate-100">
                    <h3 className="text-xl font-black">{t('profInfo')}</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('garageName')}</label>
                        <input value={form.garage_name} onChange={(e) => handleChange('garage_name', e.target.value)} placeholder="Garage Speed" className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('address') || 'Adresse'}</label>
                        <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Quartier Industriel, Marrakech" className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('specialty')}</label>
                        <select value={form.specialty} onChange={(e) => handleChange('specialty', e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition appearance-none cursor-pointer">
                          <option>Mécanique générale</option>
                          <option>Électricité automobile</option>
                          <option>Batterie</option>
                          <option>Pneus</option>
                          <option>Vidange</option>
                          <option>Diagnostic</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('experience')}</label>
                        <select value={form.years_experience} onChange={(e) => handleChange('years_experience', e.target.value)} className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 outline-none focus:border-[#F4D06F] transition appearance-none cursor-pointer">
                          {Array.from({ length: 10 }, (_, idx) => idx + 1).map((y) => (
                            <option key={y} value={`${y} an${y > 1 ? 's' : ''}`}>{y} {y > 1 ? t('years') : t('year')}</option>
                          ))}
                          <option value="30 ans+">30 {t('years')}+</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">{t('authorization')}</label>
                        <label className="relative flex cursor-pointer items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 transition hover:border-[#F4D06F] hover:bg-slate-50 group">
                          <span className="font-bold group-hover:text-slate-900">{t('import')}</span>
                          <UploadCloud size={20} className="text-[#F4D06F]" />
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setForm((prev) => ({ ...prev, authorization: e.target.files?.[0] || null }))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                    {form.authorization && <p className="text-xs text-slate-500 ml-2">✓ {form.authorization.name}</p>}
                  </div>
                )}

                {error && <div className="rounded-[1.25rem] bg-red-50 px-6 py-4 text-sm font-bold text-red-600 border border-red-100">{error}</div>}

                <div className="space-y-6 pt-4">
                  <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-2xl bg-[#F4D06F] px-8 py-5 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-[#F4D06F]/30 transition hover:bg-[#e0be53] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30">
                    {isLoading ? '...' : t('createAccount')}
                  </button>
                  <div className="text-center text-sm font-medium text-slate-500">
                    {t('alreadyHaveAccount')} <button type="button" onClick={() => navigate('/login')} className="font-black text-[#B76F12] transition hover:text-[#F4D06F]">{t('signIn')}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
