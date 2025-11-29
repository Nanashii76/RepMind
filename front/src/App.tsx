import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

import { AuthPage } from './pages/Auth.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import type { UserSession } from './types.ts';
import { supabase } from './lib/supabase.ts';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recupera sessão do LocalStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedClient = localStorage.getItem('auth_client_id');
    const storedEmail = localStorage.getItem('auth_email');
    const storedNome = localStorage.getItem('auth_nome');

    if (storedToken && storedClient && storedEmail) {
      setSession({
        token: storedToken,
        clientId: storedClient,
        email: storedEmail,
        nome: storedNome || undefined
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = (newSession: UserSession) => {
    localStorage.setItem('auth_token', newSession.token);
    localStorage.setItem('auth_client_id', newSession.clientId);
    localStorage.setItem('auth_email', newSession.email);
    if(newSession.nome) localStorage.setItem('auth_nome', newSession.nome);
    setSession(newSession);
  };

  const handleLogout = () => {
    localStorage.clear();
    setSession(null);
  };

  // Renderização condicional
  if (loading) return <div className="setup-screen"><Loader2 className="spin" size={40}/></div>;
  
  if (!supabase) return <div className="setup-screen">Configuração Necessária (Verifique .env)</div>;

  return session 
    ? <Dashboard session={session} onLogout={handleLogout} /> 
    : <AuthPage onLoginSuccess={handleLogin} />;
}