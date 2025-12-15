import React, { useEffect } from 'react';
import { MessageCircle, Zap, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatDemo from '../components/ChatDemo'
import '../styles/App.css'; 

const Guide: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, []);

  const whatsappNumber = "554188486855";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Quero%20começar`;

  return (
    <div>
      <nav className="navbar scrolled">
        <div className="navbar-content">
          <div className="brand">
            <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
               <ArrowLeft size={20} />
               <span>Voltar para Home</span>
            </Link>
          </div>
          <div className="brand">
            <Zap className="text-primary" size={24} />
            <span>Manual Interativo</span>
          </div>
        </div>
      </nav>

      <div className="main-layout container">
        {/* CONTEÚDO */}
        <div className="content-column">
          <section className="hero-section-left">
            <div className="badge animate-fade-in">
              <HelpCircle className="text-primary" size={16} />
              <span>Tutorial Prático</span>
            </div>
            <h1 className="hero-title animate-fade-in-up">
              Aprenda a usar a <br />
              <span className="text-primary">RepMind IA</span>
            </h1>
            <p className="hero-subtitle animate-fade-in-up delay-200">
              Teste os comandos no <strong>simulador ao lado</strong>.
            </p>
          </section>

          <div className="divider-h"></div>

          {/* Passos do Guia */}
          <section className="step-section animate-fade-in-up delay-300">
            <div className="step-badge">1</div>
            <h2 className="step-title">Inicie o Treino</h2>
            <p className="step-text">Ao chegar na academia, avise a IA para carregar suas fichas.</p>
            <div className="action-box">
              <p>👉 <strong>Tente no chat:</strong></p>
              <code className="command-code">Iniciar treino</code>
            </div>
          </section>

          <section className="step-section animate-fade-in-up delay-300">
            <div className="step-badge">2</div>
            <h2 className="step-title">Registre a Carga</h2>
            <p className="step-text">Envie o nome do exercício, peso e repetições.</p>
            <div className="action-box">
              <p>👉 <strong>Tente enviar:</strong></p>
              <code className="command-code">Supino 30kg 12 reps</code>
            </div>
          </section>

          <div className="cta-box-left">
            <h3>Pronto para começar?</h3>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary btn-large">
              <MessageCircle size={20} />
              Ir para o WhatsApp Real
            </a>
          </div>
        </div>

        {/* SIDEBAR DO CHAT */}
        <div className="sidebar-column">
          <ChatDemo />
        </div>
      </div>
    </div>
  );
}

export default Guide;