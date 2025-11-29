import { ArrowLeft, MessageCircle, Smartphone, Edit, Play, Database, Send } from 'lucide-react';
import '../App.css'; 

interface HowToUseProps {
  onBack: () => void;
}

const WHATSAPP_NUMBER = "554188486855"; 
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Oi,%20quero%20começar`;

export function HowToUse({ onBack }: HowToUseProps) {
  return (
    <div className="app-container">
      {/* HEADER SIMPLIFICADO */}
      <header className="header">
        <button onClick={onBack} className="btn-secondary" style={{width: 'auto', display:'flex', gap: 5}}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="logo">Manual do <span>Agente</span></div>
        <div style={{width: 80}}></div> {/* Espaçador */}
      </header>

      <div className="main" style={{overflowY: 'auto', flexDirection: 'column', padding: '0'}}>
        
        {/* HERO SECTION */}
        <section className="howto-hero">
          <h1>Seu Personal Trainer no WhatsApp</h1>
          <p>
            O <strong>RepMind</strong> funciona de forma integrada. Você monta seus treinos aqui no site, 
            e o nosso Agente IA te acompanha na academia pelo WhatsApp.
          </p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-whatsapp">
            <MessageCircle size={20} /> Iniciar Conversa no WhatsApp
          </a>
        </section>

        {/* GRID DE INSTRUÇÕES */}
        <div className="howto-grid">
          
          {/* CARD 1: O QUE FAZER ONDE */}
          <div className="howto-card">
            <div className="card-icon"><Database size={24} /></div>
            <h3>1. A Regra de Ouro</h3>
            <p>Para manter tudo organizado, dividimos as funções:</p>
            <div className="comparison">
              <div className="comp-item website">
                <Edit size={16} />
                <strong>No Site (Aqui)</strong>
                <span>Criar Rotinas</span>
                <span>Adicionar Exercícios</span>
                <span>Editar Séries/Reps</span>
              </div>
              <div className="comp-item whatsapp">
                <Smartphone size={16} />
                <strong>No WhatsApp</strong>
                <span>Iniciar Treino</span>
                <span>Registrar Cargas</span>
                <span>Tirar Dúvidas</span>
              </div>
            </div>
          </div>

          {/* CARD 2: CONSULTAS */}
          <div className="howto-card">
            <div className="card-icon"><MessageCircle size={24} /></div>
            <h3>2. Consultando Treinos</h3>
            <p>Esqueceu o que tem no treino de hoje? É só perguntar.</p>
            
            <div className="chat-simulation">
              <div className="bubble user">O que tem no treino de perna?</div>
              <div className="bubble bot">
                No Treino de Perna constam:<br/>
                1. Agachamento Livre<br/>
                2. Leg Press 45...
              </div>
              <div className="bubble user">Como faz o Agachamento?</div>
              <div className="bubble bot">
                [Envia Vídeo do Exercício]<br/>
                Mantenha a coluna reta e desça até...
              </div>
            </div>
          </div>

          {/* CARD 3: TREINANDO */}
          <div className="howto-card highlight">
            <div className="card-icon"><Play size={24} /></div>
            <h3>3. Modo Treino (Log)</h3>
            <p>Quando chegar na academia, avise o agente para começar a registrar.</p>
            
            <div className="chat-simulation">
              <div className="bubble user">Quero treinar</div>
              <div className="bubble bot">Qual rotina vamos fazer hoje?</div>
              <div className="bubble user">Treino A</div>
              <div className="bubble bot">Sessão iniciada! Qual o primeiro exercício?</div>
              <div className="bubble user">Supino reto 30kg 12 reps</div>
              <div className="bubble bot">✅ Série registrada!</div>
              <div className="bubble user">Finalizar treino</div>
            </div>
          </div>

          {/* CARD 4: DICAS PRO */}
          <div className="howto-card">
            <div className="card-icon"><Send size={24} /></div>
            <h3>4. Dicas de Comandos</h3>
            <ul className="tips-list">
              <li>
                <strong>Seja natural:</strong> Você pode falar "Fiz 10 reps com 20kg no supino" ou apenas "Supino 20kg 10". O agente entende.
              </li>
              <li>
                <strong>Edição:</strong> Se tentar mudar um treino pelo WhatsApp, o agente vai te mandar o link deste site.
              </li>
              <li>
                <strong>Dúvidas Gerais:</strong> Pergunte sobre "creatina", "dor muscular" ou qualquer tema fitness. Ele usa inteligência artificial para responder.
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}