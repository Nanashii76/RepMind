import { useState } from 'react';
import { Dumbbell, ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import type { UserSession } from '../types.ts';

const WEBHOOK_AUTH = "https://webhook.donatopaez.com.br/webhook/7d71cb5d-f939-40db-9008-065902a1bccb";
const WEBHOOK_VERIFY = "https://webhook.donatopaez.com.br/webhook/3b04b504-4e82-46ea-9383-03fdc3162b06";

interface AuthPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendEmail = async () => {
    if (!email) return setError("Digite seu email.");
    setLoading(true); setError('');
    
    try {
      const res = await fetch(WEBHOOK_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) setStep('code');
      else setError("Erro ao enviar. Verifique o email.");
    } catch {
      setError("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return setError("Digite o código.");
    setLoading(true); setError('');

    try {
      const res = await fetch(WEBHOOK_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json();
      
      if (data.token && data.clientId) {
        onLoginSuccess({
          token: data.token,
          clientId: data.clientId,
          email: email,
          nome: data.nome
        });
      } else {
        setError("Código inválido.");
      }
    } catch {
      setError("Erro ao validar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo large"><Dumbbell className="text-primary" size={32} /> Rep<span>Mind</span></div>
          <p>Acesse suas rotinas personalizadas</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 'email' ? (
          <div className="auth-form">
            <div className="input-with-icon">
              <Mail size={18} />
              <input 
                type="email" placeholder="seu@email.com" 
                value={email} onChange={e => setEmail(e.target.value)} 
                autoFocus onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
              />
            </div>
            <button className="btn-primary full" onClick={handleSendEmail} disabled={loading}>
              {loading ? <Loader2 className="spin" /> : <>Receber Código <ArrowRight size={18} /></>}
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <p className="auth-instrucao">Código enviado para <strong>{email}</strong></p>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="text" placeholder="000000" 
                value={code} onChange={e => setCode(e.target.value)} 
                autoFocus onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
              />
            </div>
            <button className="btn-primary full" onClick={handleVerifyCode} disabled={loading}>
              {loading ? <Loader2 className="spin" /> : "Entrar"}
            </button>
            <button className="btn-link" onClick={() => setStep('email')}>Corrigir Email</button>
          </div>
        )}
      </div>
    </div>
  );
}