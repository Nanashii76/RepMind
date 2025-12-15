import { MessageCircle, Link2, Dumbbell, TrendingUp, BarChart3, Target, Zap, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import logoImg from '../assets/logorepmind.png';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const whatsappNumber = "554188486855";
  const whatsappMessage = encodeURIComponent("Olá! Quero começar a rastrear meu progresso com RepMind IA.");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div>
      {/* TELA DE CARREGAMENTO */}
      <div className={`loader-overlay ${!isLoading ? 'loader-hidden' : ''}`}>
        <div className="loader-content">
          <img src={logoImg} alt="RepMind Logo" className="loader-logo-img" />
          <div className="loader-bar"></div>
        </div>
      </div>

      <nav className={`navbar ${scrollY > 50 ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="brand">
            <Target className="text-primary" size={32} />
            <span>RepMind IA</span>
          </div>
          
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            {/* LINK PARA O GUIA */}
            <Link to="/guia" className="nav-link" style={{marginRight: '1rem', fontWeight: 500}}>
              Como Funciona
            </Link>
            
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Começar Agora
            </a>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="absolute-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        <div className="hero-content">
          <div className="badge animate-fade-in">
            <Zap className="text-primary" size={16} />
            <span>Rastreamento Inteligente de Treino</span>
          </div>

          <h1 className="hero-title animate-fade-in-up">
            Seu Treino,<br />
            <span className="text-primary">Seus Dados</span>,<br />
            Sua Evolução.
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-200">
            Transforme suas anotações de treino em insights de evolução automática.
            Tudo isso direto do seu <span className="text-primary font-bold">WhatsApp</span>.
          </p>

          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-large animate-fade-in-up delay-300"
            >
              <MessageCircle size={24} />
              Começar Agora
            </a>
            
            {/* Botão Secundário para o Guia */}
            <Link
              to="/guia"
              className="btn-secondary btn-large animate-fade-in-up delay-300"
            >
              <BookOpen size={24} />
              Ver Guia de Uso
            </Link>
          </div>

          <div className="stats-container animate-fade-in-up delay-500">
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">Automático</div>
            </div>
            <div className="divider"></div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Apps Extras</div>
            </div>
            <div className="divider"></div>
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* ... (RESTANTE DO CÓDIGO DA LANDING PAGE - SEÇÕES 4 PASSOS, FEATURES, ETC) ... */}
      {/* Mantenha o restante do código que você enviou aqui, até o footer */}
      
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              A Evolução em <span className="text-primary">4 Passos Simples</span>
            </h2>
            {/* ... Conteúdo dos passos ... */}
          </div>
          
          <div className="grid-2">
            <div className="step-card">
              <div className="step-number">1</div>
              <MessageCircle className="icon-large" />
              <h3 className="card-title">Início no WhatsApp</h3>
              <p className="card-text">Envie uma mensagem para o RepMind IA. Simples como conversar com um amigo.</p>
            </div>
            {/* ... Outros cards ... */}
            <div className="step-card"><div className="step-number">2</div><Link2 className="icon-large" /><h3 className="card-title">Cadastro</h3><p className="card-text">Receba o link e cadastre seu treino.</p></div>
            <div className="step-card"><div className="step-number">3</div><Dumbbell className="icon-large" /><h3 className="card-title">Registro</h3><p className="card-text">Anote cargas durante o treino.</p></div>
            <div className="step-card"><div className="step-number">4</div><TrendingUp className="icon-large" /><h3 className="card-title">Evolução</h3><p className="card-text">Acesse gráficos detalhados.</p></div>
          </div>
        </div>
      </section>

       <section className="section" style={{ background: 'linear-gradient(to bottom, transparent, rgba(74, 144, 226, 0.05), transparent)' }}>
        {/* ... SEÇÃO FEATURES ... */}
        <div className="container">
             <div className="section-header"><h2 className="section-title">Por Que <span className="text-primary">RepMind IA</span>?</h2></div>
             <div className="grid-3">
                <div className="feature-card"><BarChart3 className="icon-medium" /><h3 className="card-title">Comparação</h3><p className="card-text">Visualize progressão.</p></div>
                <div className="feature-card"><TrendingUp className="icon-medium" /><h3 className="card-title">Volume</h3><p className="card-text">Acompanhe volume total.</p></div>
                <div className="feature-card"><MessageCircle className="icon-medium" /><h3 className="card-title">Conveniência</h3><p className="card-text">Use o WhatsApp.</p></div>
             </div>
        </div>
      </section>

      <footer>
        <div className="footer-content">
          <div className="brand">
            <Target className="text-primary" size={24} />
            <span>RepMind IA</span>
          </div>
          <p className="card-text" style={{fontSize: '0.875rem'}}>
            © 2025 RepMind IA. Transformando treinos em resultados.
          </p>
        </div>
      </footer>
    </div>
  );
}