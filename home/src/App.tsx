import { MessageCircle, Link2, Dumbbell, TrendingUp, BarChart3, Clock, Target, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import './App.css'; 
import logoImg from './assets/logorepmind.png';


function App() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => window.removeEventListener('scroll', handleScroll);
    clearTimeout(timer);
  }, []);

  const whatsappNumber = "554188486855";
  const whatsappMessage = encodeURIComponent("Olá! Quero começar a rastrear meu progresso com RepMind IA.");
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (

    
    <div> {/* A classe base está no body no CSS */}

      {/* --- TELA DE CARREGAMENTO --- */}
      {/* Mantemos o elemento no DOM mas mudamos a classe para fazer o fade-out */}
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
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Começar Agora
          </a>
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

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-large animate-fade-in-up delay-300"
          >
            <MessageCircle size={24} />
            Comece a Rastrear Seu Progresso Agora
          </a>

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

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              A Evolução em <span className="text-primary">4 Passos Simples</span>
            </h2>
            <p className="section-desc">
              Do primeiro contato aos seus gráficos de progresso
            </p>
          </div>

          <div className="grid-2">
            {/* Passo 1 */}
            <div className="step-card">
              <div className="step-number">1</div>
              <MessageCircle className="icon-large" />
              <h3 className="card-title">Início no WhatsApp</h3>
              <p className="card-text">
                Envie uma mensagem para o RepMind IA no WhatsApp.
                Simples como conversar com um amigo.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="step-card">
              <div className="step-number">2</div>
              <Link2 className="icon-large" />
              <h3 className="card-title">Cadastro de Treino</h3>
              <p className="card-text">
                Receba um link único. Acesse o site e cadastre seu treino
                (A, B, C ou quantos precisar). Configure uma vez.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="step-card">
              <div className="step-number">3</div>
              <Dumbbell className="icon-large" />
              <h3 className="card-title">Registro em Tempo Real</h3>
              <p className="card-text">
                Durante o treino, anote as cargas de cada exercício direto no
                chat do WhatsApp. Rápido e sem complicação.
              </p>
            </div>

            {/* Passo 4 */}
            <div className="step-card">
              <div className="step-number">4</div>
              <TrendingUp className="icon-large" />
              <h3 className="card-title">Análise e Evolução</h3>
              <p className="card-text">
                Acesse gráficos detalhados de evolução de cargas e volume de treino.
                Compare seu progresso ao longo do tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'linear-gradient(to bottom, transparent, rgba(74, 144, 226, 0.05), transparent)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Por Que <span className="text-primary">RepMind IA</span>?
            </h2>
            <p className="section-desc">
              Dados inteligentes para resultados reais
            </p>
          </div>

          <div className="grid-3">
            <div className="feature-card">
              <BarChart3 className="icon-medium" />
              <h3 className="card-title">Comparação de Cargas</h3>
              <p className="card-text">
                Visualize sua progressão de força em cada exercício com gráficos claros e objetivos.
              </p>
            </div>

            <div className="feature-card">
              <TrendingUp className="icon-medium" />
              <h3 className="card-title">Evolução de Volume</h3>
              <p className="card-text">
                Acompanhe o volume total de treino e identifique padrões de crescimento ao longo das semanas.
              </p>
            </div>

            <div className="feature-card">
              <MessageCircle className="icon-medium" />
              <h3 className="card-title">Conveniência Total</h3>
              <p className="card-text">
                Use o app que você já tem no celular. Sem necessidade de baixar ou aprender nada novo.
              </p>
            </div>

            <div className="feature-card">
              <Clock className="icon-medium" />
              <h3 className="card-title">Anotação Rápida</h3>
              <p className="card-text">
                Registre suas cargas em segundos durante o treino. Foco no que importa: levantar peso.
              </p>
            </div>

            <div className="feature-card">
              <Target className="icon-medium" />
              <h3 className="card-title">Dados Inteligentes</h3>
              <p className="card-text">
                IA processa suas informações e gera insights automáticos sobre seu desempenho.
              </p>
            </div>

            <div className="feature-card">
              <Zap className="icon-medium" />
              <h3 className="card-title">Zero Fricção</h3>
              <p className="card-text">
                Esqueça planilhas complicadas. RepMind IA cuida de tudo automaticamente para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              Seus Dados, <span className="text-primary">Seus Ganhos</span>
            </h2>
            <p className="section-desc">
              Visualize sua evolução de forma clara e motivadora
            </p>
          </div>

          <div className="grid-2">
            <div className="data-card">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                <h3 className="card-title">Volume de Treino</h3>
                <TrendingUp className="text-primary" size={32} />
              </div>
              <div>
                <div className="chart-bars">
                  <div className="bar" style={{height: '40%', opacity: 0.2}}></div>
                  <div className="bar" style={{height: '55%', opacity: 0.3}}></div>
                  <div className="bar" style={{height: '70%', opacity: 0.4}}></div>
                  <div className="bar" style={{height: '85%', opacity: 0.6}}></div>
                  <div className="bar" style={{height: '100%', opacity: 1}}></div>
                </div>
                <p className="card-text" style={{fontSize: '0.875rem', marginTop: '1rem'}}>
                  Acompanhe o volume total levantado semana a semana
                </p>
              </div>
            </div>

            <div className="data-card">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                <h3 className="card-title">Evolução de Cargas</h3>
                <BarChart3 className="text-primary" size={32} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {/* Linha 1 */}
                <div className="progress-row">
                  <span style={{width: '6rem', color: '#9ca3af', fontSize: '0.875rem'}}>Supino</span>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-primary" style={{fontSize: '0.875rem', fontWeight: 600}}>+12%</span>
                </div>
                {/* Linha 2 */}
                <div className="progress-row">
                  <span style={{width: '6rem', color: '#9ca3af', fontSize: '0.875rem'}}>Agachamento</span>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{width: '92%'}}></div>
                  </div>
                  <span className="text-primary" style={{fontSize: '0.875rem', fontWeight: 600}}>+18%</span>
                </div>
                {/* Linha 3 */}
                <div className="progress-row">
                  <span style={{width: '6rem', color: '#9ca3af', fontSize: '0.875rem'}}>Levantamento</span>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{width: '76%'}}></div>
                  </div>
                  <span className="text-primary" style={{fontSize: '0.875rem', fontWeight: 600}}>+9%</span>
                </div>
              </div>
              <p className="card-text" style={{fontSize: '0.875rem', marginTop: '1rem'}}>
                Compare a progressão de cada exercício individual
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-box">
          <h2 className="section-title">
            Pronto para o <span className="text-primary">Próximo Nível</span>?
          </h2>
          <p className="section-desc" style={{marginBottom: '2.5rem'}}>
            Comece a rastrear seu progresso hoje e veja seus ganhos acontecerem
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-large"
          >
            <MessageCircle size={24} />
            Iniciar Conversa no WhatsApp
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-content">
          <div className="brand">
            <Target className="text-primary" size={24} />
            <span>RepMind IA</span>
          </div>
          <p className="card-text" style={{fontSize: '0.875rem'}}>
            © 2024 RepMind IA. Transformando treinos em resultados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;