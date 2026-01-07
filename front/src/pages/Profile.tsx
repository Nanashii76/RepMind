import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Save, LogOut, AlertTriangle, CheckCircle, Loader2, KeyRound, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserSession } from '../types';

const WEBHOOK_REQUEST_EMAIL = "https://webhook.donatopaez.com.br/webhook/92f072f7-8ab7-45b7-a171-cde52524874f"; 
const WEBHOOK_CONFIRM_EMAIL = "https://webhook.donatopaez.com.br/webhook/d8d43c38-e64b-4fc3-a837-b02ba5c6c0f6";

interface ProfileProps {
  session: UserSession;
  onBack: () => void;
  onLogout: () => void;
  onUpdateSession: (newName: string) => void;
}

export function Profile({ session, onBack, onLogout, onUpdateSession }: ProfileProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Estados do Perfil
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Dados Originais
  const [initialEmail, setInitialEmail] = useState('');

  // Validação de Token
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [token, setToken] = useState('');

  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: cliente } = await supabase!
          .from('clientes')
          .select('nome, email, telefone')
          .eq('id', session.clientId)
          .single();

        if (cliente) {
          setNome(cliente.nome || '');
          setTelefone(cliente.telefone || '');
          
          const emailBase = cliente.email || session.email;
          setEmail(emailBase);
          setInitialEmail(emailBase);
        }
      } catch (error) {
        console.error("Erro perfil:", error);
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [session.clientId, session.email]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await supabase!
        .from('clientes')
        .update({ 
          nome: nome,
          telefone: telefone 
        })
        .eq('id', session.clientId);
      
      onUpdateSession(nome);

      const emailLower = email.toLowerCase().trim();
      
      if (emailLower !== initialEmail.toLowerCase()) {
        if (!emailLower.includes('@')) throw new Error("Email inválido.");

        const res = await fetch(WEBHOOK_REQUEST_EMAIL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clientId: session.clientId, 
            oldEmail: initialEmail, 
            newEmail: emailLower,
            phone: telefone
          })
        });

        if (!res.ok) throw new Error("Erro ao solicitar troca de email.");

        setIsVerifyingEmail(true);
        setMessage({ type: 'info', text: `Código enviado para ${emailLower}. Verifique seu email.` });
      } else {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      }

    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToken = async () => {
    if (!token) return setMessage({ type: 'error', text: 'Digite o token.' });
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_CONFIRM_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: session.clientId, 
          token: token.toUpperCase(),
          newEmail: email,
          oldEmail: initialEmail
        })
      });

      const data = await res.json();

      if (res.ok && (data.success || data.sucess === true)) {
        
        setInitialEmail(email); // Efetiva a mudança no frontend
        setIsVerifyingEmail(false);
        setToken('');
        setMessage({ type: 'success', text: 'Email alterado com sucesso!' });
        
      } else {
        throw new Error(data.message || "Token inválido ou expirado.");
      }

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro na validação.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="setup-screen"><Loader2 className="spin text-primary" size={40}/></div>;
  }

  return (
    <div className="app-container">
      <header className="header">
        <button onClick={onBack} className="btn-secondary" style={{width: 'auto', display:'flex', gap: 5}}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="logo">Meu <span>Perfil</span></div>
        <div style={{width: 80}}></div>
      </header>

      <div className="main" style={{flexDirection: 'column', padding: '1.5rem', overflowY: 'auto', alignItems: 'center'}}>
        
        <div className="profile-card">
          <div className="profile-avatar"><User size={40} /></div>
          
          {!isVerifyingEmail ? (
            <>
              <h2 className="profile-name">{nome || 'Usuário'}</h2>
              <p className="profile-email">{initialEmail}</p>
            </>
          ) : (
            <>
              <h2 className="profile-name">Validar Email</h2>
              <p className="profile-email">Confirme a alteração</p>
            </>
          )}

          {message && (
            <div className={`msg-box ${message.type}`}>
              {message.type === 'success' && <CheckCircle size={18}/>}
              {message.type === 'error' && <AlertTriangle size={18}/>}
              {message.type === 'info' && <Mail size={18}/>}
              <span>{message.text}</span>
            </div>
          )}

          {/* FORMULÁRIO PRINCIPAL */}
          {!isVerifyingEmail ? (
            <div className="profile-form">
              <div className="form-group">
                <label>Nome Completo</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome"/>
                </div>
              </div>

              <div className="form-group">
                <label>Telefone / WhatsApp</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" type="tel"/>
                </div>
              </div>

              <div className="form-group">
                <label>Email de Acesso</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input value={email} onChange={e => setEmail(e.target.value.toLowerCase())} placeholder="seu@email.com"/>
                </div>
                {email !== initialEmail && (
                  <small className="warning-text">* Será enviado um token de confirmação.</small>
                )}
              </div>

              <button className="btn-primary full" onClick={handleSave} disabled={loading} style={{marginTop: '1rem'}}>
                {loading ? <Loader2 className="spin" size={20}/> : <><Save size={18}/> Salvar Alterações</>}
              </button>
            </div>
          ) : (
            /* FORMULÁRIO DE TOKEN */
            <div className="profile-form">
              <div className="form-group">
                <label>Token de Validação</label>
                <div className="input-with-icon">
                  <KeyRound size={18} />
                  <input 
                    value={token} 
                    onChange={e => setToken(e.target.value.toUpperCase())} 
                    placeholder="DIGITE O CÓDIGO"
                    maxLength={10}
                    style={{letterSpacing: '3px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase'}}
                  />
                </div>
                <small className="warning-text" style={{color: 'var(--text-muted)', textAlign: 'center', display: 'block'}}>
                  Enviado para: <strong>{email}</strong>
                </small>
              </div>

              <div style={{display:'flex', gap:'10px'}}>
                <button 
                  className="btn-secondary full" 
                  onClick={() => { setIsVerifyingEmail(false); setEmail(initialEmail); setMessage(null); }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary full" 
                  onClick={handleConfirmToken} 
                  disabled={loading || !token}
                >
                  {loading ? <Loader2 className="spin" size={20}/> : "Confirmar"}
                </button>
              </div>
            </div>
          )}

          {!isVerifyingEmail && (
            <>
              <div className="divider"></div>
              <button className="btn-danger-outline full" onClick={onLogout}>
                <LogOut size={18} /> Sair da Conta
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}