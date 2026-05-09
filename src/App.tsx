import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AppProvider } from './contexts/AppContext.jsx';
import AuthView from './views/AuthView.jsx';
import RegisterView from './views/RegisterView.jsx';
import DriverView from './views/DriverView.jsx';
import MechanicView from './views/MechanicView.jsx';
import ContactView from './views/ContactView.jsx';
import MessagesView from './views/MessagesView.jsx';
import RequestsView from './views/RequestsView.jsx';
import InterventionsView from './views/InterventionsView.jsx';
import ProfileView from './views/ProfileView.jsx';
import SettingsView from './views/SettingsView.jsx';
import ProposalsView from './views/ProposalsView.jsx';
import ProposalsHistoryView from './views/ProposalsHistoryView.jsx';
import MechanicDetailView from './views/MechanicDetailView.jsx';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('wqaft_user') || localStorage.getItem('wqaft_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error parsing saved user:', err);
        sessionStorage.removeItem('wqaft_user');
        localStorage.removeItem('wqaft_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (newUser: any, token?: string) => {
    sessionStorage.setItem('wqaft_user', JSON.stringify(newUser));
    localStorage.setItem('wqaft_user', JSON.stringify(newUser));
    if (token) {
      localStorage.setItem('wqaft_token', token);
      sessionStorage.setItem('wqaft_token', token);
    }
    setUser(newUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wqaft_user');
    localStorage.removeItem('wqaft_user');
    sessionStorage.removeItem('wqaft_token');
    localStorage.removeItem('wqaft_token');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <AppProvider>
      <AuthProvider value={{ user, login: handleLogin, logout: handleLogout }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'mecanicien' ? '/mechanic' : '/driver'} replace /> : <AuthView onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'mecanicien' ? '/mechanic' : '/driver'} replace /> : <RegisterView onLogin={handleLogin} />} />
            <Route path="/driver" element={user ? (user.role === 'automobiliste' ? <DriverView /> : <Navigate to={user.role === 'mecanicien' ? '/mechanic' : '/login'} replace />) : <Navigate to="/login" replace />} />
            <Route path="/proposals" element={user ? <ProposalsView /> : <Navigate to="/login" replace />} />
            <Route path="/mechanic" element={user ? (user.role === 'mecanicien' ? <MechanicView /> : <Navigate to={user.role === 'automobiliste' ? '/driver' : '/login'} replace />) : <Navigate to="/login" replace />} />
            <Route path="/proposals/history" element={user ? <ProposalsHistoryView /> : <Navigate to="/login" replace />} />
            <Route path="/contacts" element={user ? <ContactView /> : <Navigate to="/login" replace />} />
            <Route path="/messages" element={user ? <MessagesView /> : <Navigate to="/login" replace />} />
            <Route path="/requests" element={user ? <RequestsView /> : <Navigate to="/login" replace />} />
            <Route path="/interventions" element={user ? <InterventionsView /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={user ? <ProfileView /> : <Navigate to="/login" replace />} />
            <Route path="/settings" element={user ? <SettingsView /> : <Navigate to="/login" replace />} />
            <Route path="/mechanic/:id" element={user ? <MechanicDetailView /> : <Navigate to="/login" replace />} />
            <Route path="/" element={<Navigate to={user ? (user.role === 'mecanicien' ? '/mechanic' : '/driver') : '/login'} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}
