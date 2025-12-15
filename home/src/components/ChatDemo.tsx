import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, RefreshCw, Smartphone } from 'lucide-react';
import '../styles/App.css';

// Definição do tipo para as mensagens
interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user'; // Union type para restringir os valores
}

const ChatDemo: React.FC = () => {
  // Estado inicial tipado
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Olá! Sou a versão Demo do RepMind.\nDigite 'Iniciar treino' para testar.", sender: 'bot' }
  ]);
  
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Ref tipada para elementos HTML
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- "CÉREBRO" DA DEMO ---
  const getBotResponse = (text: string): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('iniciar treino') || lowerText.includes('iniciar')) {
      return "Ótimo! 💪 Vamos começar. Qual rotina você vai fazer hoje?\n\n1. Treino A (Peito/Tríceps)\n2. Treino B (Costas/Bíceps)\n3. Treino C (Pernas)";
    }
    
    if (lowerText.includes('treino a') || lowerText.includes('1') || lowerText.includes('peito')) {
      return "Sessão Iniciada: Treino A 🚀\n\nO primeiro exercício é *Supino Reto*.\n\nQuando terminar a série, me mande a carga e repetições (Ex: 'Supino 30kg 12 reps').";
    }

    // Regex simples para capturar números
    if (/\d+/.test(lowerText) && (lowerText.includes('kg') || lowerText.includes('reps') || lowerText.includes('30') || lowerText.includes('12'))) {
      return "✅ Série registrada com sucesso!\n\nPróximo: *Crucifixo na Polia*.\nDescanse 60s e manda bala!";
    }

    if (lowerText.includes('como faz') || lowerText.includes('execução') || lowerText.includes('video')) {
      return "🎥 Aqui está o vídeo da execução correta:\n\n[▶️ Vídeo Simulado]\n\nMantenha a postura e controle a descida!";
    }

    if (lowerText.includes('finalizar') || lowerText.includes('acabei')) {
      return "Treino finalizado! 🎉\n\n📋 Resumo:\nVolume Total: 4.500kg\nDuração: 45min\n\nAté a próxima!";
    }

    return "Não entendi. Tente comandos como 'Iniciar treino', 'Supino 30kg 12reps' ou 'Como faz agachamento'.";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponseText = getBotResponse(userMsg.text);
      const botMsg: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  // Tipagem do evento de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const resetChat = () => {
    setMessages([{ id: 1, text: "Olá! Digite 'Iniciar treino'", sender: 'bot' }]);
  };

  // Tipagem do evento de mudança de input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="sticky-chat-container">
      <div className="demo-chat-window">
        {/* Header */}
        <div className="demo-chat-header">
          <div className="flex-row">
            <div className="chat-avatar-small">
              <Zap size={16} />
            </div>
            <div>
              <span className="font-bold block text-sm">RepMind Demo</span>
              <span className="status-indicator">Online</span>
            </div>
          </div>
          <button onClick={resetChat} className="reset-btn" title="Reiniciar conversa">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="demo-chat-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`demo-message ${msg.sender}`}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>{line}<br/></span>
              ))}
            </div>
          ))}
          {isTyping && (
            <div className="demo-message bot typing">
              <span>.</span><span>.</span><span>.</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="demo-chat-footer">
          <input
            type="text"
            placeholder="Digite aqui..."
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="demo-input"
          />
          <button onClick={handleSend} className="demo-send-btn">
            <Send size={18} />
          </button>
        </div>
      </div>
      
      <div className="demo-note">
        <Smartphone size={14} style={{display: 'inline', marginRight: '5px'}}/>
        Isso é apenas uma demonstração.
      </div>
    </div>
  );
};

export default ChatDemo;