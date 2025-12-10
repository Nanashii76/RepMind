import { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  Info, 
  PlayCircle, 
  X, 
  GripVertical, 
  Menu, 
  HelpCircle,
  ShoppingBag,
  TrendingUp // Ícone para a página de evolução
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { formatarDescricao } from '../utils/formatters';
import type { UserSession, Exercicio, Rotina, ItemRotina } from '../types';
import { HowToUse } from './HowToUse';
import { Tracking } from './Tracking'; // Importando a nova página

interface DashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export function Dashboard({ session, onLogout }: DashboardProps) {
  // --- ESTADOS DE DADOS ---
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [itensRotina, setItensRotina] = useState<ItemRotina[]>([]);
  
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [rotinaSelecionada, setRotinaSelecionada] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState<string | null>(null);
  
  // --- ESTADOS DE UI (Mobile e Páginas) ---
  const [sidebarOpen, setSidebarOpen] = useState(false); // Menu Lateral Mobile
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false); // Painel de Detalhes Mobile
  const [showHowToUse, setShowHowToUse] = useState(false); // Página "Como Usar"
  const [showTracking, setShowTracking] = useState(false); // Página "Evolução"

  // --- MODAIS ---
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<Exercicio | null>(null);
  const [formTreino, setFormTreino] = useState({ series: '3', reps: '12', descanso: '60s' });
  const [modalNovaRotinaOpen, setModalNovaRotinaOpen] = useState(false);
  const [nomeNovaRotina, setNomeNovaRotina] = useState('');

  // --- REFS (Drag & Drop) ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 1. Buscar Dados Iniciais
  useEffect(() => {
    if (!supabase) return;
    async function fetchDados() {
      const { data: exData } = await supabase!.from('exercicios_normalizados').select('*');
      if (exData) setExercicios(exData);

      const { data: rotData } = await supabase!
        .from('rotinas_treino')
        .select('*')
        .eq('cliente_id', session.clientId);
      if (rotData) setRotinas(rotData);
    }
    fetchDados();
  }, [session.clientId]);

  // 2. Buscar Itens da Rotina
  useEffect(() => {
    if (!supabase || !rotinaSelecionada) return;
    async function fetchItens() {
      const { data } = await supabase!
        .from('exercicios_rotina')
        .select(`*, exercicios_normalizados (*)`)
        .eq('rotina_id', rotinaSelecionada)
        .order('ordem');
      
      if (data) {
        // Ordenação numérica no front para garantir
        const itensOrdenados = data.sort((a: any, b: any) => Number(a.ordem) - Number(b.ordem));
        
        const itensFormatados = itensOrdenados.map((item: any) => ({
          ...item,
          exercicio_detalhes: item.exercicios_normalizados
        }));
        setItensRotina(itensFormatados);
      }
    }
    fetchItens();
  }, [rotinaSelecionada]);

  // --- LÓGICA DRAG & DROP ---
  const handleSort = async () => {
    let _itensRotina = [...itensRotina];
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const draggedItemContent = _itensRotina.splice(dragItem.current, 1)[0];
    _itensRotina.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    setItensRotina(_itensRotina);

    if(!supabase) return;
    const updates = _itensRotina.map((item, index) => ({
      id: item.id,
      ordem: index.toString(),
    }));

    await Promise.all(updates.map(u => 
      supabase!.from('exercicios_rotina').update({ ordem: u.ordem }).eq('id', u.id)
    ));
  };

  // --- AÇÕES ---
  const criarRotina = async () => {
    if (!supabase || !nomeNovaRotina) return;
    const { data } = await supabase.from('rotinas_treino')
      .insert([{ titulo: nomeNovaRotina, cliente_id: session.clientId }])
      .select();
    if (data) {
      setRotinas([...rotinas, data[0]]);
      setModalNovaRotinaOpen(false);
      setNomeNovaRotina('');
    }
  };

  const adicionarExercicio = async () => {
    if (!supabase || !exercicioSelecionado || !rotinaSelecionada) return;
    const { data } = await supabase.from('exercicios_rotina').insert([{
        rotina_id: rotinaSelecionada,
        exercicio_id: exercicioSelecionado.id,
        qtd_series: formTreino.series,
        qtd_repeticoes: formTreino.reps,
        tempo_descanso: formTreino.descanso,
        ordem: (itensRotina.length + 1).toString()
      }]).select();

    if (data) {
      const novoItem = { ...data[0], exercicio_detalhes: exercicioSelecionado };
      setItensRotina([...itensRotina, novoItem]);
      setModalAddOpen(false);
    }
  };

  const removerItem = async (id: string) => {
    if (!supabase) return;
    await supabase.from('exercicios_rotina').delete().eq('id', id);
    setItensRotina(itensRotina.filter(i => i.id !== id));
  };

  // Helpers de Filtro e UI
  const gruposMusculares = Array.from(new Set(exercicios.map(ex => ex.grupo_muscular))).sort();
  
  const exerciciosFiltrados = exercicios.filter(ex => {
    const matchBusca = ex.nome.toLowerCase().includes(termoBusca.toLowerCase());
    const matchGrupo = filtroGrupo ? ex.grupo_muscular === filtroGrupo : true;
    return matchBusca && matchGrupo;
  });

  const abrirDetalhes = (ex: Exercicio) => { setExercicioSelecionado(ex); setModalDetalhesOpen(true); };
  
  const abrirAdicionar = (ex: Exercicio) => {
    if(!rotinaSelecionada) return alert("Selecione uma rotina primeiro!");
    setExercicioSelecionado(ex);
    setModalAddOpen(true);
  };

  // --- RENDERIZAÇÃO DE PÁGINAS ---
  
  if (showHowToUse) {
    return <HowToUse onBack={() => setShowHowToUse(false)} />;
  }

  if (showTracking) {
    return <Tracking session={session} onBack={() => setShowTracking(false)} />;
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          {/* Botão Menu Mobile */}
          <button className="btn-menu-mobile" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu />
          </button>
          <div className="logo"><Dumbbell className="text-primary" /> Rap<span>mind</span></div>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          
          {/* Botão Evolução (Tracking) */}
          <button 
            onClick={() => setShowTracking(true)} 
            className="btn-icon" 
            title="Minha Evolução"
            style={{color: 'var(--text-muted)', background: 'transparent'}}
          >
            <TrendingUp size={20} />
          </button>

          {/* Botão Ajuda */}
          <button 
            onClick={() => setShowHowToUse(true)} 
            className="btn-icon" 
            title="Como usar" 
            style={{color: 'var(--text-muted)', background: 'transparent'}}
          >
            <HelpCircle size={20} />
          </button>

          <div className="user-badge">{session.nome || session.email}</div>
          <button className="btn-logout" onClick={onLogout} title="Sair"><X size={16}/></button>
        </div>
      </header>

      <div className="main">
        {/* OVERLAY MOBILE */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span>Minhas Rotinas</span>
            <button onClick={() => setModalNovaRotinaOpen(true)} className="btn-icon-add"><Plus size={20}/></button>
          </div>
          <div className="rotinas-list">
            {rotinas.map(rot => (
              <div key={rot.id} 
                className={`rotina-item ${rotinaSelecionada === rot.id ? 'active' : ''}`}
                onClick={() => {
                  setRotinaSelecionada(rot.id);
                  setSidebarOpen(false); 
                  setMobileDetailsOpen(true); // Abre painel ao selecionar no mobile
                }}
              >
                <span className="truncate">{rot.titulo}</span> {rotinaSelecionada === rot.id && <ChevronRight size={16} />}
              </div>
            ))}
          </div>
        </aside>

        {/* CATÁLOGO */}
        <section className="catalog">
          <div className="catalog-header">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input className="search-bar" placeholder="Buscar exercício..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />
            </div>
            <div className="filters-container">
              <button className={`filter-chip ${filtroGrupo === null ? 'active' : ''}`} onClick={() => setFiltroGrupo(null)}>Todos</button>
              {gruposMusculares.map(grupo => (
                <button key={grupo} className={`filter-chip ${filtroGrupo === grupo ? 'active' : ''}`} onClick={() => setFiltroGrupo(grupo)}>{grupo}</button>
              ))}
            </div>
          </div>

          <div className="exercises-grid">
            {exerciciosFiltrados.map(ex => (
              <div key={ex.id} className="exercise-card">
                <div className="card-header">
                  <span className="badge">{ex.grupo_muscular}</span>
                  <button className="btn-info" onClick={() => abrirDetalhes(ex)}><Info size={18} /></button>
                </div>
                <h3>{ex.nome}</h3>
                <button className="btn-add-card" onClick={() => abrirAdicionar(ex)}><Plus size={16} /> Adicionar</button>
              </div>
            ))}
          </div>

          {/* Botão Flutuante (FAB) Mobile */}
          {rotinaSelecionada && !mobileDetailsOpen && (
            <button className="fab-routine-counter" onClick={() => setMobileDetailsOpen(true)}>
              <ShoppingBag size={20} /> 
              <span>Ver Treino ({itensRotina.length})</span>
            </button>
          )}
        </section>

        {/* PAINEL DIREITO */}
        {rotinaSelecionada && (
          <aside className={`routine-details ${mobileDetailsOpen ? 'mobile-open' : ''}`}>
            <div className="routine-header">
              <div className="rh-title">
                <h3>{rotinas.find(r => r.id === rotinaSelecionada)?.titulo}</h3>
                <span className="routine-count">{itensRotina.length} exercícios</span>
              </div>
              <button className="btn-close-panel" onClick={() => { setRotinaSelecionada(null); setMobileDetailsOpen(false); }}>
                <X size={20} />
              </button>
            </div>

            {/* Botão para minimizar e adicionar (Aparece só no Mobile) */}
            <div className="mobile-only-block" style={{padding: '0 1rem 1rem'}}>
              <button 
                className="btn-primary full" 
                onClick={() => setMobileDetailsOpen(false)}
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
              >
                <Plus size={18} /> Adicionar Exercícios
              </button>
            </div>

            <div className="routine-items-list">
              {itensRotina.map((item, index) => (
                <div key={item.id} 
                  className="routine-item-card"
                  draggable
                  onDragStart={() => (dragItem.current = index)}
                  onDragEnter={() => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="ric-header">
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <GripVertical size={16} className="grip-icon" />
                      <strong>{item.exercicio_detalhes?.nome}</strong>
                    </div>
                    <button className="btn-delete" onClick={() => removerItem(item.id)}><Trash2 size={16} /></button>
                  </div>
                  <div className="ric-specs">
                    <span>{item.qtd_series} x {item.qtd_repeticoes}</span><span>⏱ {item.tempo_descanso}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* --- MODAIS --- */}
      {modalAddOpen && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header"><h3>Configurar</h3><button className="btn-close" onClick={() => setModalAddOpen(false)}><X size={20}/></button></div>
            <div className="form-grid">
              <div className="form-group"><label>Séries</label><input value={formTreino.series} onChange={e => setFormTreino({...formTreino, series: e.target.value})} /></div>
              <div className="form-group"><label>Reps</label><input value={formTreino.reps} onChange={e => setFormTreino({...formTreino, reps: e.target.value})} /></div>
              <div className="form-group"><label>Descanso</label><input value={formTreino.descanso} onChange={e => setFormTreino({...formTreino, descanso: e.target.value})} /></div>
            </div>
            <div className="modal-actions"><button className="btn-primary full" onClick={adicionarExercicio}>Salvar</button></div>
          </div>
        </div>
      )}

      {modalDetalhesOpen && exercicioSelecionado && (
        <div className="overlay" onClick={() => setModalDetalhesOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-col"><span className="badge-lg">{exercicioSelecionado.grupo_muscular}</span><h3>{exercicioSelecionado.nome}</h3></div>
              <button className="btn-close" onClick={() => setModalDetalhesOpen(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              {/* Ajuste importante: uso de video_url conforme definido nos seus types */}
              {exercicioSelecionado.link_video ? (
                <div className="video-wrapper"><iframe src={exercicioSelecionado.link_video.replace("watch?v=", "embed/")} title="Video" frameBorder="0" allowFullScreen></iframe></div>
              ) : (
                <div className="video-placeholder"><PlayCircle size={48} opacity={0.5} /><p>Sem vídeo</p></div>
              )}
              <div className="description-box">
                <h4>Execução</h4>
                <div className="steps-container">{formatarDescricao(exercicioSelecionado.descricao)}</div>
              </div>
            </div>
            <div className="modal-actions">
               <button className="btn-primary full" onClick={() => { setModalDetalhesOpen(false); abrirAdicionar(exercicioSelecionado); }}>Adicionar à Rotina</button>
            </div>
          </div>
        </div>
      )}

      {modalNovaRotinaOpen && (
        <div className="overlay">
          <div className="modal">
            <h3>Nova Rotina</h3>
            <div className="form-group"><label>Nome</label><input autoFocus value={nomeNovaRotina} onChange={e => setNomeNovaRotina(e.target.value)} /></div>
            <div className="modal-actions">
               <button className="btn-secondary" onClick={() => setModalNovaRotinaOpen(false)}>Cancelar</button>
               <button className="btn-primary" onClick={criarRotina}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}